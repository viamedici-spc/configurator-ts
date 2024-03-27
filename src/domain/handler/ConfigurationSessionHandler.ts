import {sequenceS} from "fp-ts/Apply";
import {O, pipe, RA, TE, TO} from "@viamedici-spc/fp-ts-extensions";

import {IDomainToRestMapper} from "../../mappers/DomainToRestMapper";
import {IRestToDomainMapper} from "../../mappers/RestToDomainMapper";
import * as Domain from "../Model";
import {FailureType} from "../Model";
import {Interpreter} from "../services/Interpreter";
import {IDomainUpdater} from "../services/Updater";
import IConfigurationSessionHandler from "./IConfigurationSessionHandler";
import {EngineApiClient} from "../../apiClient/engine/EngineApiClient";
import {interpretEngineError} from "../../apiClient/engine/ErrorInterpretation";
import * as Engine from "../../apiClient/engine/models/generated/Engine";
import ISessionLifetimeHandler from "../../sessionCreator/ISessionLifetimeHandler";
import {IDomainToContractMapper} from "../../mappers/DomainToContractMapper";
import {match, P} from "ts-pattern";

export class ConfigurationSessionHandler implements IConfigurationSessionHandler {
    private readonly engineApiClient: EngineApiClient;
    private readonly restToDomainMapper: IRestToDomainMapper;
    private readonly domainToRestMapper: IDomainToRestMapper;
    private readonly domainToContractMapper: IDomainToContractMapper;
    private readonly domainUpdater: IDomainUpdater;
    private readonly interpreter: Interpreter;
    private readonly sessionHandler: ISessionLifetimeHandler;

    constructor(
        sessionHandler: ISessionLifetimeHandler,
        engineApiClient: EngineApiClient,
        restToDomainMapper: IRestToDomainMapper,
        domainToRestMapper: IDomainToRestMapper,
        domainToContractMapper: IDomainToContractMapper,
        domainUpdater: IDomainUpdater
    ) {
        this.engineApiClient = engineApiClient;
        this.domainToRestMapper = domainToRestMapper;
        this.restToDomainMapper = restToDomainMapper;
        this.domainToContractMapper = domainToContractMapper;
        this.domainUpdater = domainUpdater;
        this.sessionHandler = sessionHandler;
        this.interpreter = new Interpreter();
    }

    public close(sessionId: Domain.SessionId): Domain.TaskEitherResult<void> {
        return this.sessionHandler.close(sessionId);
    }

