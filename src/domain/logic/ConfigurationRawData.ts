import ConfigurationRawData from "../model/ConfigurationRawData";
import {flow, O, Ord, OrdT, pipe, RA, RM, some} from "@viamedici-spc/fp-ts-extensions";
import {
    AttributeDecision,
    BooleanAttributeDecision,
    ChoiceAttributeDecision,
    ComponentAttributeDecision,
    NumericAttributeDecision
} from "../model/PartialAttribute";
import {match} from "ts-pattern";
import {
    AttributeType, BaseCollectedDecision,
    ChoiceValueDecisionState,
    CollectedBooleanDecision, CollectedChoiceDecision, CollectedComponentDecision,
    CollectedDecision,
    CollectedNumericDecision, ComponentDecisionState,
    Decision,
    DecisionKind,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision
} from "../../contract/Types";
import {none, Option} from "fp-ts/Option";
import {attributeConsequenceMapSe, attributeDecisionMapSe, attributeMetaMapSe} from "../Semigroups";

export function merge(rawData: ConfigurationRawData, partialData: Partial<ConfigurationRawData>): ConfigurationRawData {
    return pipe({
            isSatisfied: partialData.isSatisfied ?? rawData.isSatisfied,
            canContributeToSatisfaction: partialData.canContributeToSatisfaction ?? rawData.canContributeToSatisfaction,
            meta: partialData.meta ? attributeMetaMapSe.concat(rawData.meta, partialData.meta) : rawData.meta,
            decisions: partialData.decisions ? attributeDecisionMapSe.concat(rawData.decisions, partialData.decisions) : rawData.decisions,
            consequences: partialData.consequences ? attributeConsequenceMapSe.concat(rawData.consequences, partialData.consequences) : rawData.consequences,
        },
        removeUndefinedDecisions
    );
}

function removeUndefinedDecisions(rawData: ConfigurationRawData): ConfigurationRawData {
    const clearedDecisions = pipe(
        rawData.decisions,
        RM.filterMap<AttributeDecision, AttributeDecision>(a => {
            if (a.type === AttributeType.Choice) {
                return pipe({
                        ...a,
                        values: pipe(
                            a.values,
                            RA.filter(v => v.decision != null),
                        )
                    } satisfies ChoiceAttributeDecision,
                    O.fromPredicate(a => RA.isNonEmpty(a.values))
                );
            }
            return a.decision != null ? some(a) : none;
        })
    );

    return {
        ...rawData,
        decisions: clearedDecisions
    };
}

export function hasAnyExplicitDecision(configurationRawData: ConfigurationRawData): boolean {
    return [...configurationRawData.decisions.values()].some(d =>
        d.type === AttributeType.Choice ?
            d.values.some((v => v.decision?.kind === DecisionKind.Explicit))
            : d.decision?.kind === DecisionKind.Explicit);
}

export function getCollectedDecisions(configurationRawData: ConfigurationRawData): ReadonlyArray<CollectedDecision> {
    const getDecisions = <Type extends AttributeType, T extends number | boolean | ComponentDecisionState | ChoiceValueDecisionState, TAdditional>(
        attribute: AttributeDecision & { type: Type },
        decision: Decision<T> | null,
        additionalProps: TAdditional): ReadonlyArray<BaseCollectedDecision<T> & {
        attributeType: Type
    } & TAdditional> =>
        decision ? [{
            attributeType: attribute.type,
            attributeId: attribute.id,
            attributeKey: attribute.key,
            kind: decision.kind,
            state: decision.state,
            ...additionalProps
        }] : [];

    return pipe(
        configurationRawData.decisions,
        RM.values(Ord.trivial as OrdT<AttributeDecision>),
        RA.chain(a => match(a)
            .returnType<ReadonlyArray<CollectedDecision>>()
            .with({type: AttributeType.Boolean}, b => getDecisions(b, b.decision, {}) satisfies ReadonlyArray<CollectedBooleanDecision>)
            .with({type: AttributeType.Numeric}, n => getDecisions(n, n.decision, {}) satisfies ReadonlyArray<CollectedNumericDecision>)
            .with({type: AttributeType.Component}, c => getDecisions(c, c.decision, {}) satisfies ReadonlyArray<CollectedComponentDecision>)
            .with({type: AttributeType.Choice}, c => pipe(c.values, RA.chain(v => getDecisions(c, v.decision, {choiceValueId: v.id}) satisfies ReadonlyArray<CollectedChoiceDecision>)))
            .exhaustive())
    );
}

export function getAllExplicitDecisions(configurationRawData: ConfigurationRawData): ReadonlyArray<ExplicitDecision> {
    return pipe(
        configurationRawData.decisions,
        RM.values(Ord.trivial as OrdT<AttributeDecision>),
        RA.chain(getExplicitDecisionsForAttribute)
    );
}

export function getExplicitDecisionsForAttribute(attributeDecision: AttributeDecision): ReadonlyArray<ExplicitDecision> {
    return match(attributeDecision)
        .returnType<ReadonlyArray<ExplicitDecision>>()
        .with({type: AttributeType.Boolean}, flow(getBooleanExplicitDecision, RA.fromOption))
        .with({type: AttributeType.Numeric}, flow(getNumericExplicitDecision, RA.fromOption))
        .with({type: AttributeType.Component}, flow(getComponentExplicitDecision, RA.fromOption))
        .with({type: AttributeType.Choice}, getChoiceExplicitDecision)
        .exhaustive();
}

function getBooleanExplicitDecision(attribute: BooleanAttributeDecision): Option<ExplicitBooleanDecision> {
    if (attribute.decision?.kind === DecisionKind.Explicit) {
        return some({
            type: AttributeType.Boolean,
            attributeId: attribute.id,
            state: attribute.decision.state
        });
    }

    return none;
}

function getNumericExplicitDecision(attribute: NumericAttributeDecision): Option<ExplicitNumericDecision> {
    if (attribute.decision?.kind === DecisionKind.Explicit) {
        return some({
            type: AttributeType.Numeric,
            attributeId: attribute.id,
            state: attribute.decision.state
        });
    }

    return none;
}

function getComponentExplicitDecision(attribute: ComponentAttributeDecision): Option<ExplicitComponentDecision> {
    if (attribute.decision?.kind === DecisionKind.Explicit) {
        return some({
            type: AttributeType.Component,
            attributeId: attribute.id,
            state: attribute.decision.state
        });
    }

    return none;
}

function getChoiceExplicitDecision(attribute: ChoiceAttributeDecision): ReadonlyArray<ExplicitChoiceDecision> {
    return pipe(
        attribute.values,
        RA.filter(v => v.decision?.kind === DecisionKind.Explicit),
        RA.map(v => ({
            type: AttributeType.Choice,
            attributeId: attribute.id,
            choiceValueId: v.id,
            state: v.decision!.state
        } satisfies ExplicitChoiceDecision))
    );
}