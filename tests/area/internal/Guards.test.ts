// noinspection DuplicatedCode

import {describe, expect, it} from "vitest";
import {shouldSkipMakeDecision} from "../../../src/domain/Guards";
import ConfigurationRawData from "../../../src/domain/model/ConfigurationRawData";
import {RM} from "@viamedici-spc/fp-ts-extensions";
import {getBooleanAttribute, getNumericAttribute} from "../../data/AttributeGeneration";
import {
    AttributeType,
    BooleanAttribute,
    DecisionKind,
    ExplicitBooleanDecision, ExplicitDecision,
    GlobalAttributeIdKey, NumericAttribute
} from "../../../src";
import {HashedAttribute} from "../../../src/domain/model/HashedAttribute";

describe("Guards", () => {
    it.each(getShouldSkipMakeDecisionTestData())
    ("shouldSkipMakeDecision", (attributes, decision, expectation) => {
        const rawData: ConfigurationRawData = {
            isSatisfied: false,
            canContributeToSatisfaction: [],
            meta: RM.empty,
            consequences: RM.empty,
            decisions: new Map(attributes),
        };

        expect(shouldSkipMakeDecision(decision, rawData)).toBe(expectation);
    });
});

function getShouldSkipMakeDecisionTestData(): ReadonlyArray<[ReadonlyArray<[GlobalAttributeIdKey, (BooleanAttribute | NumericAttribute) & HashedAttribute]>, ExplicitDecision, boolean]> {
    return [
        [
            [getBooleanAttribute("Bool1", {decision: {kind: DecisionKind.Explicit, state: true}})],
            {
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool1"},
                state: true
            } satisfies ExplicitBooleanDecision,
            true
        ],
        [
            [getNumericAttribute("Num1")],
            {
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool1"},
                state: true
            } satisfies ExplicitBooleanDecision,
            false
        ],
        [
            [],
            {
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool1"},
                state: true
            } satisfies ExplicitBooleanDecision,
            false
        ],
    ];
}