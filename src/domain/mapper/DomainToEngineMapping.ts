import * as Engine from "../../apiClient/engine/Engine";
import {match, P} from "ts-pattern";
import {
    AllowedRulesInExplainType,
    AttributeType,
    ChoiceValueDecisionState,
    ChoiceValueId,
    ComponentDecisionState,
    ConfigurationModelSourceType,
    ExplainQuestionSubject,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision,
    FixedDecision,
    GlobalAttributeId, MakeManyDecisionsMode,
    SessionContext,
    WhyIsNotSatisfied, WhyIsStateNotPossible
} from "../../contract/Types";
import {pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {Refinement} from "fp-ts/Refinement";

export function mapGlobalAttributeId(atttributeId: GlobalAttributeId): Engine.GlobalAttributeId {
    return {
        sharedConfigurationModelId: atttributeId.sharedConfigurationModelId,
        componentPath: atttributeId.componentPath != null ? RA.toArray(atttributeId.componentPath) : undefined,
        localId: atttributeId.localId
    };
}

// Shared wire-shape builders: Explicit and Fixed decisions serialise to the same object per attribute type; only the
// state representation differs, so the caller passes the already-mapped state.
function toEngineChoice<S>(decision: { attributeId: GlobalAttributeId, choiceValueId: ChoiceValueId }, state: S) {
    return {type: "Choice" as const, attributeId: mapGlobalAttributeId(decision.attributeId), choiceValueId: decision.choiceValueId, state};
}

function toEngineComponent<S>(decision: { attributeId: GlobalAttributeId }, state: S) {
    return {type: "Component" as const, attributeId: mapGlobalAttributeId(decision.attributeId), state};
}

function toEngineNumeric<S>(decision: { attributeId: GlobalAttributeId }, state: S) {
    return {type: "Numeric" as const, attributeId: mapGlobalAttributeId(decision.attributeId), state};
}

function toEngineBoolean<S>(decision: { attributeId: GlobalAttributeId }, state: S) {
    return {type: "Boolean" as const, attributeId: mapGlobalAttributeId(decision.attributeId), state};
}

// Explicit decisions: a null/undefined state means "reset" and maps to the engine's Undefined state.
function mapExplicitDecisionState(state: ChoiceValueDecisionState | ComponentDecisionState | null | undefined): Engine.DecisionState {
    return match(state)
        .with(P.nullish, () => Engine.DecisionState.Undefined)
        .with(P.union(ChoiceValueDecisionState.Included, ComponentDecisionState.Included), () => Engine.DecisionState.Included)
        .with(P.union(ChoiceValueDecisionState.Excluded, ComponentDecisionState.Excluded), () => Engine.DecisionState.Excluded)
        .exhaustive();
}

export function mapExplicitChoiceDecision(decision: ExplicitChoiceDecision): Engine.ExplicitChoiceValueDecision {
    return toEngineChoice(decision, mapExplicitDecisionState(decision.state));
}

export function mapExplicitComponentDecision(decision: ExplicitComponentDecision): Engine.ExplicitComponentDecision {
    return toEngineComponent(decision, mapExplicitDecisionState(decision.state));
}

export function mapExplicitNumericDecision(decision: ExplicitNumericDecision): Engine.ExplicitNumericDecision {
    return toEngineNumeric(decision, decision.state);
}

export function mapExplicitBooleanDecision(decision: ExplicitBooleanDecision): Engine.ExplicitBooleanDecision {
    return toEngineBoolean(decision, decision.state);
}

export function mapExplicitDecision(decision: ExplicitDecision): Engine.ExplicitDecision {
    return match(decision)
        .with({type: AttributeType.Choice}, mapExplicitChoiceDecision)
        .with({type: AttributeType.Component}, mapExplicitComponentDecision)
        .with({type: AttributeType.Boolean}, mapExplicitBooleanDecision)
        .with({type: AttributeType.Numeric}, mapExplicitNumericDecision)
        .exhaustive();
}

export function mapFixedDecisions(decisions: ReadonlyArray<FixedDecision>): Engine.FixedDecision[] {
    return pipe(decisions, RA.map(mapFixedDecision), RA.toArray);
}

export function mapFixedDecision(decision: FixedDecision): Engine.FixedDecision {
    return match(decision)
        .returnType<Engine.FixedDecision>()
        .with({type: AttributeType.Choice}, d => toEngineChoice(d, mapFixedDecisionState(d.state)))
        .with({type: AttributeType.Component}, d => toEngineComponent(d, mapFixedDecisionState(d.state)))
        .with({type: AttributeType.Numeric}, d => toEngineNumeric(d, d.state))
        .with({type: AttributeType.Boolean}, d => toEngineBoolean(d, d.state))
        .exhaustive();
}

// Fixed decisions require a concrete state (no "reset"): choice/component states map straight to the engine's
// two-valued FixedDecisionState.
function mapFixedDecisionState(state: ChoiceValueDecisionState | ComponentDecisionState): Engine.FixedDecisionState {
    return match(state)
        .with(P.union(ChoiceValueDecisionState.Included, ComponentDecisionState.Included), () => Engine.FixedDecisionState.Included)
        .with(P.union(ChoiceValueDecisionState.Excluded, ComponentDecisionState.Excluded), () => Engine.FixedDecisionState.Excluded)
        .exhaustive();
}

export function mapSessionContext(sessionContext: SessionContext): Engine.CreateSessionRequest {
    const configurationModelSource = match(sessionContext.configurationModelSource)
        .returnType<Engine.ConfigurationModelSource>()
        .with({type: ConfigurationModelSourceType.Channel}, c => ({
            type: "Channel",
            deploymentName: c.deploymentName,
            channel: c.channel
        } satisfies Engine.ConfigurationModelFromChannel))
        .with({type: ConfigurationModelSourceType.Package}, p => ({
            type: "Package",
            configurationModelPackage: p.configurationModelPackage
        } satisfies Engine.ConfigurationModelFromPackage))
        .exhaustive();

    const allowedInExplain = (): Engine.AllowedInExplain | undefined => {
        const rules = sessionContext.allowedInExplain?.rules
            ? match(sessionContext.allowedInExplain.rules)
                .returnType<Engine.AllowedRules>()
                .with({type: AllowedRulesInExplainType.all}, () => ({type: "AllowedRulesAll"} satisfies Engine.AllowedRulesAll))
                .with({type: AllowedRulesInExplainType.none}, () => ({type: "AllowedRulesNone"} satisfies Engine.AllowedRulesNone))
                .with({type: AllowedRulesInExplainType.specific}, s => ({
                    type: "AllowedRulesSpecific",
                    rules: pipe(
                        s.rules,
                        RA.map(r => ({
                            configurationModelId: r.configurationModelId,
                            localId: r.localId
                        } satisfies Engine.GlobalConstraintId)),
                        RA.toArray
                    )
                } satisfies Engine.AllowedRulesSpecific))
                .exhaustive()
            : undefined;

        if (rules) {
            return {
                rules: rules
            };
        }

        return undefined;
    };

    const attributeRelations = sessionContext.attributeRelations
        ? pipe(
            sessionContext.attributeRelations,
            RA.map(r => ({
                attributeId: mapGlobalAttributeId(r.attributeId),
                decisions: pipe(r.decisions, RA.map(mapGlobalAttributeId), RA.toArray)
            } satisfies Engine.DecisionsToRespect)),
            RA.toArray
        )
        : undefined;

    const wizardAttributeRelations = sessionContext.wizardAttributeRelations
        ? pipe(
            sessionContext.wizardAttributeRelations,
            RA.map(w => ({
                attributes: pipe(w.attributes, RA.map(mapGlobalAttributeId), RA.toArray)
            }satisfies Engine.WizardStep)),
            RA.toArray
        )
        : undefined;

    const fixedDecisions = sessionContext.fixedDecisions && RA.isNonEmpty(sessionContext.fixedDecisions)
        ? mapFixedDecisions(sessionContext.fixedDecisions)
        : undefined;

    return {
        configurationModelSource: configurationModelSource,
        allowedInExplain: allowedInExplain(),
        attributeRelations: attributeRelations,
        wizardAttributeRelations: wizardAttributeRelations,
        disableConfigurationModelTrimming: sessionContext.disableConfigurationModelTrimming,
        fixedDecisions: fixedDecisions,
    };
}

export function mapManyDecisions(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode): Engine.ExplicitDecisions {
    const getDecisions = <D extends ExplicitDecision, E>(refinement: Refinement<ExplicitDecision, D>, mapper: (d: D) => E) => pipe(
        decisions,
        RA.filter(refinement),
        RA.map(mapper),
        RA.toArray
    );
    const booleanDecisions = getDecisions((a): a is ExplicitBooleanDecision => a.type === AttributeType.Boolean, mapExplicitBooleanDecision);
    const numericDecisions = getDecisions((a): a is ExplicitNumericDecision => a.type === AttributeType.Numeric, mapExplicitNumericDecision);
    const componentDecisions = getDecisions((a): a is ExplicitComponentDecision => a.type === AttributeType.Component, mapExplicitComponentDecision);
    const choiceDecisions = getDecisions((a): a is ExplicitChoiceDecision => a.type === AttributeType.Choice, mapExplicitChoiceDecision);

    const engineMode = match(mode)
        .with({type: "DropExistingDecisions"}, d => ({
            type: "DropExistingDecisions",
            conflictResolution: match(d.conflictHandling)
                .with({type: "Automatic"}, () => ({
                    type: "Automatic"
                } satisfies Engine.AutomaticConflictResolution))
                .with({type: "Manual"}, m => ({
                    type: "Manual",
                    includeConstraintsInConflictExplanation: m.includeConstraintsInConflictExplanation
                } satisfies Engine.ManualConflictResolution))
                .exhaustive()
        } satisfies Engine.DropExistingDecisionsMode))
        .with({type: "KeepExistingDecisions"}, () => ({
            type: "KeepExistingDecisions",
        } satisfies  Engine.KeepExistingDecisionsMode))
        .exhaustive();

    return {
        booleanDecisions: booleanDecisions,
        componentDecisions: componentDecisions,
        numericDecisions: numericDecisions,
        choiceDecisions: choiceDecisions,
        mode: engineMode
    };
}

export function mapWhyNotSatisfied(explainQuestion: WhyIsNotSatisfied): Engine.WhyNotSatisfiedRequest {
    return match(explainQuestion)
        .returnType<Engine.WhyNotSatisfiedRequest>()
        .with({subject: ExplainQuestionSubject.configuration}, () => ({
            type: "Configuration"
        } satisfies Engine.WhyConfigurationNotSatisfiedRequest))
        .with({subject: ExplainQuestionSubject.attribute}, q => ({
            type: "Attribute",
            attributeId: mapGlobalAttributeId(q.attributeId)
        } satisfies Engine.WhyAttributeNotSatisfiedRequest))
        .exhaustive();
}

export function mapWhyStateNotPossible(explainQuestion: WhyIsStateNotPossible): Engine.WhyStateNotPossibleRequest {
    return match(explainQuestion)
        .returnType<Engine.WhyStateNotPossibleRequest>()
        .with({subject: ExplainQuestionSubject.boolean}, q => ({
            type: "Boolean",
            attributeId: mapGlobalAttributeId(q.attributeId),
            state: q.state
        } satisfies Engine.WhyBooleanStateNotPossibleRequest))
        .with({subject: ExplainQuestionSubject.numeric}, q => ({
            type: "Numeric",
            attributeId: mapGlobalAttributeId(q.attributeId),
            state: q.state
        } satisfies Engine.WhyNumericStateNotPossibleRequest))
        .with({subject: ExplainQuestionSubject.component}, q => ({
            type: "Component",
            attributeId: mapGlobalAttributeId(q.attributeId),
            state: match(q.state)
                .with(ComponentDecisionState.Included, () => Engine.PossibleDecisionState.Included)
                .with(ComponentDecisionState.Excluded, () => Engine.PossibleDecisionState.Excluded)
                .exhaustive()
        } satisfies Engine.WhyComponentStateNotPossibleRequest))
        .with({subject: ExplainQuestionSubject.choiceValue}, q => ({
            type: "ChoiceValue",
            attributeId: mapGlobalAttributeId(q.attributeId),
            choiceValueId: q.choiceValueId,
            state: match(q.state)
                .with(ChoiceValueDecisionState.Included, () => Engine.PossibleDecisionState.Included)
                .with(ChoiceValueDecisionState.Excluded, () => Engine.PossibleDecisionState.Excluded)
                .exhaustive()
        } satisfies Engine.WhyChoiceValueStateNotPossibleRequest))
        .exhaustive();
}