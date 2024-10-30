import {
    ExplainAnswer,
    ExplainQuestion, ExplainQuestionType,
    ExplicitDecision, MakeManyDecisionsResult, MakeManyDecisionsMode, SessionContext
} from "../../contract/Types";
import {ConfigurationSessionState, FullQualifiedConfigurationSessionState} from "../model/ConfigurationSessionState";
import {ConnectionError, ConfiguratorError, ServerError, ConfiguratorErrorType} from "../../contract/ConfiguratorError";
import {E, I, identity, O, pipe, RA, T, TaskEither, TE} from "@viamedici-spc/fp-ts-extensions";
import {getApiClient, getServerSideSessionCreationApiClient} from "../EngineApiClient";
import * as DtoE from "../mapper/DomainToEngineMapping";
import * as EtoD from "../mapper/EngineToDomainMapping";
import * as ResponseHandling from "./EngineResponseHandling";
import {match, P} from "ts-pattern";
import * as Engine from "../../apiClient/engine/Engine";
import {sequenceS} from "fp-ts/Apply";
import {
    processConstraintsExplainResult,
    processDecisionsExplainResult,
    processExplainResult
} from "./EngineResponseHandling";
import {none, Option} from "fp-ts/Option";
import {getAllExplicitDecisions, merge} from "./ConfigurationRawData";
import ConfigurationRawData from "../model/ConfigurationRawData";
import {shouldSkipMakeDecision, shouldSkipMakeManyDecisions} from "../Guards";
import Logger from "../../contract/Logger";

export type EngineSuccessResultT<T> = {
    sessionState: FullQualifiedConfigurationSessionState;
    result: T;
};
export type EngineErrorResult = {
    error: ConfiguratorError;
    sessionState: ConfigurationSessionState | null;
}

const DefaultHeaders: HeadersInit = {
    "Accept": "application/json",
};

export function createSession(sessionContext: SessionContext): TaskEither<ConfiguratorError, FullQualifiedConfigurationSessionState> {
    const hcaApiClient = getApiClient(sessionContext.apiBaseUrl);

    const getSessionPostRequest = (sessionPost: Engine.Api<unknown>["session"]["sessionPost"], additionalHeaders?: HeadersInit) =>
        request(() => sessionPost(DtoE.mapSessionContext(sessionContext), {
            headers: {
                ...DefaultHeaders,
                ...additionalHeaders ?? {}
            }
        }));

    return pipe(
        match(sessionContext.sessionInitialisationOptions)
            .with({accessToken: P.string}, c => getSessionPostRequest(hcaApiClient.session.sessionPost, {
                "Authorization": `Bearer ${c.accessToken}`
            }))
            .with({sessionCreateUrl: P.string}, c => getSessionPostRequest(getServerSideSessionCreationApiClient(c.sessionCreateUrl)))
            .exhaustive(),
        TE.map(r => ({
            sessionContext: sessionContext,
            sessionId: r.sessionId!
        })),
        TE.chain(state => {
            const decisions = request(() => hcaApiClient.decision.decisionGetAllDecisions({
                headers: getHeadersForSession(state)
            }));
            const consequences = request(() => hcaApiClient.consequence.consequenceGet({
                headers: getHeadersForSession(state)
            }));
            const meta = (state.sessionContext.provideSourceId ?? false)
                ? request(() => hcaApiClient.meta.metaGet({
                    headers: getHeadersForSession(state)
                }))
                : TE.right(null);

            return pipe(
                sequenceS(TE.ApplicativePar)({
                    decisions: decisions,
                    consequences: consequences,
                    meta: meta,
                }),
                TE.map(r => ResponseHandling.createConfiguration(r.decisions, r.consequences, r.meta)),
                TE.map(r => ({
                    ...state,
                    configuration: r.configuration,
                    configurationRawData: r.rawData
                } satisfies FullQualifiedConfigurationSessionState))
            );
        })
    );
}

