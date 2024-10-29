import {
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ComponentAttribute, GlobalAttributeIdKey,
    NumericAttribute, SourceAttributeId
} from "../../contract/Types";

export type BooleanAttributeDecision = Pick<BooleanAttribute, "type" | "id" | "key" | "decision" | "nonOptimisticDecision">;
export type NumericAttributeDecision = Pick<NumericAttribute, "type" | "id" | "key" | "decision" | "nonOptimisticDecision">;
export type ComponentAttributeDecision = Pick<ComponentAttribute, "type" | "id" | "key" | "decision" | "nonOptimisticDecision">;
export type ChoiceAttributeDecision = Pick<ChoiceAttribute, "type" | "id" | "key"> & {
    values: ReadonlyArray<ChoiceValueDecision>
};
export type ChoiceValueDecision = Pick<ChoiceValue, "id" | "decision" | "nonOptimisticDecision">;
export type AttributeDecision =
    BooleanAttributeDecision
    | NumericAttributeDecision
    | ComponentAttributeDecision
    | ChoiceAttributeDecision;

export type BooleanAttributeConsequence = Pick<BooleanAttribute, "type" | "id" | "key" | "isSatisfied" | "possibleDecisionStates" | "selection">;
export type NumericAttributeConsequence = Pick<NumericAttribute, "type" | "id" | "key" | "isSatisfied" | "decimalPlaces" | "range" | "selection">;
export type ComponentAttributeConsequence = Pick<ComponentAttribute, "type" | "id" | "key" | "isSatisfied" | "possibleDecisionStates" | "selection" | "inclusion">;
export type ChoiceAttributeConsequence = Pick<ChoiceAttribute, "type" | "id" | "key" | "isSatisfied" | "cardinality">
    & {
    values: ReadonlyArray<ChoiceValueConsequence>
};
export type ChoiceValueConsequence = Pick<ChoiceValue, "id" | "possibleDecisionStates">;
export type AttributeConsequence =
    BooleanAttributeConsequence
    | NumericAttributeConsequence
    | ComponentAttributeConsequence
    | ChoiceAttributeConsequence;

export type AttributeMeta = {
    key: GlobalAttributeIdKey,
    sourceId: SourceAttributeId
};

export type PartialAttribute = AttributeDecision | AttributeConsequence | AttributeMeta;