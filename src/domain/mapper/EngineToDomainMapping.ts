import type * as Engine from "../../apiClient/engine/Engine";
import {match} from "ts-pattern";
import type {
    BooleanAttribute,
    CausedByBooleanDecision,
    CausedByChoiceValueDecision,
    CausedByComponentDecision,
    CausedByNumericDecision,
    ChoiceValue,
    ComponentAttribute,
    ConstraintExplanation,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision,
    FixedDecision,
    GlobalAttributeId,
    GlobalConstraintId,
    NumericAttribute,
} from "../../contract/Types";
import {
    AttributeType,
    ChoiceValueDecisionState,
    ComponentDecisionState,
    DecisionKind,
    Inclusion,
    Selection,
} from "../../contract/Types";
import type {
    AttributeNotFound,
    AuthenticationFailure,
    BooleanAttributeNotFound,
    ChoiceAttributeNotFound,
    ChoiceValueNotFound,
    ComponentAttributeNotFound,
    ConfigurationInitializationFailure,
    ConfigurationModelInvalid,
    ConfigurationModelLoadFailure,
    ConfigurationModelNotFeasible,
    ConfigurationModelNotFound,
    ConfiguratorError,
    ConflictWithConsequence,
    DecisionsToRespectInvalid,
    ExplainConflict,
    ExplainFailure,
    FixedDecisionsInvalid,
    MissingSessionIdClaim,
    MissingTenantIdClaim,
    NumericAttributeNotFound,
    NumericDecisionOutOfRange,
    RequestFailure,
    RequestTimeout,
    SerializationError,
    ServerError,
    SessionIdInvalid,
    SessionNotFound,
    SessionParametersInvalid,
    SetDecisionConflict,
    SideLoadingForbidden,
    SnapshotInvalid,
    SnapshotNotFound,
    SolutionNotFeasible,
    SolveOperationTimeout,
    SolverInitializationFailure,
    SolverPoolInitializationFailure,
    SpecifiedDeploymentForbidden,
    TenantAccessForbidden,
} from "../../contract/ConfiguratorError";
import {ConfiguratorErrorType} from "../../contract/ConfiguratorError";
import {pipe, RA} from "@viamedici-spc/fp-ts-extensions";

const serverError: ServerError = {
    type: ConfiguratorErrorType.ServerError,
};