export function makeManyDecisions(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode): (sessionState: FullQualifiedConfigurationSessionState) => TaskEither<ConfiguratorError, EngineSuccessResultT<MakeManyDecisionsResult>> {
    const body = DtoE.mapManyDecisions(decisions, mode);

    return sessionState => {
        // Skip the Api call if the decision was already applied.
        if (shouldSkipMakeManyDecisions(decisions, mode.type)) {
            return TE.right({
                sessionState: sessionState,
                result: {
                    rejectedDecisions: []
                }
            } satisfies EngineSuccessResultT<MakeManyDecisionsResult>);
        }

        const apiClient = getApiClient(sessionState.sessionContext.apiBaseUrl);

        return pipe(
            request(() => apiClient.decision.decisionPutMany(body, {
                headers: getHeadersForSession(sessionState)
            }), ResponseHandling.processPutManyDecisionsConflict(decisions, mode)),
            TE.map(r => pipe(
                ResponseHandling.integratePutManyDecisionsResponse(sessionState.configuration, r),
                I.map(t => ({
                    sessionState: {
                        ...sessionState,
                        configurationRawData: merge(sessionState.configurationRawData, t.rawData),
                        configuration: t.configuration
                    } satisfies ConfigurationSessionState,
                    result: t.result
                } satisfies EngineSuccessResultT<MakeManyDecisionsResult>))
            ))
        );
    };
}

export function makeDecision(decision: ExplicitDecision): (sessionState: FullQualifiedConfigurationSessionState) => TaskEither<ConfiguratorError, FullQualifiedConfigurationSessionState> {
    const body = DtoE.mapExplicitDecision(decision);

    return sessionState => {
        // Skip the Api call if the decision was already applied.
        if (shouldSkipMakeDecision(decision, sessionState.configurationRawData)) {
            return TE.right(sessionState);
        }

        const apiClient = getApiClient(sessionState.sessionContext.apiBaseUrl);

        return pipe(
            request(() => apiClient.decision.decisionPutDecision(body, {
                headers: getHeadersForSession(sessionState)
            })),
            TE.map(r => {
                const {
                    configuration,
                    rawData
                } = ResponseHandling.integratePutDecisionResponse(sessionState.configuration, r);
                return {
                    ...sessionState,
                    configuration: configuration,
                    configurationRawData: merge(sessionState.configurationRawData, rawData),
                } satisfies ConfigurationSessionState;
            })
        );
    };
}

export function explain(explainQuestion: ExplainQuestion, answer: "decisions" | "constraints" | "full"): (sessionState: FullQualifiedConfigurationSessionState) => TaskEither<ConfiguratorError, ExplainAnswer> {
    const prepareRequest = <Q extends ExplainQuestion, R>(question: Q, requestMapper: (q: Q) => R,
                                                          dec: (e: Engine.Api<unknown>["explain"]) => (request: R, params: Engine.RequestParams) => Promise<Engine.HttpResponse<Engine.DecisionExplanation[], Engine.Unspecified>>,
                                                          con: (e: Engine.Api<unknown>["explain"]) => (request: R, params: Engine.RequestParams) => Promise<Engine.HttpResponse<Engine.ConstraintExplanation[], Engine.Unspecified>>,
                                                          full: (e: Engine.Api<unknown>["explain"]) => (request: R, params: Engine.RequestParams) => Promise<Engine.HttpResponse<Engine.ExplainResult, Engine.Unspecified>>
    ) => {
        const body = requestMapper(question);

        return (apiClient: Engine.Api<unknown>, params: Engine.RequestParams) =>
            match(answer)
                .with("decisions", () => pipe(
                    request(() => dec(apiClient.explain)(body, params)),
                    TE.map(processDecisionsExplainResult(question))
                ))
                .with("constraints", () => pipe(
                    request(() => con(apiClient.explain)(body, params)),
                    TE.map(processConstraintsExplainResult)
                ))
                .with("full", () => pipe(
                    request(() => full(apiClient.explain)(body, params)),
                    TE.map(processExplainResult(question))
                ))
                .exhaustive();
    };

    const requestPreparation = match(explainQuestion)
        .with({question: ExplainQuestionType.whyIsNotSatisfied}, q =>
            prepareRequest(q, DtoE.mapWhyNotSatisfied, e => e.explainWhyNotSatisfiedDecisions, e => e.explainWhyNotSatisfiedRules, e => e.explainWhyNotSatisfied))
        .with({question: ExplainQuestionType.whyIsStateNotPossible}, q =>
            prepareRequest(q, DtoE.mapWhyStateNotPossible, e => e.explainWhyStateNotPossibleDecisions, e => e.explainWhyStateNotPossibleRules, e => e.explainWhyStateNotPossible))
        .exhaustive();

    return sessionState => {
        const apiClient = getApiClient(sessionState.sessionContext.apiBaseUrl);

        return requestPreparation(apiClient, {
            headers: getHeadersForSession(sessionState)
        });
    };
}

