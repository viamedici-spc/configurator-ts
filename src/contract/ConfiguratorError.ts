import {
    ChannelId,
    ChoiceValueId,
    ConstraintExplanation,
    DecisionExplanation,
    GlobalAttributeId
} from "./Types";
import * as Engine from "../apiClient/engine/Engine";

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
    UsageRuleRestriction = "UsageRuleRestriction",
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
    SessionNotFound = "SessionNotFound",
    ServerError = "ServerError",
    ConnectionError = "ConnectionError",
    TaskCancelled = "TaskCancelled",
    SessionClosed = "SessionClosed",
    StoredConfigurationInvalid = "StoredConfigurationInvalid",
}

type ReplaceType<E extends { type: string }, T extends ConfiguratorErrorType> = Omit<E, "type"> & { readonly type: T };

export type RequestTimeout = ReplaceType<Engine.RequestTimeout, ConfiguratorErrorType.RequestTimeout>;
export type RequestFailure = ReplaceType<Engine.RequestFailure, ConfiguratorErrorType.RequestFailure>;
export type SerializationError = ReplaceType<Engine.SerializationError, ConfiguratorErrorType.SerializationError>;
export type MissingTenantIdClaim = ReplaceType<Engine.MissingTenantIdClaim, ConfiguratorErrorType.MissingTenantIdClaim>;
export type MissingSessionIdClaim = ReplaceType<Engine.MissingSessionIdClaim, ConfiguratorErrorType.MissingSessionIdClaim>;
export type TenantAccessForbidden = ReplaceType<Engine.TenantAccessForbidden, ConfiguratorErrorType.TenantAccessForbidden>;
export type SessionIdInvalid = ReplaceType<Engine.SessionIdInvalid, ConfiguratorErrorType.SessionIdInvalid>;
export type AuthenticationFailure = ReplaceType<Engine.AuthenticationFailure, ConfiguratorErrorType.AuthenticationFailure>;
export type SideLoadingForbidden = ReplaceType<Engine.SideLoadingForbidden, ConfiguratorErrorType.SideLoadingForbidden>;
export type UsageRuleRestriction = ReplaceType<Engine.UsageRuleRestriction, ConfiguratorErrorType.UsageRuleRestriction>;
export type ConfigurationModelInvalid = ReplaceType<Engine.ConfigurationModelInvalid, ConfiguratorErrorType.ConfigurationModelInvalid>;
export type SolutionNotFeasible = ReplaceType<Engine.SolutionNotFeasible, ConfiguratorErrorType.SolutionNotFeasible>;
export type ConfigurationModelNotFound = ReplaceType<Engine.ConfigurationModelNotFound, ConfiguratorErrorType.ConfigurationModelNotFound>;
export type SolverInitializationFailure = ReplaceType<Engine.SolverInitializationFailure, ConfiguratorErrorType.SolverInitializationFailure>;
export type ConfigurationModelLoadFailure = ReplaceType<Engine.ConfigurationModelLoadFailure, ConfiguratorErrorType.ConfigurationModelLoadFailure>;
export type ConfigurationInitializationFailure = ReplaceType<Engine.ConfigurationInitializationFailure, ConfiguratorErrorType.ConfigurationInitializationFailure>;
export type SolverPoolInitializationFailure = ReplaceType<Engine.SolverPoolInitializationFailure, ConfiguratorErrorType.SolverPoolInitializationFailure>;
export type SetDecisionConflict = ReplaceType<Engine.SetDecisionConflict, ConfiguratorErrorType.SetDecisionConflict>;
export type SolveOperationTimeout = ReplaceType<Engine.SolveOperationTimeout, ConfiguratorErrorType.SolveOperationTimeout>;
export type ExplainConflict = ReplaceType<Engine.ExplainConflict, ConfiguratorErrorType.ExplainConflict>;
export type ExplainFailure = ReplaceType<Engine.ExplainFailure, ConfiguratorErrorType.ExplainFailure>;
export type SnapshotInvalid = ReplaceType<Engine.SnapshotInvalid, ConfiguratorErrorType.SnapshotInvalid>;
export type SnapshotNotFound = ReplaceType<Engine.SnapshotNotFound, ConfiguratorErrorType.SnapshotNotFound>;