export function mapConfiguratorError(problemDetails: Engine.ProblemDetails): ConfiguratorError {
    return (
        match(problemDetails)
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
            .with({type: "FixedDecisionsInvalid"}, mapFixedDecisionsInvalid)
            .with({type: "SessionNotFound"}, mapSessionNotFound)
            // This response is handled explicit by the MakeManyDecisions method. If it occurs outside the MakeManyDecisions scope, it is probably a ServerError.
            .with({type: "PutManyDecisionsConflict"}, () => serverError)
            .with({type: "AssignedChannelNotFound"}, () => serverError)
            .with({type: "InternalServerError"}, () => serverError)
            .with(
                {type: "RequestTimeout"},
                p => mapProblem(p, ConfiguratorErrorType.RequestTimeout) satisfies RequestTimeout,
            )
            .with({type: "RequestFailure"}, mapRequestFailure)
            .with({type: "SerializationError"}, mapSerializationError)
            .with(
                {type: "MissingTenantIdClaim"},
                p => mapProblem(p, ConfiguratorErrorType.MissingTenantIdClaim) satisfies MissingTenantIdClaim,
            )
            .with(
                {type: "MissingSessionIdClaim"},
                p => mapProblem(p, ConfiguratorErrorType.MissingSessionIdClaim) satisfies MissingSessionIdClaim,
            )
            .with(
                {type: "TenantAccessForbidden"},
                p => mapProblem(p, ConfiguratorErrorType.TenantAccessForbidden) satisfies TenantAccessForbidden,
            )
            .with(
                {type: "SessionIdInvalid"},
                p => mapProblem(p, ConfiguratorErrorType.SessionIdInvalid) satisfies SessionIdInvalid,
            )
            .with(
                {type: "AuthenticationFailure"},
                p => mapProblem(p, ConfiguratorErrorType.AuthenticationFailure) satisfies AuthenticationFailure,
            )
            .with(
                {type: "SideLoadingForbidden"},
                p => mapProblem(p, ConfiguratorErrorType.SideLoadingForbidden) satisfies SideLoadingForbidden,
            )
            .with({type: "ConfigurationModelInvalid"}, mapConfigurationModelInvalid)
            .with(
                {type: "SolutionNotFeasible"},
                p => mapProblem(p, ConfiguratorErrorType.SolutionNotFeasible) satisfies SolutionNotFeasible,
            )
            .with(
                {type: "ConfigurationModelNotFound"},
                p =>
                    mapProblem(
                        p,
                        ConfiguratorErrorType.ConfigurationModelNotFound,
                    ) satisfies ConfigurationModelNotFound,
            )
            .with(
                {type: "SolverInitializationFailure"},
                p =>
                    mapProblem(
                        p,
                        ConfiguratorErrorType.SolverInitializationFailure,
                    ) satisfies SolverInitializationFailure,
            )
            .with(
                {type: "ConfigurationModelLoadFailure"},
                p =>
                    mapProblem(
                        p,
                        ConfiguratorErrorType.ConfigurationModelLoadFailure,
                    ) satisfies ConfigurationModelLoadFailure,
            )
            .with({type: "ConfigurationInitializationFailure"}, mapConfigurationInitializationFailure)
            .with(
                {type: "SolverPoolInitializationFailure"},
                p =>
                    mapProblem(
                        p,
                        ConfiguratorErrorType.SolverPoolInitializationFailure,
                    ) satisfies SolverPoolInitializationFailure,
            )
            .with(
                {type: "SetDecisionConflict"},
                p => mapProblem(p, ConfiguratorErrorType.SetDecisionConflict) satisfies SetDecisionConflict,
            )
            .with({type: "SolveOperationTimeout"}, mapSolveOperationTimeout)
            .with({type: "ExplainConflict"}, mapExplainConflict)
            .with({type: "ExplainFailure"}, mapExplainFailure)
            .with({type: "SnapshotInvalid"}, mapSnapshotInvalid)
            .with(
                {type: "SnapshotNotFound"},
                p => mapProblem(p, ConfiguratorErrorType.SnapshotNotFound) satisfies SnapshotNotFound,
            )
            .with(
                {type: "SessionParametersInvalid"},
                p => mapProblem(p, ConfiguratorErrorType.SessionParametersInvalid) satisfies SessionParametersInvalid,
            )
            .otherwise(() => serverError)
    );
}

type ProblemBase = Pick<Engine.ProblemDetails, "title" | "detail">;

/** Copies the fields every engine problem carries; wire-only fields such as `status` stay behind. */
function mapProblem<T extends ConfiguratorErrorType>(
    problem: ProblemBase,
    type: T,
): {readonly type: T; readonly title: string; readonly detail: string} {
    return {
        type: type,
        title: problem.title,
        detail: problem.detail,
    };
}

function mapRequestFailure(problem: Engine.RequestFailure): RequestFailure {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.RequestFailure),
        exception: problem.exception,
    };
}

function mapSerializationError(problem: Engine.SerializationError): SerializationError {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.SerializationError),
        jsonException: problem.jsonException,
    };
}

function mapConfigurationModelInvalid(problem: Engine.ConfigurationModelInvalid): ConfigurationModelInvalid {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ConfigurationModelInvalid),
        validationMessage: problem.validationMessage,
    };
}

function mapConfigurationInitializationFailure(
    problem: Engine.ConfigurationInitializationFailure,
): ConfigurationInitializationFailure {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ConfigurationInitializationFailure),
        deploymentId: problem.deploymentId,
    };
}

