import type {
    ChannelId,
    ChoiceValueId,
    ConstraintExplanation,
    DecisionExplanation,
    FixedDecision,
    GlobalAttributeId,
} from "./Types";

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
export type RequestTimeout = {
    readonly type: ConfiguratorErrorType.RequestTimeout;
    readonly title: string;
    readonly detail: string;
};

/** The engine failed while processing the request; `exception` describes the failure. */
export type RequestFailure = {
    readonly type: ConfiguratorErrorType.RequestFailure;
    readonly title: string;
    readonly detail: string;
    readonly exception: string;
};

/** The engine could not read the request body; `jsonException` describes what it could not parse. */
export type SerializationError = {
    readonly type: ConfiguratorErrorType.SerializationError;
    readonly title: string;
    readonly detail: string;
    readonly jsonException: string;
};

/** The access token does not name a tenant. */
export type MissingTenantIdClaim = {
    readonly type: ConfiguratorErrorType.MissingTenantIdClaim;
    readonly title: string;
    readonly detail: string;
};

/** The session token does not name a session. */
export type MissingSessionIdClaim = {
    readonly type: ConfiguratorErrorType.MissingSessionIdClaim;
    readonly title: string;
    readonly detail: string;
};

/** The access token does not grant access to the tenant it names. */
export type TenantAccessForbidden = {
    readonly type: ConfiguratorErrorType.TenantAccessForbidden;
    readonly title: string;
    readonly detail: string;
};

/** The session ID sent with the request is not a valid session ID. */
export type SessionIdInvalid = {
    readonly type: ConfiguratorErrorType.SessionIdInvalid;
    readonly title: string;
    readonly detail: string;
};

/** The engine rejected the access token, e.g. because it is missing, expired or malformed. */
export type AuthenticationFailure = {
    readonly type: ConfiguratorErrorType.AuthenticationFailure;
    readonly title: string;
    readonly detail: string;
};

/** The access token does not allow creating a session from a configuration model package. */
export type SideLoadingForbidden = {
    readonly type: ConfiguratorErrorType.SideLoadingForbidden;
    readonly title: string;
    readonly detail: string;
};

/** The configuration model is invalid; `validationMessage`, when present, says why. */
export type ConfigurationModelInvalid = {
    readonly type: ConfiguratorErrorType.ConfigurationModelInvalid;
    readonly title: string;
    readonly detail: string;
    readonly validationMessage?: string | null;
};

/** No solution exists for the requested decisions. */
export type SolutionNotFeasible = {
    readonly type: ConfiguratorErrorType.SolutionNotFeasible;
    readonly title: string;
    readonly detail: string;
};

/** The requested configuration model does not exist. */
export type ConfigurationModelNotFound = {
    readonly type: ConfiguratorErrorType.ConfigurationModelNotFound;
    readonly title: string;
    readonly detail: string;
};

/** The engine could not prepare the configuration model for solving. */
export type SolverInitializationFailure = {
    readonly type: ConfiguratorErrorType.SolverInitializationFailure;
    readonly title: string;
    readonly detail: string;
};

/** The engine could not load the configuration model. */
export type ConfigurationModelLoadFailure = {
    readonly type: ConfiguratorErrorType.ConfigurationModelLoadFailure;
    readonly title: string;
    readonly detail: string;
};

/** The engine could not set up the session's configuration; `deploymentId`, when present, names the deployment. */
export type ConfigurationInitializationFailure = {
    readonly type: ConfiguratorErrorType.ConfigurationInitializationFailure;
    readonly title: string;
    readonly detail: string;
    readonly deploymentId?: string | null;
};

/** The engine had no solver available for the session; a later attempt may succeed. */
export type SolverPoolInitializationFailure = {
    readonly type: ConfiguratorErrorType.SolverPoolInitializationFailure;
    readonly title: string;
    readonly detail: string;
};

/** The decision conflicts with the current configuration and was not applied. */
export type SetDecisionConflict = {
    readonly type: ConfiguratorErrorType.SetDecisionConflict;
    readonly title: string;
    readonly detail: string;
};

/** Solving took longer than allowed; `timeout` is the limit that was exceeded. */
export type SolveOperationTimeout = {
    readonly type: ConfiguratorErrorType.SolveOperationTimeout;
    readonly title: string;
    readonly detail: string;
    readonly timeout: string;
};

