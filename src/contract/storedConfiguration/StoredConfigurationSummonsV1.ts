import {summonFor} from "@morphic-ts/batteries/lib/summoner-ESBAST";

const {summon} = summonFor<{}>({});

export const GlobalAttributeId_ = summon(F => F.interface({
    localId: F.string(),
    componentPath: F.optional(F.array(F.string())),
    sharedConfigurationModelId: F.optional(F.string()),
}, "GlobalAttributeId"));


export const NumericDecision_ = summon(F => F.interface({
    type: F.stringLiteral("Numeric"),
    attributeId: GlobalAttributeId_(F),
    state: F.number()
}, "NumericDecision"));

export const BooleanDecision_ = summon(F => F.interface({
    type: F.stringLiteral("Boolean"),
    attributeId: GlobalAttributeId_(F),
    state: F.boolean()
}, "NumericDecision"));

export const ChoiceDecision_ = summon(F => F.interface({
    type: F.stringLiteral("Choice"),
    attributeId: GlobalAttributeId_(F),
    choiceValueId: F.string(),
    state: F.keysOf({Included: null, Excluded: null})
}, "ChoiceDecision"));

export const ComponentDecision_ = summon(F => F.interface({
    type: F.stringLiteral("Component"),
    attributeId: GlobalAttributeId_(F),
    state: F.keysOf({Included: null, Excluded: null})
}, "ComponentDecision"));

export const Decision_ = summon(F => F.taggedUnion("type", {
    Numeric: NumericDecision_(F),
    Boolean: BooleanDecision_(F),
    Choice: ChoiceDecision_(F),
    Component: ComponentDecision_(F),
}, "Decision"));

export const StoredConfigurationV1_ = summon(F => F.interface({
    schemaVersion: F.numberLiteral(1),
    explicitDecisions: F.array(Decision_(F))
}, "StoredConfigurationV1"));