function mapSolveOperationTimeout(problem: Engine.SolveOperationTimeout): SolveOperationTimeout {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.SolveOperationTimeout),
        timeout: problem.timeout,
    };
}

function mapExplainConflict(problem: Engine.ExplainConflict): ExplainConflict {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ExplainConflict),
        source: problem.source,
    };
}

function mapExplainFailure(problem: Engine.ExplainFailure): ExplainFailure {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ExplainFailure),
        source: problem.source,
    };
}

function mapSnapshotInvalid(problem: Engine.SnapshotInvalid): SnapshotInvalid {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.SnapshotInvalid),
        validationMessage: problem.validationMessage,
        validationPath: problem.validationPath,
    };
}

function mapConfigurationModelNotFeasible(
    problem: Engine.ConfigurationModelNotFeasible,
): ConfigurationModelNotFeasible {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ConfigurationModelNotFeasible),
        constraintExplanations: pipe(problem.constraintExplanations ?? [], RA.map(mapConstraintExplanation)),
    };
}

function mapSpecifiedDeploymentForbidden(problem: Engine.SpecifiedDeploymentForbidden): SpecifiedDeploymentForbidden {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.SpecifiedDeploymentForbidden),
        channel: problem.channel,
        deploymentName: problem.deploymentName,
    };
}

function mapAttributeNotFound(problem: Engine.AttributeNotFound): AttributeNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.AttributeNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapChoiceAttributeNotFound(problem: Engine.ChoiceAttributeNotFound): ChoiceAttributeNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ChoiceAttributeNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapComponentAttributeNotFound(problem: Engine.ComponentAttributeNotFound): ComponentAttributeNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ComponentAttributeNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapNumericAttributeNotFound(problem: Engine.NumericAttributeNotFound): NumericAttributeNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.NumericAttributeNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapBooleanAttributeNotFound(problem: Engine.BooleanAttributeNotFound): BooleanAttributeNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.BooleanAttributeNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapChoiceValueNotFound(problem: Engine.ChoiceValueNotFound): ChoiceValueNotFound {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ChoiceValueNotFound),
        globalAttributeId: mapGlobalAttributeId(problem.globalChoiceValueId.attributeId),
        choiceValueId: problem.globalChoiceValueId.choiceValueId,
    };
}

function mapNumericDecisionOutOfRange(problem: Engine.NumericDecisionOutOfRange): NumericDecisionOutOfRange {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.NumericDecisionOutOfRange),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
        range: problem.range,
        decision: problem.decision,
    };
}

function mapConflictWithConsequence(problem: Engine.ConflictWithConsequence): ConflictWithConsequence {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.ConflictWithConsequence),
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
        choiceValueId: problem.choiceValueId,
    };
}

function mapDecisionsToRespectInvalid(problem: Engine.DecisionsToRespectInvalid): DecisionsToRespectInvalid {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.DecisionsToRespectInvalid),
        validationMessage: problem.validationMessage,
        globalAttributeId: mapGlobalAttributeId(problem.globalAttributeId),
    };
}

function mapSessionNotFound(): SessionNotFound {
    return {
        type: ConfiguratorErrorType.SessionNotFound,
    };
}

export function mapDecisionExplanation(explanation: Engine.DecisionExplanation) {
    const causedByBooleanDecisions = pipe(
        explanation.causedByBooleanDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Boolean,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: d.state!,
                }) satisfies CausedByBooleanDecision,
        ),
    );
    const causedByNumericDecisions = pipe(
        explanation.causedByNumericDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Numeric,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: d.state!,
                }) satisfies CausedByNumericDecision,
        ),
    );
    const causedByComponentDecisions = pipe(
        explanation.causedByComponentDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Component,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: mapPossibleDecisionStateToComponent(d.state),
                }) satisfies CausedByComponentDecision,
        ),
    );
    const causedByChoiceValueDecisions = pipe(
        explanation.causedByChoiceDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Choice,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    choiceValueId: d.choiceValueId,
                    state: mapPossibleDecisionStateToChoice(d.state),
                }) satisfies CausedByChoiceValueDecision,
        ),
    );

    return {
        causedByBooleanDecisions,
        causedByNumericDecisions,
        causedByComponentDecisions,
        causedByChoiceValueDecisions,
    };
}

