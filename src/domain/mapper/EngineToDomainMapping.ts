import * as Engine from "../../apiClient/engine/Engine";
import {match} from "ts-pattern";
import {
    AttributeType,
    BooleanAttribute,
    CausedByBooleanDecision,
    CausedByChoiceValueDecision,
    CausedByComponentDecision,
    CausedByNumericDecision,
    ChoiceValue,
    ChoiceValueDecisionState,
    ComponentAttribute,
    ComponentDecisionState,
    ConstraintExplanation,
    DecisionKind,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision,
    GlobalAttributeId,
    GlobalConstraintId,
    Inclusion,
    NumericAttribute,
    Selection
} from "../../contract/Types";
import {
    AttributeNotFound,
    AuthenticationFailure,
    BooleanAttributeNotFound,
    ChoiceAttributeNotFound,
    ChoiceValueNotFound,
    ComponentAttributeNotFound,
    ConfigurationModelInvalid,
    ConfigurationModelLoadFailure,
    ConfigurationModelNotFeasible,
    ConfigurationModelNotFound,
    ConfiguratorError,
    ConfiguratorErrorType,
    ConflictWithConsequence,
    DecisionsToRespectInvalid, ExplainConflict, ExplainFailure,
    MissingSessionIdClaim,
    MissingTenantIdClaim,
    NumericAttributeNotFound,
    NumericDecisionOutOfRange,
    RequestFailure,
    RequestTimeout,
    SerializationError,
    ServerError,
    SessionIdInvalid,
    SessionNotFound, SetDecisionConflict,
    SideLoadingForbidden, SnapshotInvalid, SnapshotNotFound,
    SolutionNotFeasible, SolveOperationTimeout,
    SolverInitializationFailure,
    SolverPoolInitializationFailure,
    SpecifiedDeploymentForbidden,
    TenantAccessForbidden,
    UsageRuleRestriction
} from "../../contract/ConfiguratorError";
import {pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {ConfigurationInitializationFailure} from "../../apiClient/engine/Engine";

const serverError: ServerError = {
    type: ConfiguratorErrorType.ServerError
};

export function mapConfiguratorError(problemDetails: Engine.ProblemDetails): ConfiguratorError {
    return match(problemDetails)
        .returnType<ConfiguratorError>()
        .with({type: "ConfigurationModelNotFeasible"}, mapConfigurationModelNotFeasible)
        .with({type: "SpecifiedDeploymentForbidden"}, mapSpecifiedDeploymentForbidden)
        .with({type: "AttributeNotFound"}, mapAttributeNotFound)
        .with({type: "ChoiceAttributeNotFound"}, mapChoiceAttributeNotFound)
        .with({type: "ComponentAttributeNotFound"}, mapComponentAttributeNotFound)
        .with({type: "NumericAttributeNotFound"}, mapNumericAttributeNotFound)
        .with({type: "BooleanAttributeNotFound"}, mapBooleanAttributeNotFound)
        .with({type: "ChoiceValueNotFound"}, mapChoiceValueNotFound)
        .with({type: "NumericDecisionOutOfRange"}, mapNumericDecisionOutOfRange)
        .with({type: "ConflictWithConsequence"}, mapConflictWithConsequence)
        .with({type: "DecisionsToRespectInvalid"}, mapDecisionsToRespectInvalid)
        .with({type: "SessionNotFound"}, mapSessionNotFound)
        // This response is handled explicit by the MakeManyDecisions method. If it occurs outside the MakeManyDecisions scope, it is probably a ServerError.
        .with({type: "PutManyDecisionsConflict"}, () => serverError)
        .with({type: "AssignedChannelNotFound"}, () => serverError)
        .with({type: "InternalServerError"}, () => serverError)
        .with({type: "RequestTimeout"}, p => changeType(p, ConfiguratorErrorType.RequestTimeout) satisfies RequestTimeout)
        .with({type: "RequestFailure"}, p => changeType(p, ConfiguratorErrorType.RequestFailure) satisfies RequestFailure)
        .with({type: "SerializationError"}, p => changeType(p, ConfiguratorErrorType.SerializationError) satisfies SerializationError)
        .with({type: "MissingTenantIdClaim"}, p => changeType(p, ConfiguratorErrorType.MissingTenantIdClaim) satisfies MissingTenantIdClaim)
        .with({type: "MissingSessionIdClaim"}, p => changeType(p, ConfiguratorErrorType.MissingSessionIdClaim) satisfies MissingSessionIdClaim)
        .with({type: "TenantAccessForbidden"}, p => changeType(p, ConfiguratorErrorType.TenantAccessForbidden) satisfies TenantAccessForbidden)
        .with({type: "SessionIdInvalid"}, p => changeType(p, ConfiguratorErrorType.SessionIdInvalid) satisfies SessionIdInvalid)
        .with({type: "AuthenticationFailure"}, p => changeType(p, ConfiguratorErrorType.AuthenticationFailure) satisfies AuthenticationFailure)
        .with({type: "SideLoadingForbidden"}, p => changeType(p, ConfiguratorErrorType.SideLoadingForbidden) satisfies SideLoadingForbidden)
        .with({type: "UsageRuleRestriction"}, p => changeType(p, ConfiguratorErrorType.UsageRuleRestriction) satisfies UsageRuleRestriction)
        .with({type: "ConfigurationModelInvalid"}, p => changeType(p, ConfiguratorErrorType.ConfigurationModelInvalid) satisfies ConfigurationModelInvalid)
        .with({type: "SolutionNotFeasible"}, p => changeType(p, ConfiguratorErrorType.SolutionNotFeasible) satisfies SolutionNotFeasible)
        .with({type: "ConfigurationModelNotFound"}, p => changeType(p, ConfiguratorErrorType.ConfigurationModelNotFound) satisfies ConfigurationModelNotFound)
        .with({type: "SolverInitializationFailure"}, p => changeType(p, ConfiguratorErrorType.SolverInitializationFailure) satisfies SolverInitializationFailure)
        .with({type: "ConfigurationModelLoadFailure"}, p => changeType(p, ConfiguratorErrorType.ConfigurationModelLoadFailure) satisfies ConfigurationModelLoadFailure)
        .with({type: "ConfigurationInitializationFailure"}, p => changeType(p, ConfiguratorErrorType.ConfigurationInitializationFailure) satisfies ConfigurationInitializationFailure)
        .with({type: "SolverPoolInitializationFailure"}, p => changeType(p, ConfiguratorErrorType.SolverPoolInitializationFailure) satisfies SolverPoolInitializationFailure)
        .with({type: "SetDecisionConflict"}, p => changeType(p, ConfiguratorErrorType.SetDecisionConflict) satisfies SetDecisionConflict)
        .with({type: "SolveOperationTimeout"}, p => changeType(p, ConfiguratorErrorType.SolveOperationTimeout) satisfies SolveOperationTimeout)
        .with({type: "ExplainConflict"}, p => changeType(p, ConfiguratorErrorType.ExplainConflict) satisfies ExplainConflict)
        .with({type: "ExplainFailure"}, p => changeType(p, ConfiguratorErrorType.ExplainFailure) satisfies ExplainFailure)
        .with({type: "SnapshotInvalid"}, p => changeType(p, ConfiguratorErrorType.SnapshotInvalid) satisfies SnapshotInvalid)
        .with({type: "SnapshotNotFound"}, p => changeType(p, ConfiguratorErrorType.SnapshotNotFound) satisfies SnapshotNotFound)
        .otherwise(() => serverError);
}

function changeType<E extends { type: string }, T extends ConfiguratorErrorType>
(engine: E, errorType: T): Omit<E, "type"> & { type: T } {
    return {
        ...engine,
        type: errorType
    };
}

function mapConfigurationModelNotFeasible(problem: Engine.ConfigurationModelNotFeasible): ConfigurationModelNotFeasible {
    return {
        ...problem,
        type: ConfiguratorErrorType.ConfigurationModelNotFeasible,
        constraintExplanations: pipe(problem.constraintExplanations ?? [], RA.map(mapConstraintExplanation))
    };
}

function mapSpecifiedDeploymentForbidden(problem: Engine.SpecifiedDeploymentForbidden): SpecifiedDeploymentForbidden {
    return {
        ...problem,
        type: ConfiguratorErrorType.SpecifiedDeploymentForbidden,
    };
}

function mapAttributeNotFound(problem: Engine.AttributeNotFound): AttributeNotFound {
    return {
        ...problem,
        type: ConfiguratorErrorType.AttributeNotFound,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapChoiceAttributeNotFound(problem: Engine.ChoiceAttributeNotFound): ChoiceAttributeNotFound {
    return {
        ...problem,
        type: ConfiguratorErrorType.ChoiceAttributeNotFound,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapComponentAttributeNotFound(problem: Engine.ComponentAttributeNotFound): ComponentAttributeNotFound {
    return {
        ...problem,
        type: ConfiguratorErrorType.ComponentAttributeNotFound,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapNumericAttributeNotFound(problem: Engine.NumericAttributeNotFound): NumericAttributeNotFound {
    return {
        ...problem,
        type: ConfiguratorErrorType.NumericAttributeNotFound,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapBooleanAttributeNotFound(problem: Engine.BooleanAttributeNotFound): BooleanAttributeNotFound {
    return {
        ...problem,
        type: ConfiguratorErrorType.BooleanAttributeNotFound,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapChoiceValueNotFound(problem: Engine.ChoiceValueNotFound): ChoiceValueNotFound {
    const {globalChoiceValueId, ...otherProps} = problem;
    return {
        ...otherProps,
        type: ConfiguratorErrorType.ChoiceValueNotFound,
        globalAttributeId: mapGlobalAttributeId(globalChoiceValueId.attributeId),
        choiceValueId: globalChoiceValueId.choiceValueId
    };
}

function mapNumericDecisionOutOfRange(problem: Engine.NumericDecisionOutOfRange): NumericDecisionOutOfRange {
    return {
        ...problem,
        type: ConfiguratorErrorType.NumericDecisionOutOfRange,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapConflictWithConsequence(problem: Engine.ConflictWithConsequence): ConflictWithConsequence {
    return {
        ...problem,
        type: ConfiguratorErrorType.ConflictWithConsequence,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapDecisionsToRespectInvalid(problem: Engine.DecisionsToRespectInvalid): DecisionsToRespectInvalid {
    return {
        ...problem,
        type: ConfiguratorErrorType.DecisionsToRespectInvalid,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapSessionNotFound(): SessionNotFound {
    return {
        type: ConfiguratorErrorType.SessionNotFound
    };
}

export function mapDecisionExplanation(explanation: Engine.DecisionExplanation) {
    const causedByBooleanDecisions = pipe(
        explanation.causedByBooleanDecisions,
        RA.map(d => ({
            type: AttributeType.Boolean,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: d.state!
        } satisfies CausedByBooleanDecision))
    );
    const causedByNumericDecisions = pipe(
        explanation.causedByNumericDecisions,
        RA.map(d => ({
            type: AttributeType.Numeric,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: d.state!
        } satisfies CausedByNumericDecision))
    );
    const causedByComponentDecisions = pipe(
        explanation.causedByComponentDecisions,
        RA.map(d => ({
            type: AttributeType.Component,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: mapPossibleDecisionStateToComponent(d.state)
        } satisfies CausedByComponentDecision))
    );
    const causedByChoiceValueDecisions = pipe(
        explanation.causedByChoiceDecisions,
        RA.map(d => ({
            type: AttributeType.Choice,
            attributeId: mapGlobalAttributeId(d.attributeId),
            choiceValueId: d.choiceValueId,
            state: mapPossibleDecisionStateToChoice(d.state)
        } satisfies CausedByChoiceValueDecision))
    );

    return {
        causedByBooleanDecisions,
        causedByNumericDecisions,
        causedByComponentDecisions,
        causedByChoiceValueDecisions
    };
}

export function mapConstraintExplanation(explanation: Engine.ConstraintExplanation): ConstraintExplanation {
    const causedByCardinalities = pipe(
        explanation.causedByCardinalities,
        RA.map(c => mapGlobalAttributeId(c.attributeId))
    );

    const causedByRules = pipe(
        explanation.causedByRules,
        RA.map(r => mapGlobalConstraintId(r.constraintId))
    );

    return {
        causedByCardinalities: causedByCardinalities,
        causedByRules: causedByRules
    };
}

export function mapGlobalAttributeId(attributeId: Engine.GlobalAttributeId): GlobalAttributeId {
    const sharedConfigurationModelId = attributeId.sharedConfigurationModelId != null ? attributeId.sharedConfigurationModelId : undefined;
    const componentPath = attributeId.componentPath != null && RA.isNonEmpty(attributeId.componentPath) ? attributeId.componentPath : undefined;

    return {
        localId: attributeId.localId,
        componentPath: componentPath,
        sharedConfigurationModelId: sharedConfigurationModelId,
    };
}

function mapGlobalConstraintId(constraintId: Engine.GlobalConstraintId): GlobalConstraintId {
    return {
        localId: constraintId.localId,
        configurationModelId: constraintId.configurationModelId
    };
}

export function mapPossibleDecisionStateToComponent(state: Engine.PossibleDecisionState): ComponentDecisionState {
    return match(state)
        .with(Engine.PossibleDecisionState.Included, () => ComponentDecisionState.Included)
        .with(Engine.PossibleDecisionState.Excluded, () => ComponentDecisionState.Excluded)
        .exhaustive();
}

export function mapPossibleDecisionStateToChoice(state: Engine.PossibleDecisionState): ChoiceValueDecisionState {
    return match(state)
        .with(Engine.PossibleDecisionState.Included, () => ChoiceValueDecisionState.Included)
        .with(Engine.PossibleDecisionState.Excluded, () => ChoiceValueDecisionState.Excluded)
        .exhaustive();
}

export function mapDecisionKind(kind: Engine.DecisionKind): DecisionKind {
    return match(kind)
        .with(Engine.DecisionKind.Explicit, () => DecisionKind.Explicit)
        .with(Engine.DecisionKind.Implicit, () => DecisionKind.Implicit)
        .exhaustive();
}

export function mapBooleanDecision({state, kind}: Engine.BooleanDecision): BooleanAttribute["decision"] {
    if (state != null) {
        return {
            state: state,
            kind: mapDecisionKind(kind)
        };
    }

    return null;
}

export function mapNumericDecision({state, kind}: Engine.NumericDecision): NumericAttribute["decision"] {
    if (state != null) {
        return {
            state: state,
            kind: mapDecisionKind(kind)
        };
    }

    return null;
}

export function mapComponentDecision({state, kind}: Engine.ComponentDecision): ComponentAttribute["decision"] {
    if (state === Engine.DecisionState.Included || state === Engine.DecisionState.Excluded) {
        return {
            state: match(state)
                .with(Engine.DecisionState.Included, () => ComponentDecisionState.Included)
                .with(Engine.DecisionState.Excluded, () => ComponentDecisionState.Excluded)
                .exhaustive(),
            kind: mapDecisionKind(kind)
        };
    }

    return null;
}

export function mapChoiceValueDecision({state, kind}: Engine.ChoiceValueDecision): ChoiceValue["decision"] {
    if (state === Engine.DecisionState.Included || state === Engine.DecisionState.Excluded) {
        return {
            state: match(state)
                .with(Engine.DecisionState.Included, () => ChoiceValueDecisionState.Included)
                .with(Engine.DecisionState.Excluded, () => ChoiceValueDecisionState.Excluded)
                .exhaustive(),
            kind: mapDecisionKind(kind)
        };
    }

    return null;
}

export function mapSelection(selection: Engine.Selection): Selection {
    return match(selection)
        .with(Engine.Selection.Mandatory, () => Selection.Mandatory)
        .with(Engine.Selection.Optional, () => Selection.Optional)
        .exhaustive();
}

export function mapInclusion(inclusion: Engine.Inclusion): Inclusion {
    return match(inclusion)
        .with(Engine.Inclusion.Always, () => Inclusion.Always)
        .with(Engine.Inclusion.Optional, () => Inclusion.Optional)
        .exhaustive();
}

export function mapToExplicitDecision(decisions: Engine.Decisions): ReadonlyArray<ExplicitDecision> {
    const explicitComponentDecisions = pipe(
        decisions.componentDecisions,
        RA.map(d => ({
            type: AttributeType.Component,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: mapComponentDecision(d)?.state
        } satisfies ExplicitComponentDecision))
    );
    const explicitBooleanDecisions = pipe(
        decisions.booleanDecisions,
        RA.map(d => ({
            type: AttributeType.Boolean,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: mapBooleanDecision(d)?.state
        } satisfies ExplicitBooleanDecision))
    );
    const explicitNumericDecisions = pipe(
        decisions.numericDecisions,
        RA.map(d => ({
            type: AttributeType.Numeric,
            attributeId: mapGlobalAttributeId(d.attributeId),
            state: mapNumericDecision(d)?.state
        } satisfies ExplicitNumericDecision))
    );
    const explicitChoiceDecisions = pipe(
        decisions.choiceValueDecisions,
        RA.map(d => ({
            type: AttributeType.Choice,
            attributeId: mapGlobalAttributeId(d.attributeId),
            choiceValueId: d.choiceValueId,
            state: mapChoiceValueDecision(d)?.state
        } satisfies ExplicitChoiceDecision))
    );

    return pipe(
        explicitChoiceDecisions,
        RA.concat<ExplicitDecision>(explicitComponentDecisions),
        RA.concat<ExplicitDecision>(explicitNumericDecisions),
        RA.concat<ExplicitDecision>(explicitBooleanDecisions),
    );
}