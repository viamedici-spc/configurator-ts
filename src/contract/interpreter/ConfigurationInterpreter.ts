import {pipe, RA, Str, RM, Ord, OrdT, identity} from "@viamedici-spc/fp-ts-extensions";
import {
    booleanAttributeRefinement,
    choiceAttributeRefinement,
    componentAttributeRefinement,
    numericAttributeRefinement
} from "../refinements/AttributeRefinements";
import {
    Attribute,
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueId,
    ComponentAttribute,
    Configuration,
    ConfigurationModelId,
    GlobalAttributeId, GlobalAttributeIdKey, NumericAttribute
} from "../Types";
import {Refinement, id} from "fp-ts/Refinement";
import GlobalAttributeIdKeyBuilder from "../../crossCutting/GlobalAttributeIdKeyBuilder";

export function getAttributesOfComponentAttribute(attributes: Configuration["attributes"], componentAttributeId: GlobalAttributeId, includeSubcomponents: boolean): ReadonlyArray<Attribute> {
    return pipe(
        attributes,
        RM.toReadonlyArray(Ord.trivial as OrdT<GlobalAttributeIdKey>),
        RA.map(([_, a]) => a),
        RA.filter(a => {
            if (a.id.sharedConfigurationModelId != componentAttributeId.sharedConfigurationModelId) {
                return false;
            }

            const componentAttributeIdPath = [...(componentAttributeId.componentPath ?? []), componentAttributeId.localId];
            const trimmedCandidateId = pipe(
                a.id.componentPath ?? [],
                includeSubcomponents ? RA.takeLeft(componentAttributeIdPath.length) : identity
            );

            return RA.getEq(Str.Eq).equals(componentAttributeIdPath, trimmedCandidateId);
        })
    );
}

export function getAttributesOfSharedConfigurationModel(attributes: Configuration["attributes"], sharedConfigurationModelId: ConfigurationModelId, includeSubcomponents: boolean): ReadonlyArray<Attribute> {
    return pipe(
        attributes,
        RM.toReadonlyArray(Ord.trivial as OrdT<GlobalAttributeIdKey>),
        RA.map(([_, a]) => a),
        RA.filter(a => a.id.sharedConfigurationModelId == sharedConfigurationModelId && (includeSubcomponents || RA.isEmpty(a.id.componentPath ?? [])))
    );
}

export function getAttributesOfRootConfigurationModel(attributes: Configuration["attributes"]): ReadonlyArray<Attribute> {
    return pipe(
        attributes,
        RM.toReadonlyArray(Ord.trivial as OrdT<GlobalAttributeIdKey>),
        RA.map(([_, a]) => a),
        RA.filter(a => a.id.sharedConfigurationModelId == null && RA.isEmpty(a.id.componentPath ?? []))
    );
}

function getAttributes<B extends Attribute>(refinement: Refinement<Attribute, B>): (configuration: Configuration) => ReadonlyArray<B> {
    return (configuration) => pipe(
        configuration.attributes,
        RM.filter(refinement),
        RM.toReadonlyArray(Ord.trivial as OrdT<GlobalAttributeIdKey>),
        RA.map(([_, value]) => value),
    );
}

export function getChoiceAttributes(configuration: Configuration): ReadonlyArray<ChoiceAttribute> {
    return getAttributes(choiceAttributeRefinement)(configuration);
}

export function getComponentAttributes(configuration: Configuration): ReadonlyArray<ComponentAttribute> {
    return getAttributes(componentAttributeRefinement)(configuration);
}

export function getNumericAttributes(configuration: Configuration): ReadonlyArray<NumericAttribute> {
    return getAttributes(numericAttributeRefinement)(configuration);
}

export function getBooleanAttributes(configuration: Configuration): ReadonlyArray<BooleanAttribute> {
    return getAttributes(booleanAttributeRefinement)(configuration);
}

export function getAttribute(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey): Attribute | undefined
export function getAttribute<A extends Attribute>(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey, refinement: Refinement<Attribute, A>): A | undefined
export function getAttribute<A extends Attribute>(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey, refinement?: Refinement<Attribute, A>): Attribute | undefined {
    const key = typeof attributeIdOrKey === "string" ? attributeIdOrKey : GlobalAttributeIdKeyBuilder(attributeIdOrKey);
    const attribute = configuration.attributes.get(key);

    return attribute && (refinement ?? id)(attribute) ? attribute : undefined;
}

export function getChoiceAttribute(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey): ChoiceAttribute | undefined {
    return getAttribute(configuration, attributeIdOrKey, choiceAttributeRefinement);
}

export function getChoiceValue(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey, choiceValueId: ChoiceValueId): ChoiceValue | undefined {
    const attribute = getChoiceAttribute(configuration, attributeIdOrKey);

    return (attribute?.values ?? RM.empty).get(choiceValueId);
}

export function getNumericAttribute(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey): NumericAttribute | undefined {
    return getAttribute(configuration, attributeIdOrKey, numericAttributeRefinement);
}

export function getBooleanAttribute(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey): BooleanAttribute | undefined {
    return getAttribute(configuration, attributeIdOrKey, booleanAttributeRefinement);
}

export function getComponentAttribute(configuration: Configuration, attributeIdOrKey: GlobalAttributeId | GlobalAttributeIdKey): ComponentAttribute | undefined {
    return getAttribute(configuration, attributeIdOrKey, componentAttributeRefinement);
}