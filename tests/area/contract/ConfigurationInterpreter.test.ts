/// <reference types="../../jest-extended" />

import {describe, expect, it} from "vitest";
import * as Interpreter from "../../../src/contract/interpreter/ConfigurationInterpreter";
import {
    Attribute,
    AttributeType,
    Configuration,
    GlobalAttributeId,
    GlobalAttributeIdKey
} from "../../../src";
import {
    getBooleanAttribute,
    getChoiceAttribute,
    getComponentAttribute,
    getNumericAttribute
} from "../../data/AttributeGeneration";
import {globalAttributeIdEq} from "../../../src";

describe("ConfigurationInterpreter", () => {
    const sut: Configuration = {
        isSatisfied: false,
        attributes: new Map<GlobalAttributeIdKey, Attribute>([
            getBooleanAttribute("B1"),
            getNumericAttribute("N1"),
            getComponentAttribute("C1"),
            getChoiceAttribute("CH1"),
            getBooleanAttribute({componentPath: ["C1"], localId: "B1"}),
            getNumericAttribute({componentPath: ["C1"], localId: "N1"}),
            getComponentAttribute({componentPath: ["C1"], localId: "C1.1"}),
            getChoiceAttribute({componentPath: ["C1"], localId: "CH1"}),
            getBooleanAttribute({componentPath: ["C1", "C1.1"], localId: "B1"}),
            getNumericAttribute({componentPath: ["C1", "C1.1"], localId: "N1"}),
            getChoiceAttribute({componentPath: ["C1", "C1.1"], localId: "CH1"}),
            // Shared
            getBooleanAttribute({sharedConfigurationModelId: "S1", localId: "B1"}),
            getNumericAttribute({sharedConfigurationModelId: "S1", localId: "N1"}),
            getComponentAttribute({sharedConfigurationModelId: "S1", localId: "C1"}),
            getChoiceAttribute({sharedConfigurationModelId: "S1", localId: "CH1"}),
            getBooleanAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "B1"}),
            getNumericAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "N1"}),
            getComponentAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "C1.1"}),
            getChoiceAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "CH1"}),
            getBooleanAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "B1"}),
            getNumericAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "N1"}),
            getChoiceAttribute({sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "CH1"}),
        ])
    };

    function expectAttribute(attributes: ReadonlyArray<Attribute>): (attributeId: GlobalAttributeId, attributeType: AttributeType) => void {
        return (attributeId, attributeType) => {
            const attribute = attributes.find(a => globalAttributeIdEq.equals(a.id, attributeId));
            expect(attribute).toBeTruthy();
            expect(attribute!.type).toBe(attributeType);
        };
    }

    it("getAttributesOfRootConfigurationModel", () => {
        const attributes = Interpreter.getAttributesOfRootConfigurationModel(sut.attributes);

        expect(attributes).toHaveLength(4);
        expectAttribute(attributes)({localId: "B1"}, AttributeType.Boolean);
        expectAttribute(attributes)({localId: "N1"}, AttributeType.Numeric);
        expectAttribute(attributes)({localId: "C1"}, AttributeType.Component);
        expectAttribute(attributes)({localId: "CH1"}, AttributeType.Choice);
    });

    it.each([true, false])("getAttributesOfSharedConfigurationModel", (includeSubcomponents) => {
        const attributes = Interpreter.getAttributesOfSharedConfigurationModel(sut.attributes, "S1", includeSubcomponents);

        if (includeSubcomponents) {
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {sharedConfigurationModelId: "S1", localId: "B1"},
                {sharedConfigurationModelId: "S1", localId: "N1"},
                {sharedConfigurationModelId: "S1", localId: "C1"},
                {sharedConfigurationModelId: "S1", localId: "CH1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "C1.1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "CH1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "CH1"}
            ]);
        } else {
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {sharedConfigurationModelId: "S1", localId: "B1"},
                {sharedConfigurationModelId: "S1", localId: "N1"},
                {sharedConfigurationModelId: "S1", localId: "C1"},
                {sharedConfigurationModelId: "S1", localId: "CH1"},
            ]);
        }
    });

    it.each([true, false])("getAttributesOfComponentAttribute", (includeSubcomponents) => {
        const attributes1 = Interpreter.getAttributesOfComponentAttribute(sut.attributes, {localId: "C1"}, includeSubcomponents);
        const attributes2 = Interpreter.getAttributesOfComponentAttribute(sut.attributes, {
            sharedConfigurationModelId: "S1",
            localId: "C1"
        }, includeSubcomponents);

        if (includeSubcomponents) {
            expect(attributes1.map(a => a.id)).toIncludeSameMembers([
                {componentPath: ["C1"], localId: "B1"},
                {componentPath: ["C1"], localId: "N1"},
                {componentPath: ["C1"], localId: "C1.1"},
                {componentPath: ["C1"], localId: "CH1"},
                {componentPath: ["C1", "C1.1"], localId: "B1"},
                {componentPath: ["C1", "C1.1"], localId: "N1"},
                {componentPath: ["C1", "C1.1"], localId: "CH1"}
            ]);
            expect(attributes2.map(a => a.id)).toIncludeSameMembers([
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "C1.1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "CH1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "CH1"},
            ]);
        } else {
            expect(attributes1.map(a => a.id)).toIncludeSameMembers([
                {componentPath: ["C1"], localId: "B1"},
                {componentPath: ["C1"], localId: "N1"},
                {componentPath: ["C1"], localId: "C1.1"},
                {componentPath: ["C1"], localId: "CH1"},
            ]);
            expect(attributes2.map(a => a.id)).toIncludeSameMembers([
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "C1.1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "CH1"},
            ]);
        }
    });

    it("getChoiceValue", () => {
        const choiceValue = Interpreter.getChoiceValue(sut, {localId: "CH1"}, "V1");

        expect(choiceValue).toBeTruthy();
    });

    describe("getAttributes", () => {
        it("getBooleanAttributes", () => {
            const attributes = Interpreter.getBooleanAttributes(sut);

            expect(attributes).toSatisfyAll<Attribute>(a => a.type === AttributeType.Boolean);
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {localId: "B1"},
                {componentPath: ["C1"], localId: "B1"},
                {componentPath: ["C1", "C1.1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "B1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "B1"}
            ]);
        });

        it("getNumericAttributes", () => {
            const attributes = Interpreter.getNumericAttributes(sut);

            expect(attributes).toSatisfyAll<Attribute>(a => a.type === AttributeType.Numeric);
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {localId: "N1"},
                {componentPath: ["C1"], localId: "N1"},
                {componentPath: ["C1", "C1.1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "N1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "N1"}
            ]);
        });

        it("getComponentAttributes", () => {
            const attributes = Interpreter.getComponentAttributes(sut);

            expect(attributes).toSatisfyAll<Attribute>(a => a.type === AttributeType.Component);
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {localId: "C1"},
                {componentPath: ["C1"], localId: "C1.1"},
                {sharedConfigurationModelId: "S1", localId: "C1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "C1.1"},
            ]);
        });

        it("getChoiceAttributes", () => {
            const attributes = Interpreter.getChoiceAttributes(sut);

            expect(attributes).toSatisfyAll<Attribute>(a => a.type === AttributeType.Choice);
            expect(attributes.map(a => a.id)).toIncludeSameMembers([
                {localId: "CH1"},
                {componentPath: ["C1"], localId: "CH1"},
                {componentPath: ["C1", "C1.1"], localId: "CH1"},
                {sharedConfigurationModelId: "S1", localId: "CH1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1"], localId: "CH1"},
                {sharedConfigurationModelId: "S1", componentPath: ["C1", "C1.1"], localId: "CH1"}
            ]);
        });
    });

    describe("getAttribute", () => {
        const getIds = (localId: string): ReadonlyArray<GlobalAttributeId> => [
            {localId: localId},
            {componentPath: ["C1"], localId: localId},
            {
                sharedConfigurationModelId: "S1",
                localId: localId
            },
            {
                sharedConfigurationModelId: "S1",
                componentPath: ["C1"],
                localId: localId
            }
        ];
        const componentIds: ReadonlyArray<GlobalAttributeId> = [
            {localId: "C1"},
            {componentPath: ["C1"], localId: "C1.1"},
            {
                sharedConfigurationModelId: "S1",
                localId: "C1"
            },
            {
                sharedConfigurationModelId: "S1",
                componentPath: ["C1"],
                localId: "C1.1"
            }
        ];

        it.each(getIds("B1"))("getBooleanAttribute", (id) => {
            const attribute = Interpreter.getBooleanAttribute(sut, id);

            expect(attribute).toBeTruthy();
        });

        it.each(getIds("N1"))("getNumericAttribute", (id) => {
            const attribute = Interpreter.getNumericAttribute(sut, id);

            expect(attribute).toBeTruthy();
        });

        it.each(componentIds)("getComponentAttribute", (id) => {
            const attribute = Interpreter.getComponentAttribute(sut, id);

            expect(attribute).toBeTruthy();
        });

        it.each(getIds("CH1"))("getChoiceAttribute", (id) => {
            const attribute = Interpreter.getChoiceAttribute(sut, id);

            expect(attribute).toBeTruthy();
        });
    });
});