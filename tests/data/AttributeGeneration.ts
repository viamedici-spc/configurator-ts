import GlobalAttributeIdKeyBuilder from "../../src/crossCutting/GlobalAttributeIdKeyBuilder";
import {
    AttributeType,
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueDecisionState,
    ComponentAttribute,
    ComponentDecisionState,
    GlobalAttributeId,
    GlobalAttributeIdKey,
    Inclusion,
    NumericAttribute,
    Selection
} from "../../src";
import {calculateAttributeHash} from "../../src/crossCutting/AttributeHashing";
import {HashedAttribute} from "../../src/domain/model/HashedAttribute";

export function getBooleanAttribute(localId: string, partial?: Partial<BooleanAttribute & HashedAttribute>): [GlobalAttributeIdKey, BooleanAttribute & HashedAttribute]
export function getBooleanAttribute(globalId: GlobalAttributeId, partial?: Partial<BooleanAttribute & HashedAttribute>): [GlobalAttributeIdKey, BooleanAttribute & HashedAttribute]
export function getBooleanAttribute(globalOrLocalId: string | GlobalAttributeId, partial?: Partial<BooleanAttribute & HashedAttribute>): [GlobalAttributeIdKey, BooleanAttribute & HashedAttribute] {
    const id = typeof globalOrLocalId === "string" ? {localId: globalOrLocalId} : globalOrLocalId;
    const key = GlobalAttributeIdKeyBuilder(id);

    const attribute: BooleanAttribute = {
        type: AttributeType.Boolean,
        id: id,
        key: key,
        isSatisfied: false,
        canContributeToConfigurationSatisfaction: false,
        decision: null,
        selection: Selection.Mandatory,
        possibleDecisionStates: [true, false],
        ...partial ?? {},
    };

    const hashedAttribute: HashedAttribute & BooleanAttribute = {
        ...attribute,
        hash: calculateAttributeHash(attribute),
        ...partial ?? {},
    };

    return [key, hashedAttribute];
}

export function getNumericAttribute(localId: string, partial?: Partial<NumericAttribute & HashedAttribute>): [GlobalAttributeIdKey, NumericAttribute & HashedAttribute]
export function getNumericAttribute(globalId: GlobalAttributeId, partial?: Partial<NumericAttribute & HashedAttribute>): [GlobalAttributeIdKey, NumericAttribute & HashedAttribute]
export function getNumericAttribute(globalOrLocalId: string | GlobalAttributeId, partial?: Partial<NumericAttribute & HashedAttribute>): [GlobalAttributeIdKey, NumericAttribute & HashedAttribute] {
    const id = typeof globalOrLocalId === "string" ? {localId: globalOrLocalId} : globalOrLocalId;
    const key = GlobalAttributeIdKeyBuilder(id);

    const attribute: NumericAttribute = {
        type: AttributeType.Numeric,
        id: id,
        key: key,
        isSatisfied: false,
        canContributeToConfigurationSatisfaction: false,
        decision: null,
        selection: Selection.Mandatory,
        decimalPlaces: 0,
        range: {
            min: 0,
            max: 10
        },
        ...partial ?? {},
    };

    const hashedAttribute: HashedAttribute & NumericAttribute = {
        ...attribute,
        hash: calculateAttributeHash(attribute),
        ...partial ?? {},
    };

    return [key, hashedAttribute];
}

export function getComponentAttribute(localId: string, partial?: Partial<ComponentAttribute & HashedAttribute>): [GlobalAttributeIdKey, ComponentAttribute & HashedAttribute]
export function getComponentAttribute(globalId: GlobalAttributeId, partial?: Partial<ComponentAttribute & HashedAttribute>): [GlobalAttributeIdKey, ComponentAttribute & HashedAttribute]
export function getComponentAttribute(globalOrLocalId: string | GlobalAttributeId, partial?: Partial<ComponentAttribute & HashedAttribute>): [GlobalAttributeIdKey, ComponentAttribute & HashedAttribute] {
    const id = typeof globalOrLocalId === "string" ? {localId: globalOrLocalId} : globalOrLocalId;
    const key = GlobalAttributeIdKeyBuilder(id);

    const attribute: ComponentAttribute = {
        type: AttributeType.Component,
        id: id,
        key: key,
        isSatisfied: false,
        canContributeToConfigurationSatisfaction: false,
        decision: null,
        selection: Selection.Mandatory,
        inclusion: Inclusion.Optional,
        possibleDecisionStates: [ComponentDecisionState.Included, ComponentDecisionState.Excluded],
        ...partial ?? {},
    };

    const hashedAttribute: HashedAttribute & ComponentAttribute = {
        ...attribute,
        hash: calculateAttributeHash(attribute),
        ...partial ?? {},
    };

    return [key, hashedAttribute];
}

export function getChoiceAttribute(localId: string, partial?: Partial<ChoiceAttribute & HashedAttribute>): [GlobalAttributeIdKey, ChoiceAttribute & HashedAttribute]
export function getChoiceAttribute(globalId: GlobalAttributeId, partial?: Partial<ChoiceAttribute & HashedAttribute>): [GlobalAttributeIdKey, ChoiceAttribute & HashedAttribute]
export function getChoiceAttribute(globalOrLocalId: string | GlobalAttributeId, partial?: Partial<ChoiceAttribute & HashedAttribute>): [GlobalAttributeIdKey, ChoiceAttribute & HashedAttribute] {
    const id = typeof globalOrLocalId === "string" ? {localId: globalOrLocalId} : globalOrLocalId;
    const key = GlobalAttributeIdKeyBuilder(id);

    const attribute: ChoiceAttribute = {
        type: AttributeType.Choice,
        id: id,
        key: key,
        isSatisfied: false,
        canContributeToConfigurationSatisfaction: false,
        cardinality: {
            upperBound: 1,
            lowerBound: 1
        },
        values: new Map([
            ["V1", {
                id: "V1",
                decision: null,
                possibleDecisionStates: [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]
            } satisfies ChoiceValue],
            ["V2", {
                id: "V2",
                decision: null,
                possibleDecisionStates: [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]
            } satisfies ChoiceValue]
        ]),
        ...partial ?? {},
    };

    const hashedAttribute: HashedAttribute & ChoiceAttribute = {
        ...attribute,
        hash: calculateAttributeHash(attribute),
        ...partial ?? {},
    };

    return [key, hashedAttribute];
}