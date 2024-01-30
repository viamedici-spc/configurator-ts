import {match, P} from "ts-pattern";
import {O, pipe} from "@viamedici-spc/fp-ts-extensions";
import {Refinement} from "fp-ts/Refinement";
import {ProblemDetails} from "./models/generated/Engine";
import {
    ConfigurationConflict,
    ConfigurationConflictReason,
    ConfigurationInitializationFailure,
    ConfigurationModelNotFeasible,
    FailureResult,
    FailureType
} from "../../domain/Model";
import {logJson} from "../../crossCutting/Dev";

export enum LocalErrorType {
    ConfigurationEngineRestApiUnauthorized = "Generic::Unauthorized",
    ClientError = "Generic::LocalClientError",
    ServerError = "Generic::ServerError",

    UnhandledResponseStatus = "LocalUnhandledResponseStatus",
    LowLevelCommunicationError = "LocalLowLevelCommunicationError",
}

enum WellKnownErrorType {
    BooleanAttributeNotFound = "BooleanAttributeNotFound",
    ChoiceAttributeNotFound = "ChoiceAttributeNotFound",
    ChoiceValueNotFound = "ChoiceValueNotFound",
    ConfigurationInitializationFailure = "InitializationFailure",
    ConfigurationModelInvalid = "ConfigurationModelInvalid",
    LegacyConfigurationModelInvalid = "DeploymentStore.Core.Store.SnapshotInvalid",
    LegacySnapshotInvalid = "SnapshotInvalid",
    ConfigurationModelNotFeasible = "ConfigurationModelNotFeasible",
    ConfigurationModelNotFound = "ConfigurationModelNotFound",
    ConflictWithConsequence = "ConflictWithConsequence",
    DecisionInvalid = "DecisionInvalid",
    DecisionsToRespectInvalid = "DecisionsToRespectInvalid",
    NumericAttributeNotFound = "NumericAttributeNotFound",
    NumericDecisionOutOfRange = "NumericDecisionOutOfRange",
    SessionNotFound = "SessionNotFound",
    SetDecisionConflict = "SetDecisionConflict",
    Unauthorized = "Unauthorized",
    AuthenticationFailure = "AuthenticationFailure"
}

const isWellKnownErrorType: Refinement<string | null | undefined, WellKnownErrorType> = (s: string | null | undefined): s is WellKnownErrorType =>
    Object.values(WellKnownErrorType).includes(s as WellKnownErrorType);

const getWellKnownErrorType = (s: string | null | undefined): O.Option<WellKnownErrorType> =>
    isWellKnownErrorType(s) ? O.some(s) : O.none;

function interpretWellKnownEngineError(error: string | null | undefined): O.Option<FailureResult> {
    const matchError = (e: WellKnownErrorType): FailureResult => match(e)
        // Engine reports conflict due to ConfigurationModel not found
        .with(WellKnownErrorType.ConfigurationModelNotFound, (): FailureResult => ({
            type: FailureType.ConfigurationModelNotFound
        }))

        .with(WellKnownErrorType.DecisionsToRespectInvalid, (): FailureResult => ({
            type: FailureType.DecisionsToRespectInvalid
        }))

        .with(P.union(WellKnownErrorType.ChoiceAttributeNotFound, WellKnownErrorType.NumericAttributeNotFound, WellKnownErrorType.BooleanAttributeNotFound), (): FailureResult => ({
            type: FailureType.ConfigurationAttributeNotFound,
        }))

        .with(WellKnownErrorType.ChoiceValueNotFound, (): FailureResult => ({
            type: FailureType.ConfigurationChoiceValueNotFound,
        }))

        // A decision made was invalid - consequences were not taken into account when making the decision
        .with(WellKnownErrorType.DecisionInvalid, (): FailureResult => ({
            type: FailureType.ConfigurationConflict
        }))

        .with(WellKnownErrorType.NumericDecisionOutOfRange, (): FailureResult => ({
            type: FailureType.ConfigurationConflict,
            reason: ConfigurationConflictReason.NumericDecisionOutOfRange
        }))

        .with(WellKnownErrorType.ConflictWithConsequence, (): FailureResult => ({
            type: FailureType.ConfigurationConflict
        }))

        // Session call was made with expired session or Session Management call was made with invalid, expired or missing authentication
        .with(P.union(WellKnownErrorType.SessionNotFound, WellKnownErrorType.Unauthorized, WellKnownErrorType.AuthenticationFailure), (): FailureResult => ({
            type: FailureType.ConfigurationUnauthenticated
        }))

        .with(WellKnownErrorType.ConfigurationModelInvalid, (): FailureResult => ({
            type: FailureType.ConfigurationModelInvalid
        }))

        .with(WellKnownErrorType.LegacyConfigurationModelInvalid, (): FailureResult => ({
            type: FailureType.ConfigurationModelInvalid
        }))

        .with(WellKnownErrorType.LegacySnapshotInvalid, (): FailureResult => ({
            type: FailureType.ConfigurationModelInvalid
        }))

        .with(WellKnownErrorType.ConfigurationInitializationFailure, (): ConfigurationInitializationFailure => ({
            type: FailureType.ConfigurationInitializationFailure,
        }))

        .with(WellKnownErrorType.ConfigurationModelNotFeasible, (f): ConfigurationModelNotFeasible => {
            return ({
                type: FailureType.ConfigurationModelNotFeasible,
                constraintExplanations: []
            });
        })

        .with(WellKnownErrorType.SetDecisionConflict, (): ConfigurationConflict => ({
            type: FailureType.ConfigurationConflict,
        }))

        .exhaustive();

    return pipe(error, getWellKnownErrorType, O.map(matchError));
}

const isLocalErrorTypes: Refinement<string | null | undefined, LocalErrorType> = (s: string | null | undefined): s is LocalErrorType =>
    Object.values(LocalErrorType).includes(s as LocalErrorType);

const getLocalErrorType = (s: string | null | undefined): O.Option<LocalErrorType> =>
    isLocalErrorTypes(s) ? O.some(s) : O.none;

function interpretLocalError(error: string | null | undefined): O.Option<FailureResult> {

    const matchError = (e: LocalErrorType) => match(e)
        .with(LocalErrorType.ClientError, (): FailureResult => ({
            type: FailureType.ConfigurationApplicationError
        }))
        .with(LocalErrorType.ServerError, (): FailureResult => ({
            type: FailureType.ServiceError // Service Error
        }))
        .with(LocalErrorType.LowLevelCommunicationError, (): FailureResult => ({
            type: FailureType.CommunicationError // CommunicationError
        }))
        .with(LocalErrorType.ConfigurationEngineRestApiUnauthorized, (): FailureResult => ({
            type: FailureType.ConfigurationUnauthenticated
        }))
        .with(LocalErrorType.UnhandledResponseStatus, (): FailureResult => ({
            type: FailureType.Unknown // Unknown
        }))
        .exhaustive();

    return pipe(error, getLocalErrorType, O.map(matchError));
}

export function interpretEngineError(problemDetails: ProblemDetails, context?: string): FailureResult {

    logJson(problemDetails, context);

    const type = problemDetails.type;

    return pipe(O.none,
        O.alt(() => interpretWellKnownEngineError(type)),
        O.alt(() => interpretLocalError(type)),
        O.getOrElse((): FailureResult => {
            console.error("InterpretEngineError encountered unexpected error type", "ProblemDetails", problemDetails, "Context", context);
            return ({type: FailureType.Unknown});
        })
    );
}