export function mapConstraintExplanation(explanation: Engine.ConstraintExplanation): ConstraintExplanation {
    const causedByCardinalities = pipe(
        explanation.causedByCardinalities,
        RA.map(c => mapGlobalAttributeId(c.attributeId)),
    );

    const causedByRules = pipe(
        explanation.causedByRules,
        RA.map(r => mapGlobalConstraintId(r.constraintId)),
    );

    return {
        causedByCardinalities: causedByCardinalities,
        causedByRules: causedByRules,
    };
}

export function mapGlobalAttributeId(attributeId: Engine.GlobalAttributeId): GlobalAttributeId {
    const sharedConfigurationModelId =
        attributeId.sharedConfigurationModelId != null ? attributeId.sharedConfigurationModelId : undefined;
    const componentPath =
        attributeId.componentPath != null && RA.isNonEmpty(attributeId.componentPath)
            ? attributeId.componentPath
            : undefined;

    return {
        localId: attributeId.localId,
        componentPath: componentPath,
        sharedConfigurationModelId: sharedConfigurationModelId,
    };
}

function mapGlobalConstraintId(constraintId: Engine.GlobalConstraintId): GlobalConstraintId {
    return {
        localId: constraintId.localId,
        configurationModelId: constraintId.configurationModelId,
    };
}

export function mapPossibleDecisionStateToComponent(state: Engine.PossibleDecisionState): ComponentDecisionState {
    return match(state)
        .with("Included", () => ComponentDecisionState.Included)
        .with("Excluded", () => ComponentDecisionState.Excluded)
        .exhaustive();
}

export function mapPossibleDecisionStateToChoice(state: Engine.PossibleDecisionState): ChoiceValueDecisionState {
    return match(state)
        .with("Included", () => ChoiceValueDecisionState.Included)
        .with("Excluded", () => ChoiceValueDecisionState.Excluded)
        .exhaustive();
}

export function mapDecisionKind(kind: Engine.DecisionKind): DecisionKind {
    return match(kind)
        .with("Explicit", () => DecisionKind.Explicit)
        .with("Implicit", () => DecisionKind.Implicit)
        .exhaustive();
}

export function mapBooleanDecision({state, kind}: Engine.BooleanDecision): BooleanAttribute["decision"] {
    if (state != null) {
        return {
            state: state,
            kind: mapDecisionKind(kind),
        };
    }

    return null;
}

export function mapNumericDecision({state, kind}: Engine.NumericDecision): NumericAttribute["decision"] {
    if (state != null) {
        return {
            state: state,
            kind: mapDecisionKind(kind),
        };
    }

    return null;
}

export function mapComponentDecision({state, kind}: Engine.ComponentDecision): ComponentAttribute["decision"] {
    if (state === "Included" || state === "Excluded") {
        return {
            state: match(state)
                .with("Included", () => ComponentDecisionState.Included)
                .with("Excluded", () => ComponentDecisionState.Excluded)
                .exhaustive(),
            kind: mapDecisionKind(kind),
        };
    }

    return null;
}

export function mapChoiceValueDecision({state, kind}: Engine.ChoiceValueDecision): ChoiceValue["decision"] {
    if (state === "Included" || state === "Excluded") {
        return {
            state: match(state)
                .with("Included", () => ChoiceValueDecisionState.Included)
                .with("Excluded", () => ChoiceValueDecisionState.Excluded)
                .exhaustive(),
            kind: mapDecisionKind(kind),
        };
    }

    return null;
}

