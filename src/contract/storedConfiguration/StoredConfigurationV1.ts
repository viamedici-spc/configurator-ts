/**
 * Version 1 of a stored configuration: the explicit decisions of a session, so that a later session can restore them.
 * The shapes are plain readonly types; `src/contract/storedConfiguration/StoredConfigurationCodec.ts` validates them
 * at runtime.
 */

/** Identifies an attribute across the configuration model, its components and shared models. */
export type GlobalAttributeId = {
    /** The attribute's ID within its configuration model. */
    readonly localId: string;
    /** The components that lead to the attribute's configuration model; `undefined` for the root model. */
    readonly componentPath: ReadonlyArray<string> | undefined;
    /** The shared configuration model the attribute comes from; `undefined` if it is not from a shared model. */
    readonly sharedConfigurationModelId: string | undefined;
};

/** A stored decision on a numeric attribute. */
export type NumericDecision = {
    readonly type: "Numeric";
    /** The decided attribute. */
    readonly attributeId: GlobalAttributeId;
    /** The decided value. */
    readonly state: number;
};

/** A stored decision on a boolean attribute. */
export type BooleanDecision = {
    readonly type: "Boolean";
    /** The decided attribute. */
    readonly attributeId: GlobalAttributeId;
    /** The decided value. */
    readonly state: boolean;
};

/** A stored decision on a choice value. */
export type ChoiceDecision = {
    readonly type: "Choice";
    /** The decided attribute. */
    readonly attributeId: GlobalAttributeId;
    /** The decided choice value of the attribute. */
    readonly choiceValueId: string;
    /** Whether the decision includes or excludes it. */
    readonly state: "Included" | "Excluded";
};

/** A stored decision on a component attribute. */
export type ComponentDecision = {
    readonly type: "Component";
    /** The decided attribute. */
    readonly attributeId: GlobalAttributeId;
    /** Whether the decision includes or excludes it. */
    readonly state: "Included" | "Excluded";
};

/** A stored decision of any attribute type, tagged by `type`. */
export type Decision = NumericDecision | BooleanDecision | ChoiceDecision | ComponentDecision;

/** A stored configuration in schema version 1. */
export type StoredConfigurationV1 = {
    /** The format of the stored configuration. */
    readonly schemaVersion: 1;
    /** The explicit decisions of the session that stored it. */
    readonly explicitDecisions: ReadonlyArray<Decision>;
};