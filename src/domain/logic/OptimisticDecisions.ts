import {
    Attribute,
    AttributeType, BooleanAttribute, ChoiceAttribute, ChoiceValue,
    ChoiceValueDecisionState, ComponentAttribute,
    ComponentDecisionState, Decision,
    DecisionKind, ExplicitDecision, MakeManyDecisionsMode, NumericAttribute,
} from "../../contract/Types";
import GlobalAttributeIdKeyBuilder from "../../crossCutting/GlobalAttributeIdKeyBuilder";
import {match} from "ts-pattern";
import {identity, pipe, RA, RM} from "@viamedici-spc/fp-ts-extensions";
import {reduceUpdateFunctions} from "../../crossCutting/UpdateFunctionHelper";
import {updateAttribute, updateAttributes} from "./Configuration";

export function makeDecision(decision: ExplicitDecision) {
    return updateAttributes(applyDecision(decision));
}

export function makeManyDecisions(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode) {
    const resetAllDecisions = () => updateAttributes(RM.map(a => match(a)
        .returnType<Attribute>()
        .with({type: AttributeType.Boolean}, b => ({...b, decision: null} satisfies BooleanAttribute))
        .with({type: AttributeType.Numeric}, n => ({...n, decision: null} satisfies NumericAttribute))
        .with({type: AttributeType.Component}, c => ({...c, decision: null} satisfies  ComponentAttribute))
        .with({type: AttributeType.Choice}, c => ({
            ...c,
            values: pipe(c.values, RM.map(v => ({...v, decision: null} satisfies ChoiceValue)))
        } satisfies ChoiceAttribute))
        .exhaustive()
    ));
    return pipe(
        [
            mode.type === "DropExistingDecisions" ? resetAllDecisions() : identity,
            pipe(decisions, RA.map(applyDecision), updateAttributes)
        ],
        reduceUpdateFunctions
    );
}

function applyDecision(decision: ExplicitDecision) {
    const handleState = <T extends number | boolean | ComponentDecisionState | ChoiceValueDecisionState>(state: T | null | undefined): Decision<T> | null =>
        state != null
            ? {
                state: state,
                kind: DecisionKind.Explicit
            } satisfies Decision<T>
            : null;

    return updateAttribute(GlobalAttributeIdKeyBuilder(decision.attributeId), a => match({attribute: a, decision})
        .returnType<Attribute>()
        .with({attribute: {type: AttributeType.Boolean}, decision: {type: AttributeType.Boolean}},
            ({attribute, decision}) => ({
                ...attribute,
                decision: handleState(decision.state)
            } satisfies BooleanAttribute))
        .with({attribute: {type: AttributeType.Numeric}, decision: {type: AttributeType.Numeric}},
            ({attribute, decision}) => ({
                ...attribute,
                decision: handleState(decision.state)
            } satisfies NumericAttribute))
        .with({attribute: {type: AttributeType.Component}, decision: {type: AttributeType.Component}},
            ({attribute, decision}) => ({
                ...attribute,
                decision: handleState(decision.state)
            } satisfies ComponentAttribute))
        .with({attribute: {type: AttributeType.Choice}, decision: {type: AttributeType.Choice}},
            ({attribute, decision}) => ({
                ...attribute,
                values: pipe(
                    attribute.values,
                    RM.map(v => ({
                        ...v,
                        decision: v.id === decision.choiceValueId
                            ? handleState(decision.state)
                            : (attribute.cardinality.upperBound !== 1
                                ? v.decision
                                : null)
                    } satisfies ChoiceValue))
                )
            } satisfies ChoiceAttribute))
        .otherwise(() => a));
}