/** The explain question could not be answered because of a conflict; `source` names where it arose. */
export type ExplainConflict = {
    readonly type: ConfiguratorErrorType.ExplainConflict;
    readonly title: string;
    readonly detail: string;
    readonly source: string;
};

/** The explain question could not be answered; `source` names where it failed. */
export type ExplainFailure = {
    readonly type: ConfiguratorErrorType.ExplainFailure;
    readonly title: string;
    readonly detail: string;
    readonly source: string;
};

/** The snapshot sent to the engine is invalid; `validationPath` points to the offending part. */
export type SnapshotInvalid = {
    readonly type: ConfiguratorErrorType.SnapshotInvalid;
    readonly title: string;
    readonly detail: string;
    readonly validationMessage: string;
    readonly validationPath: string[];
};

/** The requested snapshot does not exist. */
export type SnapshotNotFound = {
    readonly type: ConfiguratorErrorType.SnapshotNotFound;
    readonly title: string;
    readonly detail: string;
};

/** The parameters for creating the session are invalid. */
export type SessionParametersInvalid = {
    readonly type: ConfiguratorErrorType.SessionParametersInvalid;
    readonly title: string;
    readonly detail: string;
};

/** The configuration model has no solution at all; `constraintExplanations` name the constraints that cause it. */
export type ConfigurationModelNotFeasible = {
    readonly type: ConfiguratorErrorType.ConfigurationModelNotFeasible;
    readonly title: string;
    readonly detail: string;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

/** The decisions passed to `makeManyDecisions` conflict; the explanations show solutions that resolve the conflict. */
export type MakeManyDecisionsConflict = {
    readonly type: ConfiguratorErrorType.MakeManyDecisionsConflict;
    readonly title: string;
    readonly detail: string;
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

/** The access token does not allow using the requested deployment on that channel. */
export type SpecifiedDeploymentForbidden = {
    readonly type: ConfiguratorErrorType.SpecifiedDeploymentForbidden;
    readonly title: string;
    readonly detail: string;
    readonly channel: ChannelId;
    readonly deploymentName: string;
};

/** No attribute with this ID exists in the configuration model. */
export type AttributeNotFound = {
    readonly type: ConfiguratorErrorType.AttributeNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** No choice attribute with this ID exists in the configuration model. */
export type ChoiceAttributeNotFound = {
    readonly type: ConfiguratorErrorType.ChoiceAttributeNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** No component attribute with this ID exists in the configuration model. */
export type ComponentAttributeNotFound = {
    readonly type: ConfiguratorErrorType.ComponentAttributeNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** No numeric attribute with this ID exists in the configuration model. */
export type NumericAttributeNotFound = {
    readonly type: ConfiguratorErrorType.NumericAttributeNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** No boolean attribute with this ID exists in the configuration model. */
export type BooleanAttributeNotFound = {
    readonly type: ConfiguratorErrorType.BooleanAttributeNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** The choice attribute has no value with this ID. */
export type ChoiceValueNotFound = {
    readonly type: ConfiguratorErrorType.ChoiceValueNotFound;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId: ChoiceValueId;
};

/** The numeric decision lies outside the attribute's `range`; `decision` is the rejected value. */
export type NumericDecisionOutOfRange = {
    readonly type: ConfiguratorErrorType.NumericDecisionOutOfRange;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
    readonly range: string;
    readonly decision: number;
};

/** The decision contradicts a consequence of the current configuration and was not applied. */
export type ConflictWithConsequence = {
    readonly type: ConfiguratorErrorType.ConflictWithConsequence;
    readonly title: string;
    readonly detail: string;
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId?: ChoiceValueId | null;
};

/** The attribute relations in the session context are invalid; `validationMessage` says why. */
export type DecisionsToRespectInvalid = {
    readonly type: ConfiguratorErrorType.DecisionsToRespectInvalid;
    readonly title: string;
    readonly detail: string;
    readonly validationMessage: string;
    readonly globalAttributeId: GlobalAttributeId;
};

/** The fixed decisions in the session context were rejected; `rejectedDecisions` lists them. */
export type FixedDecisionsInvalid = {
    readonly type: ConfiguratorErrorType.FixedDecisionsInvalid;
    readonly title: string;
    readonly detail: string;
    readonly rejectedDecisions: ReadonlyArray<FixedDecision>;
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

export type ConfiguratorError =
    // Original Engine errors
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
    // Modified Engine errors
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
    // Newly introduced errors
    | ServerError
    | ConnectionError
    | TaskCancelled
    | SessionClosed
    | StoredConfigurationInvalid;