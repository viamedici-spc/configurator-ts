import {Eq, pipe, RA, RM, Str} from "@viamedici-spc/fp-ts-extensions";
import {
    AttributeConsequence,
    AttributeDecision, AttributeMeta,
    BooleanAttributeConsequence,
    BooleanAttributeDecision,
    ChoiceAttributeConsequence,
    ChoiceAttributeDecision,
    ChoiceValueConsequence,
    ChoiceValueDecision,
    ComponentAttributeConsequence,
    ComponentAttributeDecision,
    NumericAttributeConsequence,
    NumericAttributeDecision
} from "./model/PartialAttribute";
import {Semigroup} from "fp-ts/Semigroup";
import * as Se from "fp-ts/Semigroup";
import {match} from "ts-pattern";
import {AttributeType} from "../contract/Types";
import {globalAttributeIdKeyEq} from "../contract/Eqs";

const choiceValueByIdEq = pipe(
    Str.Eq,
    Eq.contramap((c: ChoiceValueDecision | ChoiceValueConsequence) => c.id)
);

const choiceAttributeDecisionSe: Semigroup<ChoiceAttributeDecision> = {
    concat: (x, y) => ({
        ...y,
        values: RA.getUnionSemigroup<ChoiceValueDecision>(choiceValueByIdEq).concat(y.values, x.values)
    })
};
const choiceAttributeConsequenceSe: Semigroup<ChoiceAttributeConsequence> = {
    concat: (x, y) => ({
        ...y,
        values: RA.getUnionSemigroup<ChoiceValueConsequence>(choiceValueByIdEq).concat(y.values, x.values)
    })
};
const otherAttributeDecisionSe: Semigroup<BooleanAttributeDecision | NumericAttributeDecision | ComponentAttributeDecision> = Se.last();
const otherAttributeConsequenceSe: Semigroup<BooleanAttributeConsequence | NumericAttributeConsequence | ComponentAttributeConsequence> = Se.last();

export const attributeDecisionSe: Semigroup<AttributeDecision> = {
    concat: (x, y) => match({x, y})
        .with({x: {type: AttributeType.Numeric}, y: {type: AttributeType.Numeric}}, ({x, y}) =>
            otherAttributeDecisionSe.concat(x, y))
        .with({x: {type: AttributeType.Boolean}, y: {type: AttributeType.Boolean}}, ({x, y}) =>
            otherAttributeDecisionSe.concat(x, y))
        .with({x: {type: AttributeType.Component}, y: {type: AttributeType.Component}}, ({x, y}) =>
            otherAttributeDecisionSe.concat(x, y))
        .with({x: {type: AttributeType.Choice}, y: {type: AttributeType.Choice}}, ({x, y}) =>
            choiceAttributeDecisionSe.concat(x, y))
        .otherwise(() => y)
};
export const attributeConsequenceSe: Semigroup<AttributeConsequence> = {
    concat: (x, y) => match({x, y})
        .with({x: {type: AttributeType.Numeric}, y: {type: AttributeType.Numeric}}, ({x, y}) =>
            otherAttributeConsequenceSe.concat(x, y))
        .with({x: {type: AttributeType.Boolean}, y: {type: AttributeType.Boolean}}, ({x, y}) =>
            otherAttributeConsequenceSe.concat(x, y))
        .with({x: {type: AttributeType.Component}, y: {type: AttributeType.Component}}, ({x, y}) =>
            otherAttributeConsequenceSe.concat(x, y))
        .with({x: {type: AttributeType.Choice}, y: {type: AttributeType.Choice}}, ({x, y}) =>
            choiceAttributeConsequenceSe.concat(x, y))
        .otherwise(() => y)
};
export const attributeMetaSe: Semigroup<AttributeMeta> = Se.last<AttributeMeta>();
export const attributeMetaMapSe = RM.getUnionSemigroup(globalAttributeIdKeyEq, Se.last<AttributeMeta>());
export const attributeDecisionMapSe = RM.getUnionSemigroup(globalAttributeIdKeyEq, attributeDecisionSe);
export const attributeConsequenceMapSe = RM.getUnionSemigroup(globalAttributeIdKeyEq, attributeConsequenceSe);