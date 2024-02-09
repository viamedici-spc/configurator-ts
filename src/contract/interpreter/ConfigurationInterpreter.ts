import {flow, O, pipe, RA, Str, Eq, Predicate, P} from "@viamedici-spc/fp-ts-extensions";
import * as AttributeInterpreter from "./AttributeInterpreter";
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
    ChoiceValueDecisionState,
    ChoiceValueId,
    ComponentAttribute,
    ComponentDecisionState,
    Configuration,
    ConfigurationModelId,
    Decision,
    DecisionKind,
    eqGlobalAttributeId,
    GlobalAttributeId, LocalAttributeId,
    NumericAttribute
} from "../Types";

const nullableStringEq = Eq.eqNullable(Str.Eq);
const readOnlyStringArrayEq = RA.getEq(Str.Eq);

function isChildOf(parentId: {
    sharedConfigurationModelId: ConfigurationModelId | null,
    componentPath: ReadonlyArray<LocalAttributeId>
}, includeSubcomponents: boolean): Predicate<GlobalAttributeId> {
    const hasChildSameSharedModelId = (potentialChild: GlobalAttributeId) => nullableStringEq.equals(parentId.sharedConfigurationModelId, potentialChild.sharedConfigurationModelId);

    const parentIdComponentPathLength = parentId.componentPath.length;
    const doesChildComponentPathStartsWith = (potentialChild: GlobalAttributeId) =>
        readOnlyStringArrayEq.equals(pipe(potentialChild.componentPath ?? [], RA.takeLeft(parentIdComponentPathLength)), parentId.componentPath);
    const areParentAndChildComponentPathEqual = (potentialChild: GlobalAttributeId) => readOnlyStringArrayEq.equals(potentialChild.componentPath ?? [], parentId.componentPath);

    return pipe(
        hasChildSameSharedModelId,
        P.and(includeSubcomponents ? doesChildComponentPathStartsWith : areParentAndChildComponentPathEqual)
    );
}

export function filterAttributesOfComponent(attributes: ReadonlyArray<Attribute>, componentAttributeId: GlobalAttributeId, includeSubcomponents: boolean): ReadonlyArray<Attribute> {
    const isChildOfPredicate = pipe(
        isChildOf({
            sharedConfigurationModelId: componentAttributeId.sharedConfigurationModelId ?? null,
            componentPath: pipe(componentAttributeId.componentPath ?? [], RA.append(componentAttributeId.localId))
        }, includeSubcomponents),
        P.contramap((a: Attribute) => a.id)
    );

    return pipe(
        attributes,
        RA.filter(isChildOfPredicate)
    );
}

// noinspection JSUnusedGlobalSymbols
export function filterAttributesOfShared(attributes: ReadonlyArray<Attribute>, configurationModelId: ConfigurationModelId, includeSubcomponents: boolean): ReadonlyArray<Attribute> {
    return []; // TODO: feature/components
}

export function filterAttributesOfRoot(attributes: ReadonlyArray<Attribute>): ReadonlyArray<Attribute> {
    return pipe(
        attributes,
        RA.filter(a => {
            const notNested = (a.id.componentPath ?? []).length === 0;
            const notShared = a.id.sharedConfigurationModelId == null;

            return notNested && notShared;
        })
    );
}

export function getChoiceDecisions(c: Configuration, kind: DecisionKind): ReadonlyArray<Decision<ChoiceValueDecisionState>> {
    return pipe(
        getChoiceAttributes(c),
        RA.map((v: ChoiceAttribute) => AttributeInterpreter.getChoiceDecisions(v, kind)),
        RA.flatten,
        RA.filterMap(d => O.fromNullable(d))
    );
}

// noinspection JSUnusedGlobalSymbols
export function getNumericDecisions(c: Configuration, kind: DecisionKind): ReadonlyArray<Decision<number>> {
    return pipe(
        getNumericAttributes(c),
        RA.filter(a => a.decision?.kind === kind),
        RA.map((v: NumericAttribute) => AttributeInterpreter.getNumericDecision(v)),
        RA.filterMap(d => O.fromNullable(d))
    );
}