export function closeSession(sessionState: Required<Pick<ConfigurationSessionState, "sessionId" | "sessionContext">>): TaskEither<ConfiguratorError, void> {
    const apiClient = getApiClient(sessionState.sessionContext.apiBaseUrl);

    return request(() => apiClient.session.sessionDelete(sessionState.sessionId));
}

export function setSessionContext(newSessionContext: SessionContext): (sessionState: ConfigurationSessionState) => TaskEither<EngineErrorResult, FullQualifiedConfigurationSessionState> {
    return sessionState =>
        reinitialize({
            ...sessionState,
            sessionContext: newSessionContext,
        });
}

export function reinitialize(sessionState: ConfigurationSessionState): TaskEither<EngineErrorResult, FullQualifiedConfigurationSessionState> {
    // Close the old session because a new SessionContext cannot be applied to an existing session.
    // Discard the result.
    if (sessionState.sessionId) {
        closeSession({...sessionState, sessionId: sessionState.sessionId})();
    }

    return pipe(
        // Session was closed. In any case the SessionId is removed from the state.
        {
            ...sessionState,
            sessionId: undefined
        } satisfies ConfigurationSessionState,
        I.map(sessionState => pipe(
            createSessionWithData(sessionState.sessionContext, sessionState.configurationRawData),
            TE.mapLeft(l => ({
                error: l,
                sessionState: sessionState
            } satisfies EngineErrorResult))
        ))
    );
}

export function createSessionWithData(sessionContext: SessionContext, configurationRawData: ConfigurationRawData): TaskEither<ConfiguratorError, FullQualifiedConfigurationSessionState> {
    return pipe(
        createSession(sessionContext),
        TE.chain(state => {
            // Migrate data
            const explicitDecisions = getAllExplicitDecisions(configurationRawData);
            if (RA.isNonEmpty(explicitDecisions)) {
                return pipe(
                    state,
                    makeManyDecisions(explicitDecisions, {
                        type: "DropExistingDecisions",
                        conflictHandling: {type: "Automatic"}
                    }),
                    TE.map(r => r.sessionState)
                );
            }

            return TE.right(state);
        })
    );
}

function request<T, E>(request: () => Promise<Engine.HttpResponse<T, E>>, customConfiguratorErrorMapper?: (e: E) => Option<ConfiguratorError>): TaskEither<ConfiguratorError, T> {
    return pipe(
        TE.tryCatch(request, e => (e as Engine.HttpResponse<T, E>)),
        TE.match(identity, identity),
        T.map<Engine.HttpResponse<T, E>, E.Either<ConfiguratorError, T>>(r => {
            if (r == null || (r.data == null && r.error == null)) {
                return E.left({
                    type: ConfiguratorErrorType.ConnectionError
                } satisfies ConnectionError);
            }

            if (r.data != null) {
                return E.right(r.data);
            }

            // Check if all required properties of a ProblemDetail are present.
            if (r.error != null) {
                const customMapped = customConfiguratorErrorMapper?.(r.error) ?? none;
                if (O.isSome(customMapped)) {
                    return E.left(customMapped.value);
                }

                if (r.error["type"] != null && r.error["title"] != null && r.error["detail"] != null) {
                    return pipe(
                        r.error as any as Engine.ProblemDetails,
                        EtoD.mapConfiguratorError,
                        E.left
                    );
                }
            }

            Logger.error("Received unknown error format:", r.error);
            return E.left({
                type: ConfiguratorErrorType.ServerError
            } satisfies ServerError);
        })
    );
}

function getHeadersForSession(sessionState: Required<Pick<ConfigurationSessionState, "sessionId">>): HeadersInit {
    return {
        ...DefaultHeaders,
        "X-SESSION-ID": sessionState.sessionId,
    };
}