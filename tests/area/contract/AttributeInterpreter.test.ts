/// <reference types="../../jest-extended" />

import {describe, expect, it} from "vitest";
import * as Interpreter from "../../../src/contract/interpreter/AttributeInterpreter";
import {
    getBooleanAttribute,
    getChoiceAttribute,
    getComponentAttribute,
    getNumericAttribute
} from "../../data/AttributeGeneration";
import {
    Attribute,
    ChoiceValue,
    ChoiceValueDecisionState,
    ChoiceValueId,
    DecisionKind,
    GlobalAttributeIdKey,
    Inclusion,
    Selection
} from "../../../src";

describe("AttributeInterpreter", () => {
    const generateTestData = <A extends Attribute, P, T extends ReadonlyArray<unknown>>(generateAttributeFn: (localId: string, partial: P) => [GlobalAttributeIdKey, A], generatePartial: (...args: T) => P) =>
        (...args: T) => generateAttributeFn("A1", generatePartial(...args))[1];

    const genChLow = generateTestData(getChoiceAttribute, (lowerBound: number) => ({
        cardinality: {
            upperBound: Number.MAX_SAFE_INTEGER,
            lowerBound: lowerBound
        }
    }));
    const genChUp = generateTestData(getChoiceAttribute, (upperBound: number) => ({
        cardinality: {
            upperBound: upperBound,
            lowerBound: 0
        }
    }));
    const genNum = generateTestData(getNumericAttribute, (selection: Selection) => ({
        selection: selection
    }));
    const genBool = generateTestData(getBooleanAttribute, (selection: Selection) => ({
        selection: selection
    }));
    const genCom = generateTestData(getComponentAttribute, (selection: Selection, inclusion: Inclusion) => ({
        selection: selection,
        inclusion: inclusion
    }));

    it.each([
        [genChLow(0), false],
        [genChLow(1), true],
        [genBool(Selection.Mandatory), true],
        [genBool(Selection.Optional), false],
        [genNum(Selection.Mandatory), true],
        [genNum(Selection.Optional), false],
        [genCom(Selection.Mandatory, Inclusion.Optional), true],
        [genCom(Selection.Optional, Inclusion.Optional), false],
        [genCom(Selection.Mandatory, Inclusion.Always), false],
        [genCom(Selection.Optional, Inclusion.Always), false],
    ])("isMandatory", (attribute, expectIsMandatory) => {
        expect(Interpreter.isMandatory(attribute)).toBe(expectIsMandatory);
    });

    it.each([
        [genChUp(1), false],
        [genChUp(2), true],
        [genChUp(Number.MAX_SAFE_INTEGER), true],
    ])("isChoiceAttributeMultiSelect", (attribute, expectIsMultiSelect) => {
        expect(Interpreter.isChoiceAttributeMultiSelect(attribute)).toBe(expectIsMultiSelect);
    });

    describe("allowed/blocked choice values", () => {
        const [_, attribute] = getChoiceAttribute("A1", {
            values: new Map<ChoiceValueId, ChoiceValue>([
                ["V1", {
                    id: "V1",
                    decision: null,
                    possibleDecisionStates: [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]
                }],
                ["V2", {id: "V2", decision: null, possibleDecisionStates: [ChoiceValueDecisionState.Included]}],
                ["V3", {id: "V3", decision: null, possibleDecisionStates: [ChoiceValueDecisionState.Excluded]}],
                ["V4", {id: "V4", decision: null, possibleDecisionStates: []}],
            ])
        });

        it("getAllowedChoiceValues", () => {
            expect(Interpreter.getAllowedChoiceValues(attribute).map(v => v.id)).toIncludeSameMembers([
                "V1",
                "V2",
            ]);
        });
        it("getBlockedChoiceValues", () => {
            expect(Interpreter.getBlockedChoiceValues(attribute).map(v => v.id)).toIncludeSameMembers([
                "V3",
                "V4",
            ]);
        });
    });

    it("getIncludedChoiceValues", () => {
        const [_, attribute] = getChoiceAttribute("A1", {
            values: new Map<ChoiceValueId, ChoiceValue>([
                ["V1", {
                    id: "V1",
                    decision: {
                        kind: DecisionKind.Implicit,
                        state: ChoiceValueDecisionState.Included
                    },
                    possibleDecisionStates: []
                }],
                ["V2", {
                    id: "V2",
                    decision: {
                        kind: DecisionKind.Explicit,
                        state: ChoiceValueDecisionState.Included
                    },
                    possibleDecisionStates: []
                }],
                ["V3", {
                    id: "V3",
                    decision: null,
                    possibleDecisionStates: []
                }],
            ])
        });

        expect(Interpreter.getIncludedChoiceValues(attribute).map(v => v.id)).toIncludeSameMembers([
            "V1",
            "V2",
        ]);
    });
});