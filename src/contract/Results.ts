import {ConstraintExplanation, DecisionExplanation, ExplicitDecision} from "./Types";

/*
    All possible error types.
 */

export type FailureResult = ConfigurationModelNotFound
    | CommunicationError
    | ConfigurationApplicationError
    | ConfigurationAttributeNotFound
    | ConfigurationChoiceValueNotFound
    | ConfigurationConflict
    | ConfigurationInitializationFailure
    | ConfigurationModelInvalid
    | ConfigurationModelNotFeasible
    | ConfigurationRejectedDecisionsConflict
    | ConfigurationSetManyConflict
    | ConfigurationSolutionNotAvailable
    | ConfigurationTimeout
    | ConfigurationUnauthenticated
    | ConfigurationUnauthorized
    | DecisionsToRespectInvalid
    | SpecifiedDeploymentForbidden
    | ServiceError
    | Unknown
    ;

export type BaseFailure = {
    readonly type: FailureType;
};

export enum FailureType {
    Unknown = "Unknown",
    CommunicationError = "Local.LowLevelCommunicationError",
    ServiceError = "ServiceError",
    ConfigurationConflict = "ConfigurationConflict",
    ConfigurationUnauthenticated = "ConfigurationUnauthenticated",
    ConfigurationUnauthorized = "ConfigurationUnauthorized",
    ConfigurationApplicationError = "ConfigurationApplicationError",
    ConfigurationTimeout = "ConfigurationTimeout",
    ConfigurationModelNotFound = "ConfigurationModelNotFound",
    ConfigurationAttributeNotFound = "ConfigurationAttributeNotFound",
    ConfigurationSolutionNotAvailable = "ConfigurationSolutionNotAvailable",
    ConfigurationRejectedDecisionsConflict = "ConfigurationRejectedDecisionsConflict",
    ConfigurationChoiceValueNotFound = "ConfigurationChoiceValueNotFound",
    DecisionsToRespectInvalid = "DecisionsToRespectInvalid",
    ConfigurationModelInvalid = "ConfigurationModelInvalid",
    ConfigurationInitializationFailure = "ConfigurationInitializationFailure",
    ConfigurationModelNotFeasible = "ConfigurationModelNotFeasible",
    ConfigurationSetManyConflict = "ConfigurationSetManyConflict",
    SpecifiedDeploymentForbidden = "SpecifiedDeploymentForbidden"
}

export type ConfigurationModelNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationModelNotFound;
};

export type Unknown = BaseFailure & {
    readonly type: FailureType.Unknown;
};

export type CommunicationError = BaseFailure & {
    readonly type: FailureType.CommunicationError;
};

export type ConfigurationModelInvalid = BaseFailure & {
    readonly type: FailureType.ConfigurationModelInvalid;
};

export type ConfigurationModelNotFeasible = BaseFailure & {
    readonly type: FailureType.ConfigurationModelNotFeasible;
    constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type ConfigurationInitializationFailure = BaseFailure & {
    readonly type: FailureType.ConfigurationInitializationFailure;
};

export type ServiceError = BaseFailure & {
    readonly type: FailureType.ServiceError;
};

export enum ConfigurationConflictReason {
    NumericDecisionOutOfRange
}

export type ConfigurationConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationConflict;
    reason?: ConfigurationConflictReason
};

export type DecisionsToRespectInvalid = BaseFailure & {
    readonly type: FailureType.DecisionsToRespectInvalid;
};

export type ConfigurationRejectedDecisionsConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationRejectedDecisionsConflict,
    rejectedDecisions: ReadonlyArray<ExplicitDecision>
};

export type ConfigurationAttributeNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationAttributeNotFound;
};

export type ConfigurationChoiceValueNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationChoiceValueNotFound;
};

export type ConfigurationUnauthorized = BaseFailure & {
    readonly type: FailureType.ConfigurationUnauthorized;
};

export type ConfigurationUnauthenticated = BaseFailure & {
    readonly type: FailureType.ConfigurationUnauthenticated;
};

export type ConfigurationApplicationError = BaseFailure & {
    readonly type: FailureType.ConfigurationApplicationError;
};

export type ConfigurationTimeout = BaseFailure & {
    readonly type: FailureType.ConfigurationTimeout;
};

export type ConfigurationSolutionNotAvailable = BaseFailure & {
    readonly type: FailureType.ConfigurationSolutionNotAvailable;
};

export type ConfigurationSetManyConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationSetManyConflict;
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>
};

export type SpecifiedDeploymentForbidden = BaseFailure & {
    readonly type: FailureType.SpecifiedDeploymentForbidden;
    readonly detail: string;
    readonly deploymentName: string;
    readonly channel: string;
};

export const FailureResultFactory = {
    createConfigurationRejectedDecisionsConflict(rejectedDecisions: ReadonlyArray<ExplicitDecision>): FailureResult {
        return {
            type: FailureType.ConfigurationRejectedDecisionsConflict,
            rejectedDecisions: rejectedDecisions
        };
    }
};