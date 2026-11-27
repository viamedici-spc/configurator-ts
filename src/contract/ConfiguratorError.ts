import type {
    ChannelId,
    ChoiceValueId,
    ConstraintExplanation,
    DecisionExplanation,
    FixedDecision,
    GlobalAttributeId,
} from "./Types";

/** What went wrong, as a person reads it: the problem details the engine sends with an error. */
export type ConfiguratorErrorText = {
    /** A short summary of the kind of error, the same for every occurrence of it. */
    readonly title: string;
    /** What went wrong in this occurrence. */
    readonly detail: string;
};

/** The `type` of every {@link ConfiguratorError}, which tells its members apart. */
export enum ConfiguratorErrorType {
    RequestTimeout = "RequestTimeout",
    RequestFailure = "RequestFailure",
    SerializationError = "SerializationError",
    MissingTenantIdClaim = "MissingTenantIdClaim",
    MissingSessionIdClaim = "MissingSessionIdClaim",
    TenantAccessForbidden = "TenantAccessForbidden",
    SessionIdInvalid = "SessionIdInvalid",
    AuthenticationFailure = "AuthenticationFailure",
    SideLoadingForbidden = "SideLoadingForbidden",
    ConfigurationModelInvalid = "ConfigurationModelInvalid",
    SolutionNotFeasible = "SolutionNotFeasible",
    ConfigurationModelNotFound = "ConfigurationModelNotFound",
    SolverInitializationFailure = "SolverInitializationFailure",
    ConfigurationModelLoadFailure = "ConfigurationModelLoadFailure",
    ConfigurationInitializationFailure = "ConfigurationInitializationFailure",
    SolverPoolInitializationFailure = "SolverPoolInitializationFailure",
    SetDecisionConflict = "SetDecisionConflict",
    SolveOperationTimeout = "SolveOperationTimeout",
    ExplainConflict = "ExplainConflict",
    ExplainFailure = "ExplainFailure",
    SnapshotInvalid = "SnapshotInvalid",
    SnapshotNotFound = "SnapshotNotFound",
    ConfigurationModelNotFeasible = "ConfigurationModelNotFeasible",
    MakeManyDecisionsConflict = "MakeManyDecisionsConflict",
    SpecifiedDeploymentForbidden = "SpecifiedDeploymentForbidden",
    AttributeNotFound = "AttributeNotFound",
    ChoiceAttributeNotFound = "ChoiceAttributeNotFound",
    ComponentAttributeNotFound = "ComponentAttributeNotFound",
    NumericAttributeNotFound = "NumericAttributeNotFound",
    BooleanAttributeNotFound = "BooleanAttributeNotFound",
    ChoiceValueNotFound = "ChoiceValueNotFound",
    NumericDecisionOutOfRange = "NumericDecisionOutOfRange",
    ConflictWithConsequence = "ConflictWithConsequence",
    DecisionsToRespectInvalid = "DecisionsToRespectInvalid",
    FixedDecisionsInvalid = "FixedDecisionsInvalid",
    SessionNotFound = "SessionNotFound",
    ServerError = "ServerError",
    ConnectionError = "ConnectionError",
    TaskCancelled = "TaskCancelled",
    SessionClosed = "SessionClosed",
    StoredConfigurationInvalid = "StoredConfigurationInvalid",
    SessionParametersInvalid = "SessionParametersInvalid",
}

/** The engine did not finish the request in time. */
export type RequestTimeout = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.RequestTimeout;
};

/** The engine failed while processing the request; `exception` describes the failure. */
export type RequestFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.RequestFailure;
    /** The engine's description of the failure. */
    readonly exception: string;
};

/** The engine could not read the request body; `jsonException` describes what it could not parse. */
export type SerializationError = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SerializationError;
    /** What the engine could not parse in the request body. */
    readonly jsonException: string;
};

/** The access token does not name a tenant. */
export type MissingTenantIdClaim = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.MissingTenantIdClaim;
};

/** The session token does not name a session. */
export type MissingSessionIdClaim = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.MissingSessionIdClaim;
};

/** The access token does not grant access to the tenant it names. */
export type TenantAccessForbidden = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.TenantAccessForbidden;
};

/** The session ID sent with the request is not a valid session ID. */
export type SessionIdInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SessionIdInvalid;
};