// noinspection JSUnusedGlobalSymbols
export function getBooleanDecisions(c: Configuration, kind: DecisionKind): ReadonlyArray<Decision<boolean>> {
    return pipe(
        getBooleanAttributes(c),
        RA.filter(a => a.decision?.kind === kind),
        RA.map((v: BooleanAttribute) => AttributeInterpreter.getBooleanDecision(v)),
        RA.filterMap(d => O.fromNullable(d))
    );
}

// noinspection JSUnusedGlobalSymbols
export function getComponentDecisions(c: Configuration, kind: DecisionKind): ReadonlyArray<Decision<ComponentDecisionState>> {
    return pipe(
        getComponentAttributes(c),
        RA.filter(a => a.decision?.kind === kind),
        RA.map((v: ComponentAttribute) => AttributeInterpreter.getComponentDecision(v)),
        RA.filterMap(d => O.fromNullable(d))
    );
}

// noinspection JSUnusedGlobalSymbols
export function getChoiceAttributes(configuration: Configuration): ReadonlyArray<ChoiceAttribute> {
    return pipe(
        configuration.attributes,
        RA.filter(choiceAttributeRefinement)
    );
}

// noinspection JSUnusedGlobalSymbols
export function getComponentAttributes(configuration: Configuration): ReadonlyArray<ComponentAttribute> {
    return pipe(
        configuration.attributes,
        RA.filter(componentAttributeRefinement)
    );
}

// noinspection JSUnusedGlobalSymbols
export function getNumericAttributes(configuration: Configuration): ReadonlyArray<NumericAttribute> {
    return pipe(
        configuration.attributes,
        RA.filter(numericAttributeRefinement)
    );
}

// noinspection JSUnusedGlobalSymbols
export function getBooleanAttributes(configuration: Configuration): ReadonlyArray<BooleanAttribute> {
    return pipe(
        configuration.attributes,
        RA.filter(booleanAttributeRefinement)
    );
}


// noinspection JSUnusedGlobalSymbols
export function getAttribute(configuration: Configuration, attributeId: GlobalAttributeId): Attribute | undefined {
    return pipe(
        getAttributeInternal(configuration, attributeId),
        O.toUndefined
    );
}

// noinspection JSUnusedGlobalSymbols
export function getChoiceAttribute(configuration: Configuration, attributeId: GlobalAttributeId): ChoiceAttribute | undefined {
    return pipe(
        getChoiceAttributeInternal(configuration, attributeId),
        O.toUndefined
    );
}

// noinspection JSUnusedGlobalSymbols
export function getChoiceValue(configuration: Configuration, attributeId: GlobalAttributeId, choiceValueId: ChoiceValueId): ChoiceValue | undefined {
    return pipe(
        getChoiceAttributeInternal(configuration, attributeId),
        O.map(ca => ca.values),
        O.chain(flow(RA.findFirst(choiceValue => choiceValue.id === choiceValueId))),
        O.toUndefined
    );
}

// noinspection JSUnusedGlobalSymbols
export function getNumericAttribute(configuration: Configuration, attributeId: GlobalAttributeId): NumericAttribute | undefined {
    return pipe(
        getAttributeInternal(configuration, attributeId),
        O.filter(numericAttributeRefinement),
        O.toUndefined
    );
}

// noinspection JSUnusedGlobalSymbols
export function getBooleanAttribute(configuration: Configuration, attributeId: GlobalAttributeId): BooleanAttribute | undefined {
    return pipe(
        getAttributeInternal(configuration, attributeId),
        O.filter(booleanAttributeRefinement),
        O.toUndefined
    );
}

// noinspection JSUnusedGlobalSymbols
export function getComponentAttribute(configuration: Configuration, attributeId: GlobalAttributeId): ComponentAttribute | undefined {
    return pipe(
        getAttributeInternal(configuration, attributeId),
        O.filter(componentAttributeRefinement),
        O.toUndefined
    );
}

function getAttributeInternal(configuration: Configuration, attributeId: GlobalAttributeId): O.Option<Attribute> {
    return pipe(
        configuration.attributes,
        RA.findFirst(a => eqGlobalAttributeId.equals(a.id, attributeId))
    );
}

function getChoiceAttributeInternal(configuration: Configuration, attributeId: GlobalAttributeId): O.Option<ChoiceAttribute> {
    return pipe(
        getAttributeInternal(configuration, attributeId),
        O.filter(choiceAttributeRefinement)
    );
}