    public recreate(configurationData: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ConfigurationSessionState> {
        return this.initializeInner(configurationData, false);
    }

    public reinitialize(configurationData: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ConfigurationSessionState> {
        return this.initializeInner(configurationData, true);
    }

    public makeDecision(decision: Domain.AttributeDecision, configurationSession: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ConfigurationSessionState> {

        const decisionToMake = this.domainToRestMapper.mapToExplicitDecision(decision);

        return this.withSession(configurationSession, (sessionId, session) => {
            return pipe(
                this.engineApiClient.makeDecision(sessionId, decisionToMake),
                TE.mapLeft(interpretEngineError),
                TE.map(r => this.domainUpdater.updateConfigurationSession(session, r))
            );
        });
    }

    public explain(explainQuestion: Domain.ExplainQuestion, configurationSession: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ExplainAnswer> {
        return this.withSession(configurationSession, (sessionId) => {
            const outcome = match(explainQuestion)
                .with({question: Domain.ExplainQuestionType.whyIsNotSatisfied}, q => this.explainWhyNotSatisfied(q, sessionId))
                .with({question: Domain.ExplainQuestionType.whyIsStateNotPossible}, q => this.explainWhyStateNotPossible(q, sessionId))
                .exhaustive();

            return pipe(
                outcome,
                TE.mapLeft(interpretEngineError),
                TE.map(explainAnswer => this.restToDomainMapper.mapToExplainAnswer(explainAnswer, explainQuestion))
            );
        });
    }

    public setMany(decisions: readonly Domain.AttributeDecision[], mode: Domain.SetManyMode, configurationSession: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ConfigurationSessionState> {

        return this.withSession(configurationSession, (sessionId, session) => {

            const setManyResponse = this.setManyInner(decisions, mode, sessionId);

            return pipe(
                setManyResponse,
                TE.chain(success => {

                    const rejectedDecisions = pipe([],
                        RA.concat(pipe(success.rejectedDecisions?.booleanDecisions ?? [], RA.map((d): Domain.AttributeDecision => this.restToDomainMapper.mapToBooleanDecision(d)))),
                        RA.concat(pipe(success.rejectedDecisions?.numericDecisions ?? [], RA.map((d): Domain.AttributeDecision => this.restToDomainMapper.mapToNumericDecision(d)))),
                        RA.concat(pipe(success.rejectedDecisions?.componentDecisions ?? [], RA.map((d): Domain.AttributeDecision => this.restToDomainMapper.mapToComponentDecision(d)))),
                        RA.concat(pipe(success.rejectedDecisions?.choiceValueDecisions ?? [], RA.map((d): Domain.AttributeDecision => this.restToDomainMapper.mapToExplicitChoiceValueDecision(d))))
                    );

                    // This case has to be handled with a success result including additional information about the rejectedDecisions.
                    // Making this a failure result will corrupt the session state as the applied decisions are not integrated.
                    // if (pipe(rejectedDecisions, RA.isNonEmpty)) {
                    //     return TE.left(Domain.FailureResultFactory.createConfigurationRejectedDecisionsConflict(rejectedDecisions));
                    // }

                    return TE.of(this.domainUpdater.updateConfigurationSession(session, success));
                })
            );
        });
    }

    private replaceDecisions(sessionId: Domain.SessionId, configurationSession: Domain.ConfigurationSessionState): Domain.TaskEitherResult<{}> {
        const decisions = this.interpreter.configurationSession.getExplicitDecisions(configurationSession);

        const result = this.setManyInner(decisions, {
            type: "DropExistingDecisions",
            conflictHandling: {
                type: "Automatic"
            }
        }, sessionId);

        return pipe(
            result,
            TE.map(_ => ({}))
        );
    }

    private setManyInner(decisions: readonly Domain.AttributeDecision[], mode: Domain.SetManyMode, sessionId: Domain.SessionId) {

        const engineDecisions = this.domainToRestMapper.mapToExplicitDecisions(decisions, mode);

        const setManyResponse = this.engineApiClient.setMany(sessionId, engineDecisions);

        return pipe(setManyResponse,
            TE.mapLeft(interpretEngineError),
            TE.chain((r: Engine.PutManyDecisionsSuccessResponse | Engine.PutManyDecisionsConflictResponse): Domain.TaskEitherResult<Engine.PutManyDecisionsSuccessResponse> => {
                const successResponsePattern = {
                    rejectedDecisions: {
                        booleanDecisions: P.array(P.any)
                    }
                };
                const failureResponsePattern = {
                    decisionExplanations: P.array(P.any)
                };
                return match(r)
                    .with(successResponsePattern, (v) => TE.right(v))
                    .with(failureResponsePattern, v => {
                        return TE.left(this.restToDomainMapper.mapToConfigurationSetManyConflictFailure(v, engineDecisions, mode));
                    })

                    .otherwise(() => {
                        return TE.left({
                            type: FailureType.Unknown
                        } as Domain.FailureResult);
                    });
            }));
    }

    private explainWhyStateNotPossible(question: Domain.WhyIsStateNotPossible, sessionId: string) {
        const explainRequest: Engine.WhyStateNotPossibleRequest = this.domainToRestMapper.mapToWhyStateNotPossibleRequest(question);

        return this.engineApiClient.getWhyStateNotPossible(sessionId, explainRequest);
    }

    private explainWhyNotSatisfied(question: Domain.WhyIsNotSatisfied, sessionId: string) {
        const explainRequest: Engine.WhyNotSatisfiedRequest = this.domainToRestMapper.mapToWhyNotSatisfiedRequest(question);

        return this.engineApiClient.getWhyNotSatisfied(sessionId, explainRequest);
    }

    private withSession<T>(configurationSession: Domain.ConfigurationSessionState, action: (sessionId: Domain.SessionId, session: Domain.ConfigurationSessionState) => Domain.TaskEitherResult<T>): Domain.TaskEitherResult<T> {
        return pipe(
            TE.of(configurationSession),

            // Re-initialize Session if gone
            TE.chain(s => {
                return pipe(
                    s.sessionId,
                    O.match(() => this.initializeInner(s, false), () => TE.of(s))
                );
            }),

            TE.chain((session) => {
                return pipe(
                    session.sessionId,
                    TE.fromOption((): Domain.FailureResult => ({
                        type: Domain.FailureType.ConfigurationUnauthenticated
                    })),
                    TE.chain(sessionId => action(sessionId, session)),
                );
            })
        );
    }

    private initializeInner(configurationSession: Domain.ConfigurationSessionState, reuseExistingSession: boolean): Domain.TaskEitherResult<Domain.ConfigurationSessionState> {

        const determineAndHandleCurSessionId = (): TO.TaskOption<string> => {
            return pipe(configurationSession.sessionId,
                TO.fromOption,
                TO.chain(s => {
                    if (reuseExistingSession) {
                        return TO.some(s);
                    }

                    return pipe(
                        this.sessionHandler.close(s),
                        TE.match(() => O.none, () => O.none)
                    );
                })
            );
        };

        const determineAndHandleNewSessionId = (curSessionId: TO.TaskOption<string>): Domain.TaskEitherResult<string> => {

            const plainSessionContext = this.domainToContractMapper.mapToSessionContext(configurationSession.context);

            return pipe(
                curSessionId,
                TE.fromTaskOption((): Domain.FailureResult => ({
                    type: Domain.FailureType.ConfigurationUnauthenticated
                })),
                TE.orElse(() => this.sessionHandler.create(plainSessionContext))
            );
        };

        const prepareSession = (newSessionId: Domain.TaskEitherResult<Domain.SessionId>): Domain.TaskEitherResult<Domain.SessionId> => {
            return pipe(newSessionId,
                TE.chainFirst(sessionId =>
                    pipe(
                        O.of(configurationSession),
                        // TODO: Filter out Undefined decisions
                        O.filter(this.interpreter.configurationSession.hasExplicitDecisions),
                        O.map(configurationSession => this.replaceDecisions(sessionId, configurationSession)),
                        O.getOrElse(() => TE.of({}))
                    )));
        };

        const acquireConfigurationSession = (newSessionId: Domain.TaskEitherResult<Domain.SessionId>): Domain.TaskEitherResult<Domain.ConfigurationSessionState> => {
            return pipe(
                newSessionId,
                TE.chain(sessionId => {
                    const consequencesTask = this.determineConsequences(sessionId);
                    const decisionsTask = this.determineDecisions(sessionId);

                    const collectiveResult = sequenceS(TE.ApplicativePar)({
                        consequences: consequencesTask,
                        decisions: decisionsTask
                    });

                    return pipe(collectiveResult,
                        TE.map(({
                                    decisions,
                                    consequences
                                }) => this.restToDomainMapper.mapToConfigurationModel(decisions, consequences)),
                        TE.map(configuration => ({
                            sessionId: O.of(sessionId),
                            configuration: configuration,
                            context: configurationSession.context,
                            solutions: []
                        }))
                    );
                })
            );
        };

        return pipe(
            TE.Do,
            determineAndHandleCurSessionId,
            determineAndHandleNewSessionId,
            prepareSession,
            acquireConfigurationSession
        );
    }

    private determineDecisions(sessionId: Domain.SessionId): Domain.TaskEitherResult<Engine.Decisions> {
        return pipe(this.engineApiClient.getDecisions(sessionId),
            TE.mapLeft(interpretEngineError)
        );
    }

    private determineConsequences(sessionId: Domain.SessionId): Domain.TaskEitherResult<Engine.Consequences> {
        return pipe(this.engineApiClient.getConsequence(sessionId),
            TE.mapLeft(interpretEngineError)
        );
    }
}