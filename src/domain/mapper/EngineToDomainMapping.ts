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
    DecisionKind, ExplicitBooleanDecision,
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
    BooleanAttributeNotFound,
    ChoiceAttributeNotFound,
    ChoiceValueNotFound,
    ComponentAttributeNotFound,
    ConfigurationModelNotFeasible,
    ConflictWithConsequence,
    DecisionsToRespectInvalid,
    NumericAttributeNotFound,
    NumericDecisionOutOfRange,
    ConfiguratorError,
    ServerError,
    SessionNotFound,
    SpecifiedDeploymentForbidden
} from "../../contract/ConfiguratorError";
import {pipe, RA} from "@viamedici-spc/fp-ts-extensions";

const serverError: ServerError = {
    type: "ServerError"
};

export function mapConfiguratorError(problemDetails: Engine.ProblemDetails): ConfiguratorError {
    // TODO: May handle all types explicit to remove Unspecified from the Problems.

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
        // This response is handled explicit by the SetMany method. If it occurs outside the SetMany scope, it is probably a ServerError.
        .with({type: "PutManyDecisionsConflict"}, () => serverError)
        .with({type: "AssignedChannelNotFound"}, () => serverError)
        .with({type: "InternalServerError"}, () => serverError)
        .with({type: "RequestTimeout"}, p => p as Engine.RequestTimeout)
        .with({type: "RequestFailure"}, p => p as Engine.RequestFailure)
        .with({type: "SerializationError"}, p => p as Engine.SerializationError)
        .with({type: "MissingTenantIdClaim"}, p => p as Engine.MissingTenantIdClaim)
        .with({type: "MissingSessionIdClaim"}, p => p as Engine.MissingSessionIdClaim)
        .with({type: "TenantAccessForbidden"}, p => p as Engine.TenantAccessForbidden)
        .with({type: "SessionIdInvalid"}, p => p as Engine.SessionIdInvalid)
        .with({type: "AuthenticationFailure"}, p => p as Engine.AuthenticationFailure)
        .with({type: "SideLoadingForbidden"}, p => p as Engine.SideLoadingForbidden)
        .with({type: "UsageRuleRestriction"}, p => p as Engine.UsageRuleRestriction)
        .with({type: "ConfigurationModelInvalid"}, p => p as Engine.ConfigurationModelInvalid)
        .with({type: "SolutionNotFeasible"}, p => p as Engine.SolutionNotFeasible)
        .with({type: "ConfigurationModelNotFound"}, p => p as Engine.ConfigurationModelNotFound)
        .with({type: "SolverInitializationFailure"}, p => p as Engine.SolverInitializationFailure)
        .with({type: "ConfigurationModelLoadFailure"}, p => p as Engine.ConfigurationModelLoadFailure)
        .with({type: "ConfigurationInitializationFailure"}, p => p as Engine.ConfigurationInitializationFailure)
        .with({type: "SolverPoolInitializationFailure"}, p => p as Engine.SolverPoolInitializationFailure)
        .with({type: "SetDecisionConflict"}, p => p as Engine.SetDecisionConflict)
        .with({type: "SolveOperationTimeout"}, p => p as Engine.SolveOperationTimeout)
        .with({type: "ExplainConflict"}, p => p as Engine.ExplainConflict)
        .with({type: "ExplainFailure"}, p => p as Engine.ExplainFailure)
        .with({type: "SnapshotInvalid"}, p => p as Engine.SnapshotInvalid)
        .with({type: "SnapshotNotFound"}, p => p as Engine.SnapshotNotFound)
        .otherwise(() => serverError);
}

function mapConfigurationModelNotFeasible(problem: Engine.ConfigurationModelNotFeasible): ConfigurationModelNotFeasible {
    return {
        ...problem,
        constraintExplanations: pipe(problem.constraintExplanations ?? [], RA.map(mapConstraintExplanation))
    };
}

function mapSpecifiedDeploymentForbidden(problem: Engine.SpecifiedDeploymentForbidden): SpecifiedDeploymentForbidden {
    return problem;
}

function mapAttributeNotFound(problem: Engine.AttributeNotFound): AttributeNotFound {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapChoiceAttributeNotFound(problem: Engine.ChoiceAttributeNotFound): ChoiceAttributeNotFound {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapComponentAttributeNotFound(problem: Engine.ComponentAttributeNotFound): ComponentAttributeNotFound {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapNumericAttributeNotFound(problem: Engine.NumericAttributeNotFound): NumericAttributeNotFound {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapBooleanAttributeNotFound(problem: Engine.BooleanAttributeNotFound): BooleanAttributeNotFound {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapChoiceValueNotFound(problem: Engine.ChoiceValueNotFound): ChoiceValueNotFound {
    const {globalChoiceValueId, ...otherProps} = problem;
    return {
        ...otherProps,
        globalAttributeId: mapGlobalAttributeId(globalChoiceValueId.attributeId),
        choiceValueId: globalChoiceValueId.choiceValueId
    };
}

function mapNumericDecisionOutOfRange(problem: Engine.NumericDecisionOutOfRange): NumericDecisionOutOfRange {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId)
    };
}

function mapConflictWithConsequence(problem: Engine.ConflictWithConsequence): ConflictWithConsequence {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapDecisionsToRespectInvalid(problem: Engine.DecisionsToRespectInvalid): DecisionsToRespectInvalid {
    return {
        ...problem,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapSessionNotFound(problem: Engine.SessionNotFound): SessionNotFound {
    return {
        type: problem.type
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