export type ConfigurationModelNotFeasible =
    Omit<Engine.ConfigurationModelNotFeasible, "type" | "constraintExplanations">
    & {
    readonly type: ConfiguratorErrorType.ConfigurationModelNotFeasible;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type MakeManyDecisionsConflict =
    Omit<Engine.PutManyDecisionsConflict, "type" | "decisionExplanations" | "constraintExplanations">
    & {
    readonly type: ConfiguratorErrorType.MakeManyDecisionsConflict;
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type SpecifiedDeploymentForbidden =
    Omit<Engine.SpecifiedDeploymentForbidden, "type" | "channel">
    & {
    readonly type: ConfiguratorErrorType.SpecifiedDeploymentForbidden;
    readonly channel: ChannelId;
};

export type AttributeNotFound = Omit<Engine.AttributeNotFound, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.AttributeNotFound;
    readonly globalAttributeId: GlobalAttributeId;
};

export type ChoiceAttributeNotFound = Omit<Engine.ChoiceAttributeNotFound, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.ChoiceAttributeNotFound;
    readonly globalAttributeId: GlobalAttributeId;
};

export type ComponentAttributeNotFound = Omit<Engine.ComponentAttributeNotFound, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.ComponentAttributeNotFound;
    readonly globalAttributeId: GlobalAttributeId;
};

export type NumericAttributeNotFound = Omit<Engine.NumericAttributeNotFound, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.NumericAttributeNotFound;
    readonly globalAttributeId: GlobalAttributeId;
};

export type BooleanAttributeNotFound = Omit<Engine.BooleanAttributeNotFound, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.BooleanAttributeNotFound;
    readonly globalAttributeId: GlobalAttributeId;
};

export type ChoiceValueNotFound = Omit<Engine.ChoiceValueNotFound, "type" | "globalChoiceValueId"> & {
    readonly type: ConfiguratorErrorType.ChoiceValueNotFound;
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId: ChoiceValueId;
};

export type NumericDecisionOutOfRange = Omit<Engine.NumericDecisionOutOfRange, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.NumericDecisionOutOfRange;
    readonly globalAttributeId: GlobalAttributeId;
};

export type ConflictWithConsequence =
    Omit<Engine.ConflictWithConsequence, "type" | "globalAttributeId" | "choiceValueId">
    & {
    readonly type: ConfiguratorErrorType.ConflictWithConsequence;
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId?: ChoiceValueId | null;
};

export type DecisionsToRespectInvalid = Omit<Engine.DecisionsToRespectInvalid, "type" | "globalAttributeId"> & {
    readonly type: ConfiguratorErrorType.DecisionsToRespectInvalid;
    readonly globalAttributeId: GlobalAttributeId;
};

export type SessionNotFound = {
    readonly type: ConfiguratorErrorType.SessionNotFound;
};

export type ServerError = {
    readonly type: ConfiguratorErrorType.ServerError;
}

export type ConnectionError = {
    readonly type: ConfiguratorErrorType.ConnectionError;
}

export type TaskCancelled = {
    readonly type: ConfiguratorErrorType.TaskCancelled;
}

export type SessionClosed = {
    readonly type: ConfiguratorErrorType.SessionClosed;
}

export type StoredConfigurationInvalid = {
    readonly type: ConfiguratorErrorType.StoredConfigurationInvalid;
}

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
    | UsageRuleRestriction
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
    | SessionNotFound
    // Newly introduced errors
    | ServerError
    | ConnectionError
    | TaskCancelled
    | SessionClosed
    | StoredConfigurationInvalid;