export function mapSelection(selection: Engine.Selection): Selection {
    return match(selection)
        .with("Mandatory", () => Selection.Mandatory)
        .with("Optional", () => Selection.Optional)
        .exhaustive();
}

export function mapInclusion(inclusion: Engine.Inclusion): Inclusion {
    return match(inclusion)
        .with("Always", () => Inclusion.Always)
        .with("Optional", () => Inclusion.Optional)
        .exhaustive();
}

export function mapToExplicitDecision(decisions: Engine.Decisions): ReadonlyArray<ExplicitDecision> {
    const explicitComponentDecisions = pipe(
        decisions.componentDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Component,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: mapComponentDecision(d)?.state,
                }) satisfies ExplicitComponentDecision,
        ),
    );
    const explicitBooleanDecisions = pipe(
        decisions.booleanDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Boolean,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: mapBooleanDecision(d)?.state,
                }) satisfies ExplicitBooleanDecision,
        ),
    );
    const explicitNumericDecisions = pipe(
        decisions.numericDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Numeric,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    state: mapNumericDecision(d)?.state,
                }) satisfies ExplicitNumericDecision,
        ),
    );
    const explicitChoiceDecisions = pipe(
        decisions.choiceValueDecisions,
        RA.map(
            d =>
                ({
                    type: AttributeType.Choice,
                    attributeId: mapGlobalAttributeId(d.attributeId),
                    choiceValueId: d.choiceValueId,
                    state: mapChoiceValueDecision(d)?.state,
                }) satisfies ExplicitChoiceDecision,
        ),
    );

    return pipe(
        explicitChoiceDecisions,
        RA.concat<ExplicitDecision>(explicitComponentDecisions),
        RA.concat<ExplicitDecision>(explicitNumericDecisions),
        RA.concat<ExplicitDecision>(explicitBooleanDecisions),
    );
}

function mapFixedChoiceState(state: Engine.FixedDecisionState): ChoiceValueDecisionState {
    return match(state)
        .with("Included", () => ChoiceValueDecisionState.Included)
        .with("Excluded", () => ChoiceValueDecisionState.Excluded)
        .exhaustive();
}

function mapFixedComponentState(state: Engine.FixedDecisionState): ComponentDecisionState {
    return match(state)
        .with("Included", () => ComponentDecisionState.Included)
        .with("Excluded", () => ComponentDecisionState.Excluded)
        .exhaustive();
}

export function mapToFixedDecisions(decisions: ReadonlyArray<Engine.FixedDecision>): ReadonlyArray<FixedDecision> {
    return pipe(
        decisions,
        RA.map(d =>
            match(d)
                .returnType<FixedDecision>()
                .with({type: "Choice"}, c => ({
                    type: AttributeType.Choice,
                    attributeId: mapGlobalAttributeId(c.attributeId),
                    choiceValueId: c.choiceValueId,
                    state: mapFixedChoiceState(c.state),
                }))
                .with({type: "Component"}, c => ({
                    type: AttributeType.Component,
                    attributeId: mapGlobalAttributeId(c.attributeId),
                    state: mapFixedComponentState(c.state),
                }))
                .with({type: "Numeric"}, c => ({
                    type: AttributeType.Numeric,
                    attributeId: mapGlobalAttributeId(c.attributeId),
                    // rejectedDecisions echo the concrete values the client submitted, so the state is always set.
                    state: c.state!,
                }))
                .with({type: "Boolean"}, c => ({
                    type: AttributeType.Boolean,
                    attributeId: mapGlobalAttributeId(c.attributeId),
                    state: c.state!,
                }))
                .exhaustive(),
        ),
        RA.toArray,
    );
}

function mapFixedDecisionsInvalid(problem: Engine.FixedDecisionsInvalid): FixedDecisionsInvalid {
    return {
        ...mapProblem(problem, ConfiguratorErrorType.FixedDecisionsInvalid),
        rejectedDecisions: mapToFixedDecisions(problem.rejectedDecisions),
        validationMessage: problem.validationMessage,
    };
}