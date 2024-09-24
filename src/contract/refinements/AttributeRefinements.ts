import {
    Attribute,
    AttributeType,
    BooleanAttribute,
    ChoiceAttribute,
    NumericAttribute,
    ComponentAttribute
} from "../Types";
import {Refinement} from "fp-ts/Refinement";

export const booleanAttributeRefinement: Refinement<Attribute, BooleanAttribute> = (a: Attribute): a is BooleanAttribute => a.type === AttributeType.Boolean;
export const choiceAttributeRefinement: Refinement<Attribute, ChoiceAttribute> = (a: Attribute): a is ChoiceAttribute => a.type === AttributeType.Choice;
export const numericAttributeRefinement: Refinement<Attribute, NumericAttribute> = (a: Attribute): a is NumericAttribute => a.type === AttributeType.Numeric;
export const componentAttributeRefinement: Refinement<Attribute, ComponentAttribute> = (a: Attribute): a is ComponentAttribute => a.type === AttributeType.Component;