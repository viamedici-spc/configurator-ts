import {identity, O, pipe, RA, RM, some, Str} from "@viamedici-spc/fp-ts-extensions";
import * as ML from "monocle-ts/Lens";
import {
    Attribute,
    AttributeType, BooleanAttribute, ChoiceAttribute, ChoiceValue, ChoiceValueId, ComponentAttribute,
    Configuration,
    GlobalAttributeIdKey,
    NumericAttribute
} from "../../contract/Types";
import {HashedAttribute, isHashedAttribute} from "../model/HashedAttribute";
import {hashAttribute} from "../../crossCutting/AttributeHashing";
import {reduceUpdateFunctions} from "../../crossCutting/UpdateFunctionHelper";
import {none, Option} from "fp-ts/Option";
import HashedConfiguration from "../model/HashedConfiguration";
import {
    ChoiceValueConsequence,
    ChoiceValueDecision, PartialAttribute
} from "../model/PartialAttribute";
import {globalAttributeIdKeyEq} from "../../contract/Eqs";
import ConfigurationRawData from "../model/ConfigurationRawData";
import {match} from "ts-pattern";
import * as Se from "fp-ts/Semigroup";
import {Endomorphism} from "fp-ts/Endomorphism";
import Logger from "../../contract/Logger";

const attributesLens = pipe(
    ML.id<Configuration>(),
    ML.prop("attributes"),
);

export function toHashedConfiguration(configuration: Configuration): HashedConfiguration {
    const attributes = pipe(
        configuration.attributes,
        RM.map(a => isHashedAttribute(a) ? a : hashAttribute(a))
    );

    return {
        isSatisfied: configuration.isSatisfied,
        attributes: attributes,
    };
}

export function fromRawData(rawData: ConfigurationRawData): HashedConfiguration {
    return pipe(
        [...rawData.consequences.values()],
        RA.map(a => match(a)
            .returnType<Attribute>()
            .with({type: AttributeType.Boolean}, b => ({
                ...b,
                canContributeToConfigurationSatisfaction: false,
                decision: null,
                nonOptimisticDecision: null,
            } satisfies BooleanAttribute))
            .with({type: AttributeType.Numeric}, n => ({
                ...n,
                canContributeToConfigurationSatisfaction: false,
                decision: null,
                nonOptimisticDecision: null,
            } satisfies NumericAttribute))
            .with({type: AttributeType.Component}, c => ({
                ...c,
                canContributeToConfigurationSatisfaction: false,
                decision: null,
                nonOptimisticDecision: null,
            } satisfies ComponentAttribute))
            .with({type: AttributeType.Choice}, c => ({
                ...c,
                canContributeToConfigurationSatisfaction: false,
                values: pipe(
                    c.values,
                    RA.map(v => ({...v, decision: null, nonOptimisticDecision: null} satisfies ChoiceValue)),
                    RA.map(v => [v.id, v] as [ChoiceValueId, ChoiceValue]),
                    RM.fromFoldable(Str.Eq, Se.first<ChoiceValue>(), RA.Foldable),
                )
            } satisfies ChoiceAttribute))
            .exhaustive()),
        RA.map(a => [a.key, a] as [GlobalAttributeIdKey, Attribute]),
        RM.fromFoldable(globalAttributeIdKeyEq, Se.first<Attribute>(), RA.Foldable),
        attributes => ({
            attributes: attributes,
            isSatisfied: rawData.isSatisfied
        } satisfies Configuration),
        integrateRawData(rawData),
        toHashedConfiguration
    );
}

export function integrateRawData(partial: Partial<ConfigurationRawData>): Endomorphism<Configuration> {
    const updateCanContribute = (canContributeToSatisfaction: ReadonlyArray<GlobalAttributeIdKey>) =>
        updateAttributes(mapAttributesOptional(a => {
            const canContribute = pipe(canContributeToSatisfaction, RA.elem(globalAttributeIdKeyEq)(a.key));

            if (canContribute != a.canContributeToConfigurationSatisfaction) {
                return some({
                    ...a,
                    canContributeToConfigurationSatisfaction: canContribute
                });
            }

            return none;
        }));

    return configuration => {
        return pipe(
            {
                ...configuration,
                isSatisfied: partial.isSatisfied ?? configuration.isSatisfied
            },
            applyPartialAttributes([
                ...(partial.meta ?? RM.empty).values(),
                ...(partial.decisions ?? RM.empty).values(),
                ...(partial.consequences ?? RM.empty).values(),
            ]),
            partial.canContributeToSatisfaction ? updateCanContribute(partial.canContributeToSatisfaction) : identity
        );
    };
}

