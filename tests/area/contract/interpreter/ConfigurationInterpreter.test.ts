import {describe, expect, it} from "vitest";
import {AttributeType, BooleanAttribute, Selection, ConfigurationInterpreter} from "../../../../src";

function stubAttribute(shared: string | null, path: string[], id: string): BooleanAttribute {
    return {
        id: {
            localId: id,
            componentPath: path,
            sharedConfigurationModelId: shared
        },
        type: AttributeType.Boolean,
        decision: null,
        isSatisfied: false,
        possibleDecisionStates: [true, false],
        selection: Selection.Mandatory,
        canContributeToConfigurationSatisfaction: false
    };
}

describe("Configuration Interpreter", () => {
    const attributes = [
        // root
        stubAttribute(null, [], "a1"),
        stubAttribute(null, ["a1"], "b1"),
        stubAttribute(null, ["a1"], "b2"),
        stubAttribute(null, ["a1", "b2"], "c1"),
        stubAttribute(null, ["a1", "b2"], "c2"),
        stubAttribute(null, ["a1", "b2"], "c3"),
        stubAttribute(null, ["a1", "b2", "c3"], "d1"),
        stubAttribute(null, ["a1", "b2", "c3", "d1"], "e1"),
        stubAttribute(null, ["a1", "b2", "c3"], "d2"),
        stubAttribute(null, [], "a2"),
        stubAttribute(null, [], "a3"),
        // s1
        stubAttribute("s1", [], "a1"),
        stubAttribute("s1", ["a1"], "b1"),
        stubAttribute("s1", ["a1"], "b2"),
        stubAttribute("s1", ["a1", "b2"], "c1"),
        stubAttribute("s1", ["a1", "b2"], "c2"),
        // s2
        stubAttribute("s2", [], "a1"),
        stubAttribute("s2", ["a1"], "b1"),
        stubAttribute("s2", ["a1"], "b2"),
        stubAttribute("s2", ["a1", "b2"], "c1"),
        stubAttribute("s2", ["a1", "b2"], "c2"),
    ];


    it("filterAttributesOfRoot", () => {
        const result = ConfigurationInterpreter.filterAttributesOfRoot(attributes);

        expect(result.length).toBe(3);
    });

    describe("Component", () => {

        const componentPath = {
            localId: "b2",
            componentPath: ["a1"]
        };

        it("filterAttributesOfComponent with includeSubcomponents", async () => {
            const result = ConfigurationInterpreter.filterAttributesOfComponent(attributes, componentPath, true);

            expect(result.length).toBe(6);
        });

        it("filterAttributesOfComponent without includeSubcomponents", async () => {
            const result = ConfigurationInterpreter.filterAttributesOfComponent(attributes, componentPath, false);

            expect(result.length).toBe(3);
        });
    });

    describe("Shared", () => {

        const sharedConfigurationModelId = "s1";

        it("filterAttributesOfShared with includeSubcomponents", async () => {
            const result = ConfigurationInterpreter.filterAttributesOfShared(attributes, sharedConfigurationModelId, true);

            expect(result.length).toBe(5);
        });

        it("filterAttributesOfShared without includeSubcomponents", async () => {
            const result = ConfigurationInterpreter.filterAttributesOfShared(attributes, sharedConfigurationModelId, false);

            expect(result.length).toBe(1);
        });
    });
});