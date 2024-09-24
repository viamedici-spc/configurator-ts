import {match} from "ts-pattern";
import {Ord, OrdT, pipe, RA, RM} from "@viamedici-spc/fp-ts-extensions";
import {
    Attribute,
    AttributeType,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueDecisionState, ChoiceValueId,
    Inclusion,
    Selection,
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

export function isChoiceAttributeMultiSelect(attribute: ChoiceAttribute): boolean {
    return attribute.cardinality.upperBound > 1;
}

export function getAllowedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(
        attribute.values,
        RM.toReadonlyArray(Ord.trivial as OrdT<ChoiceValueId>),
        RA.map(([_, value]) => value),
        RA.filter(ChoiceValueInterpreter.isAllowed)
    );
}

export function getBlockedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(
        attribute.values,
        RM.toReadonlyArray(Ord.trivial as OrdT<ChoiceValueId>),
        RA.map(([_, value]) => value),
        RA.filter(ChoiceValueInterpreter.isBlocked)
    );
}

export function getIncludedChoiceValues(attribute: ChoiceAttribute): ReadonlyArray<ChoiceValue> {
    return pipe(
        attribute.values,
        RM.filter(v => v.decision?.state === ChoiceValueDecisionState.Included),
        RM.toReadonlyArray(Ord.trivial as OrdT<ChoiceValueId>),
        RA.map(([_, value]) => value),
    );
}