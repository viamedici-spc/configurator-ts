import {match} from "ts-pattern";
import {O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {
    Attribute,
    AttributeType,
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueDecisionState,
    ComponentAttribute,
    ComponentDecisionState,
    Decision,
    DecisionKind, Inclusion,
    NumericAttribute, Selection,
} from "../Types";
import * as ChoiceValueInterpreter from "./ChoiceValueInterpreter";

export function isMandatory(attribute: Attribute): boolean {
    return match(attribute)
        .with({type: AttributeType.Choice}, (a) => a.cardinality.lowerBound > 0)
        .with({type: AttributeType.Boolean}, (a) => a.selection === Selection.Mandatory)
        .with({type: AttributeType.Numeric}, (a) => a.selection === Selection.Mandatory)
        .with({type: AttributeType.Component}, (a) => a.inclusion === Inclusion.Optional && a.selection === Selection.Mandatory)
        .exhaustive();
}

export function isMultiSelect(attribute: Attribute): boolean {
    return match(attribute)
        .with({type: AttributeType.Choice}, (a) => a.cardinality.upperBound > 1)
        .otherwise(() => false);
}

/*
    Choice Attribute
 */

export function getAllowedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(attribute.values, RA.filter(ChoiceValueInterpreter.isAllowed));
}

export function getBlockedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(attribute.values, RA.filter(ChoiceValueInterpreter.isBlocked));
}

export function getChoiceDecisions(attribute: ChoiceAttribute, kind: DecisionKind): ReadonlyArray<Decision<ChoiceValueDecisionState>> {
    return pipe(attribute.values,
        RA.filterMap(v => pipe(v.decision, O.fromNullable,
            O.filter(d => d.kind === kind)
        ))
    );
}

export function getIncludedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(
        attribute.values,
        RA.filter(v => pipe(v.decision, O.fromNullable,
                O.map(d => d.state === ChoiceValueDecisionState.Included),
                O.getOrElse(() => false)
            )
        )
    );
}

export const getSelectedChoiceValues = getIncludedChoiceValues;

/*
    Numeric Attribute
 */

export function getNumericDecision(attribute: NumericAttribute): Decision<number> | null {
    return pipe(attribute.decision,
        O.fromNullable,
        O.filter(d => d.kind === DecisionKind.Explicit),
        O.toNullable
    );
}

/*
    Boolean Attribute
 */

export function getBooleanDecision(attribute: BooleanAttribute): Decision<boolean> | null {
    return pipe(attribute.decision,
        O.fromNullable,
        O.filter(d => d.kind === DecisionKind.Explicit),
        O.toNullable
    );
}

export function isBooleanValuePossible(booleanAttribute: BooleanAttribute, value: boolean): boolean {
    return booleanAttribute.possibleDecisionStates.some(v =>
        v === value
    );
}

/*
    Component Attribute
 */

export function getComponentDecision(attribute: ComponentAttribute): Decision<ComponentDecisionState> | null {
    return pipe(attribute.decision,
        O.fromNullable,
        O.toNullable
    );
}

export function isComponentAllowed(componentAttribute: ComponentAttribute): boolean {
    return isComponentStatePossible(componentAttribute, ComponentDecisionState.Included);
}

export function isComponentBlocked(componentAttribute: ComponentAttribute): boolean {
    return !isComponentAllowed(componentAttribute);
}

export function isComponentStatePossible(componentAttribute: ComponentAttribute, state: ComponentDecisionState): boolean {
    return componentAttribute.possibleDecisionStates.some(s =>
        s === state
    );
}