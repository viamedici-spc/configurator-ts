import {
    ChannelId,
    ChoiceValueId,
    ConstraintExplanation,
    DecisionExplanation,
    GlobalAttributeId
} from "./Types";
import * as Engine from "../apiClient/engine/Engine";

export type RequestTimeout = Engine.RequestTimeout;
export type RequestFailure = Engine.RequestFailure;
export type SerializationError = Engine.SerializationError;
export type MissingTenantIdClaim = Engine.MissingTenantIdClaim;
export type MissingSessionIdClaim = Engine.MissingSessionIdClaim;
export type TenantAccessForbidden = Engine.TenantAccessForbidden;
export type SessionIdInvalid = Engine.SessionIdInvalid;
export type AuthenticationFailure = Engine.AuthenticationFailure;
export type SideLoadingForbidden = Engine.SideLoadingForbidden;
export type UsageRuleRestriction = Engine.UsageRuleRestriction;
export type ConfigurationModelInvalid = Engine.ConfigurationModelInvalid;
export type SolutionNotFeasible = Engine.SolutionNotFeasible;
export type ConfigurationModelNotFound = Engine.ConfigurationModelNotFound;
export type SolverInitializationFailure = Engine.SolverInitializationFailure;
export type ConfigurationModelLoadFailure = Engine.ConfigurationModelLoadFailure;
export type ConfigurationInitializationFailure = Engine.ConfigurationInitializationFailure;
export type SolverPoolInitializationFailure = Engine.SolverPoolInitializationFailure;
export type SetDecisionConflict = Engine.SetDecisionConflict;
export type SolveOperationTimeout = Engine.SolveOperationTimeout;
export type ExplainConflict = Engine.ExplainConflict;
export type ExplainFailure = Engine.ExplainFailure;
export type SnapshotInvalid = Engine.SnapshotInvalid;
export type SnapshotNotFound = Engine.SnapshotNotFound;

export type ConfigurationModelNotFeasible = Omit<Engine.ConfigurationModelNotFeasible, "constraintExplanations"> & {
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type SetManyDecisionsConflict =
    Omit<Engine.PutManyDecisionsConflict, "type" | "decisionExplanations" | "constraintExplanations">
    & {
    readonly type: "SetManyDecisionsConflict";
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type SpecifiedDeploymentForbidden = Omit<Engine.SpecifiedDeploymentForbidden, "channel"> & {
    readonly channel: ChannelId;
};

export type AttributeNotFound = Omit<Engine.AttributeNotFound, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type ChoiceAttributeNotFound = Omit<Engine.ChoiceAttributeNotFound, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type ComponentAttributeNotFound = Omit<Engine.ComponentAttributeNotFound, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type NumericAttributeNotFound = Omit<Engine.NumericAttributeNotFound, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type BooleanAttributeNotFound = Omit<Engine.BooleanAttributeNotFound, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type ChoiceValueNotFound = Omit<Engine.ChoiceValueNotFound, "globalChoiceValueId"> & {
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId: ChoiceValueId;
};

export type NumericDecisionOutOfRange = Omit<Engine.NumericDecisionOutOfRange, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type ConflictWithConsequence = Omit<Engine.ConflictWithConsequence, "globalAttributeId" | "choiceValueId"> & {
    readonly globalAttributeId: GlobalAttributeId;
    readonly choiceValueId?: ChoiceValueId | null;
};

export type DecisionsToRespectInvalid = Omit<Engine.DecisionsToRespectInvalid, "globalAttributeId"> & {
    readonly globalAttributeId: GlobalAttributeId;
};

export type SessionNotFound = {
    readonly type: "SessionNotFound";
};

export type ServerError = {
    readonly type: "ServerError"
}

export type ConnectionError = {
    readonly type: "ConnectionError"
}

export type TaskCancelled = {
    readonly type: "TaskCancelled"
}

export type SessionClosed = {
    readonly type: "SessionClosed"
}

export type StoredConfigurationInvalid = {
    readonly type: "StoredConfigurationInvalid"
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
    | SetManyDecisionsConflict
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