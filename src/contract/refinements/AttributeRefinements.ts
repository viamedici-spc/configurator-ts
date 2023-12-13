import {
    Attribute,
    LocalAttributeId,
    AttributeType,
    BooleanAttribute,
    ChoiceAttribute,
    NumericAttribute,
    ComponentAttribute
} from "../Types";

export const booleanAttributeRefinement = (a: Attribute): a is BooleanAttribute => a.type === AttributeType.Boolean;
export const choiceAttributeRefinement = (a: Attribute): a is ChoiceAttribute => a.type === AttributeType.Choice;
export const numericAttributeRefinement = (a: Attribute): a is NumericAttribute => a.type === AttributeType.Numeric;
export const componentAttributeRefinement = (a: Attribute): a is ComponentAttribute => a.type === AttributeType.Component;
export const attributeIdRefinement = (a: string): a is LocalAttributeId => true;