/** The engine rejected the access token, e.g. because it is missing, expired or malformed. */
export type AuthenticationFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.AuthenticationFailure;
};

/** The access token does not allow creating a session from a configuration model package. */
export type SideLoadingForbidden = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SideLoadingForbidden;
};

/** The configuration model is invalid; `validationMessage`, when present, says why. */
export type ConfigurationModelInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConfigurationModelInvalid;
    /** Why the configuration model is invalid, when the engine says. */
    readonly validationMessage?: string | null;
};

/** No solution exists for the requested decisions. */
export type SolutionNotFeasible = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SolutionNotFeasible;
};

/** The requested configuration model does not exist. */
export type ConfigurationModelNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConfigurationModelNotFound;
};

/** The engine could not prepare the configuration model for solving. */
export type SolverInitializationFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SolverInitializationFailure;
};

/** The engine could not load the configuration model. */
export type ConfigurationModelLoadFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConfigurationModelLoadFailure;
};

/** The engine could not set up the session's configuration; `deploymentId`, when present, names the deployment. */
export type ConfigurationInitializationFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConfigurationInitializationFailure;
    /** The deployment whose configuration could not be set up, when known. */
    readonly deploymentId?: string | null;
};

/** The engine had no solver available for the session; a later attempt may succeed. */
export type SolverPoolInitializationFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SolverPoolInitializationFailure;
};

/** The decision conflicts with the current configuration and was not applied. */
export type SetDecisionConflict = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SetDecisionConflict;
};

/** Solving took longer than allowed; `timeout` is the limit that was exceeded. */
export type SolveOperationTimeout = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SolveOperationTimeout;
    /** The time limit that was exceeded, as the engine formats it. */
    readonly timeout: string;
};

/** The explain question could not be answered because of a conflict; `source` names where it arose. */
export type ExplainConflict = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ExplainConflict;
    /** Where the conflict arose. */
    readonly source: string;
};

/** The explain question could not be answered; `source` names where it failed. */
export type ExplainFailure = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ExplainFailure;
    /** Where the failure arose. */
    readonly source: string;
};

/** The snapshot sent to the engine is invalid; `validationPath` points to the offending part. */
export type SnapshotInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SnapshotInvalid;
    /** Why the snapshot is invalid. */
    readonly validationMessage: string;
    /** The path to the offending part of the snapshot. */
    readonly validationPath: ReadonlyArray<string>;
};

/** The requested snapshot does not exist. */
export type SnapshotNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SnapshotNotFound;
};

/** The parameters for creating the session are invalid. */
export type SessionParametersInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SessionParametersInvalid;
};

/** The configuration model has no solution at all; `constraintExplanations` name the constraints that cause it. */
export type ConfigurationModelNotFeasible = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConfigurationModelNotFeasible;
    /** The constraints that together leave no solution. */
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

/** The decisions passed to `makeManyDecisions` conflict; the explanations show solutions that resolve the conflict. */
export type MakeManyDecisionsConflict = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.MakeManyDecisionsConflict;
    /** Explanations of the conflict by decisions, each with a solution. */
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>;
    /** Explanations of the conflict by constraints. */
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

/** The access token does not allow using the requested deployment on that channel. */
export type SpecifiedDeploymentForbidden = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.SpecifiedDeploymentForbidden;
    /** The requested channel. */
    readonly channel: ChannelId;
    /** The requested deployment. */
    readonly deploymentName: string;
};

/** No attribute with this ID exists in the configuration model. */
export type AttributeNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.AttributeNotFound;
    /** The attribute that was not found. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** No choice attribute with this ID exists in the configuration model. */
export type ChoiceAttributeNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ChoiceAttributeNotFound;
    /** The attribute that was not found. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** No component attribute with this ID exists in the configuration model. */
export type ComponentAttributeNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ComponentAttributeNotFound;
    /** The attribute that was not found. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** No numeric attribute with this ID exists in the configuration model. */
export type NumericAttributeNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.NumericAttributeNotFound;
    /** The attribute that was not found. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** No boolean attribute with this ID exists in the configuration model. */
export type BooleanAttributeNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.BooleanAttributeNotFound;
    /** The attribute that was not found. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** The choice attribute has no value with this ID. */