export function updateAttributes(updates: RA.SingleOrArray<(attributes: Configuration["attributes"]) => Configuration["attributes"]>): Endomorphism<Configuration> {
    return pipe(
        attributesLens,
        ML.modify(pipe(
            updates, RA.fromSingleOrArray, reduceUpdateFunctions
        )),
    );
}

export function updateAttribute(attributeId: GlobalAttributeIdKey, updateFn: (attribute: Attribute) => Attribute): Endomorphism<Configuration["attributes"]> {
    return attributes => pipe(
        attributes,
        RM.modifyAt(globalAttributeIdKeyEq)(attributeId, a => {
            const updatedAttribute = updateFn(a);
            return updatedAttribute != a ? removeAttributeHash(updatedAttribute) : a;
        }),
        O.doIfNone(() => () => {
            Logger.warn("Didn't found attribute while tying to update it. GlobalAttributeIdKey", attributeId);
        }),
        O.getOrElse(() => attributes)
    );
}

export function mapAttributesOptional(updateFn: (attribute: Attribute) => Option<Attribute>): Endomorphism<Configuration["attributes"]> {
    return attributes => pipe(
        attributes,
        RM.map(a => pipe(
            updateFn(a),
            O.filter(updatedAttribute => updatedAttribute != a),
            O.map(removeAttributeHash),
            O.getOrElse(() => a)
        ))
    );
}

export function applyPartialAttributes(partials: RA.SingleOrArray<PartialAttribute>): Endomorphism<Configuration> {
    return pipe(
        partials,
        RA.fromSingleOrArray,
        RA.map(applyPartialAttribute),
        updateAttributes
    );
}

export function applyPartialAttribute(partial: PartialAttribute): Endomorphism<Configuration["attributes"]> {
    return updateAttribute(partial.key, a => {
        if ('type' in partial) {
            if (a.type === AttributeType.Choice && partial.type === AttributeType.Choice) {
                return {
                    ...a,
                    ...partial,
                    values: pipe(
                        partial.values,
                        RA.reduce<ChoiceValueDecision | ChoiceValueConsequence, ChoiceAttribute["values"]>(a.values, (xs, x) => pipe(
                            xs,
                            RM.modifyAt(Str.Eq)(x.id, c => ({
                                ...c,
                                ...x
                            })),
                            O.doIfNone(() => () => {
                                Logger.warn("Didn't found choice value while tying to update it. GlobalAttributeIdKey:", partial.key, "Choice Value id:", x.id);
                            }),
                            O.getOrElse(() => xs)
                        ))
                    )
                } satisfies ChoiceAttribute;
            }
            if (a.type === AttributeType.Boolean && partial.type === AttributeType.Boolean) {
                return {
                    ...a,
                    ...partial,
                } satisfies BooleanAttribute;
            }
            if (a.type === AttributeType.Numeric && partial.type === AttributeType.Numeric) {
                return {
                    ...a,
                    ...partial,
                } satisfies NumericAttribute;
            }
            if (a.type === AttributeType.Component && partial.type === AttributeType.Component) {
                return {
                    ...a,
                    ...partial,
                } satisfies ComponentAttribute;
            }

            Logger.warn("Types of attribute and partial attribute mismatch. AttributeType:", a.type, "PartialAttributeType", partial.type);
            return a;
        } else {
            return {
                ...a,
                ...partial,
            };
        }
    });
}

function removeAttributeHash(attribute: HashedAttribute | Attribute): Attribute {
    const copiedAttribute = {
        ...attribute,
    } satisfies Attribute;
    delete copiedAttribute["hash"];
    return copiedAttribute;
}