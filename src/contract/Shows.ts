import * as Show from "fp-ts/Show";
import {
    Attribute,
    AttributeType,
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueDecisionState,
    ComponentAttribute,
    ComponentDecisionState,
    Decision,
    GlobalAttributeId,
    GlobalAttributeIdKey,
    LocalAttributeId,
    NumericAttribute,
    SourceAttributeId
} from "./Types";
import {Bool, Num, pipe, RA, RM, Str} from "@viamedici-spc/fp-ts-extensions";
import {match} from "ts-pattern";

function getCachedShow<T extends object>(show: Show.Show<T>): Show.Show<T> {
    const cache = new WeakMap<T, string>();

    return {
        show: (a) => {
            const cacheValue = cache.get(a);
            if (cacheValue != null) {
                return cacheValue;
            }

            const str = show.show(a);
            cache.set(a, str);
            return str;
        }
    };
}

const arrayOfStringShow = RA.getShow(Str.Show);

const getNullableShow = <T>(show: Show.Show<T>): Show.Show<T | null | undefined> => ({
    show: a => a == null ? "<null>" : show.show(a)
});

const componentPathShow: Show.Show<ReadonlyArray<LocalAttributeId> | undefined> = ({
    show: a => a != null && RA.isNonEmpty(a) ? arrayOfStringShow.show(a) : "<undefined>"
});

const globalAttributeIdShow = getCachedShow(Show.struct<GlobalAttributeId>({
    localId: Str.Show,
    componentPath: componentPathShow,
    sharedConfigurationModelId: getNullableShow(Str.Show)
}));

const globalAttributeIdKeyShow: Show.Show<GlobalAttributeIdKey> = Str.Show;

const sourceAttributeIdShow: Show.Show<SourceAttributeId | undefined> = pipe(
    Show.struct<SourceAttributeId>({
        localId: Str.Show,
        configurationModel: Str.Show
    }),
    getCachedShow,
    getNullableShow,
);

const getDecisionEq = <T extends number | boolean | ComponentDecisionState | ChoiceValueDecisionState>(show: Show.Show<T>): Show.Show<Decision<T> | null> =>
    pipe(
        Show.struct<Decision<T>>({
            kind: Str.Show,
            state: show
        }),
        getCachedShow,
        getNullableShow
    );

const baseAttribute = ({
    id: globalAttributeIdShow,
    key: globalAttributeIdKeyShow,
    type: Str.Show,
    sourceId: sourceAttributeIdShow,
    isSatisfied: Bool.Show,
    canContributeToConfigurationSatisfaction: Bool.Show,
});

const booleanAttributeShow: Show.Show<BooleanAttribute> = Show.struct<BooleanAttribute>({
    ...baseAttribute,
    decision: getDecisionEq(Bool.Show),
    nonOptimisticDecision: getDecisionEq(Bool.Show),
    possibleDecisionStates: getCachedShow(RA.getShow(Bool.Show)),
    selection: Str.Show
});
const numericAttributeShow: Show.Show<NumericAttribute> = Show.struct<NumericAttribute>({
    ...baseAttribute,
    decision: getDecisionEq(Num.Show),
    nonOptimisticDecision: getDecisionEq(Num.Show),
    selection: Str.Show,
    range: getCachedShow(Show.struct({
        max: Num.Show,
        min: Num.Show,
    })),
    decimalPlaces: Num.Show
});
const componentAttributeShow: Show.Show<ComponentAttribute> = Show.struct<ComponentAttribute>({
    ...baseAttribute,
    decision: getDecisionEq(Str.Show as Show.Show<ComponentDecisionState>),
    nonOptimisticDecision: getDecisionEq(Str.Show as Show.Show<ComponentDecisionState>),
    possibleDecisionStates: getCachedShow(RA.getShow(Str.Show)),
    selection: getNullableShow(Str.Show),
    inclusion: Str.Show
});

const choiceAttributeShow: Show.Show<ChoiceAttribute> = Show.struct<ChoiceAttribute>({
    ...baseAttribute,
    cardinality: getCachedShow(Show.struct({
        upperBound: Num.Show,
        lowerBound: Num.Show,
    })),
    values: RM.getShow(Str.Show, Show.struct<ChoiceValue>({
        id: Str.Show,
        decision: getDecisionEq(Str.Show as Show.Show<ChoiceValueDecisionState>),
        nonOptimisticDecision: getDecisionEq(Str.Show as Show.Show<ChoiceValueDecisionState>),
        possibleDecisionStates: getCachedShow(RA.getShow(Str.Show)),
    }))
});

export const attributeShow: Show.Show<Attribute> = ({
    show: a => match(a)
        .with({type: AttributeType.Choice}, choiceAttributeShow.show)
        .with({type: AttributeType.Component}, componentAttributeShow.show)
        .with({type: AttributeType.Boolean}, booleanAttributeShow.show)
        .with({type: AttributeType.Numeric}, numericAttributeShow.show)
        .exhaustive()
});