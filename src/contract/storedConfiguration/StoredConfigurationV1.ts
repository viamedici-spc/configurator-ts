/**
 * Version 1 of a stored configuration: the explicit decisions of a session, so that a later session can restore them.
 * The shapes are plain readonly types; `src/contract/storedConfiguration/StoredConfigurationCodec.ts` validates them
 * at runtime.
 */

/** Identifies an attribute across the configuration model, its components and shared models. */
export type GlobalAttributeId = Readonly<{
    localId: string;
    componentPath: ReadonlyArray<string> | undefined;
    sharedConfigurationModelId: string | undefined;
}>;

/** A stored decision on a numeric attribute. */
export type NumericDecision = Readonly<{
    type: "Numeric";
    attributeId: GlobalAttributeId;
    state: number;
}>;

/** A stored decision on a boolean attribute. */
export type BooleanDecision = Readonly<{
    type: "Boolean";
    attributeId: GlobalAttributeId;
    state: boolean;
}>;

/** A stored decision on a choice value. */
export type ChoiceDecision = Readonly<{
    type: "Choice";
    attributeId: GlobalAttributeId;
    choiceValueId: string;
    state: "Included" | "Excluded";
}>;

/** A stored decision on a component attribute. */
export type ComponentDecision = Readonly<{
    type: "Component";
    attributeId: GlobalAttributeId;
    state: "Included" | "Excluded";
}>;

/** A stored decision of any attribute type, tagged by `type`. */
export type Decision = NumericDecision | BooleanDecision | ChoiceDecision | ComponentDecision;

/** A stored configuration in schema version 1. */
export type StoredConfigurationV1 = Readonly<{
    schemaVersion: 1;
    explicitDecisions: ReadonlyArray<Decision>;
}>;