export type ChoiceValueNotFound = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ChoiceValueNotFound;
    /** The choice attribute. */
    readonly globalAttributeId: GlobalAttributeId;
    /** The value that was not found. */
    readonly choiceValueId: ChoiceValueId;
};

/** The numeric decision lies outside the attribute's `range`; `decision` is the rejected value. */
export type NumericDecisionOutOfRange = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.NumericDecisionOutOfRange;
    /** The numeric attribute. */
    readonly globalAttributeId: GlobalAttributeId;
    /** The allowed range, as the engine formats it. */
    readonly range: string;
    /** The rejected value. */
    readonly decision: number;
};

/** The decision contradicts a consequence of the current configuration and was not applied. */
export type ConflictWithConsequence = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.ConflictWithConsequence;
    /** The attribute of the rejected decision. */
    readonly globalAttributeId: GlobalAttributeId;
    /** The choice value of the rejected decision, for a choice attribute. */
    readonly choiceValueId?: ChoiceValueId | null;
};

/** The attribute relations in the session context are invalid; `validationMessage` says why. */
export type DecisionsToRespectInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.DecisionsToRespectInvalid;
    /** Why the attribute relations are invalid. */
    readonly validationMessage: string;
    /** The attribute whose relations are invalid. */
    readonly globalAttributeId: GlobalAttributeId;
};

/** The fixed decisions in the session context were rejected; `rejectedDecisions` lists them. */
export type FixedDecisionsInvalid = ConfiguratorErrorText & {
    readonly type: ConfiguratorErrorType.FixedDecisionsInvalid;
    /** The fixed decisions the engine rejected. */
    readonly rejectedDecisions: ReadonlyArray<FixedDecision>;
    /** Why the engine rejected them. */
    readonly validationMessage: string;
};

/** The session does not exist (anymore), e.g. because it expired, and could not be restored. */
export type SessionNotFound = {
    readonly type: ConfiguratorErrorType.SessionNotFound;
};

/** The engine answered with an error the client does not expect. */
export type ServerError = {
    readonly type: ConfiguratorErrorType.ServerError;
};

/** The engine could not be reached, e.g. because of a network failure. */
export type ConnectionError = {
    readonly type: ConfiguratorErrorType.ConnectionError;
};

/** The operation was cancelled before it completed because the session is shutting down. */
export type TaskCancelled = {
    readonly type: ConfiguratorErrorType.TaskCancelled;
};

/** The session was closed; it accepts no further operations. */
export type SessionClosed = {
    readonly type: ConfiguratorErrorType.SessionClosed;
};

/** The stored configuration does not match the expected format and could not be restored. */
export type StoredConfigurationInvalid = {
    readonly type: ConfiguratorErrorType.StoredConfigurationInvalid;
};

/**
 * Every error an operation of the library rejects with. Its `type` tells the members apart; the engine's errors also
 * carry {@link ConfiguratorErrorText}.
 */
export type ConfiguratorError =
    // Reported by the engine
    | RequestTimeout
    | RequestFailure
    | SerializationError
    | MissingTenantIdClaim
    | MissingSessionIdClaim
    | TenantAccessForbidden
    | SessionIdInvalid
    | AuthenticationFailure
    | SideLoadingForbidden
    | ConfigurationModelInvalid
    | SolutionNotFeasible
    | ConfigurationModelNotFound
    | SolverInitializationFailure
    | ConfigurationModelLoadFailure
    | ConfigurationInitializationFailure
    | SolverPoolInitializationFailure
    | SetDecisionConflict
    | SolveOperationTimeout
    | ExplainConflict
    | ExplainFailure
    | SnapshotInvalid
    | SnapshotNotFound
    | SessionParametersInvalid
    // Reported by the engine, with their fields mapped to the library's types
    | ConfigurationModelNotFeasible
    | MakeManyDecisionsConflict
    | SpecifiedDeploymentForbidden
    | AttributeNotFound
    | ChoiceAttributeNotFound
    | ComponentAttributeNotFound
    | NumericAttributeNotFound
    | BooleanAttributeNotFound
    | ChoiceValueNotFound
    | NumericDecisionOutOfRange
    | ConflictWithConsequence
    | DecisionsToRespectInvalid
    | FixedDecisionsInvalid
    | SessionNotFound
    // Raised by the library
    | ServerError
    | ConnectionError
    | TaskCancelled
    | SessionClosed
    | StoredConfigurationInvalid;