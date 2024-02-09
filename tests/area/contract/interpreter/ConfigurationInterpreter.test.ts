import {describe, expect, it} from "vitest";
import {AttributeType, BooleanAttribute, DecisionKind, Selection, ConfigurationInterpreter} from "../../../../src";

const filterAttributesOfComponent = ConfigurationInterpreter.filterAttributesOfComponent;

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
    ];

    describe("Component", () => {

        const componentPath = {
            localId: "b2",
            componentPath: ["a1"]
        };

        it("filterAttributesOfComponent with includeSubcomponents", async () => {
            const result = filterAttributesOfComponent(attributes, componentPath, true);

            expect(result.length).toBe(6);
        });

        it("filterAttributesOfComponent without includeSubcomponents", async () => {
            const result = filterAttributesOfComponent(attributes, componentPath, false);

            expect(result.length).toBe(3);
        });
    });

    it("filterAttributesOfRoot", () => {
        const result = ConfigurationInterpreter.filterAttributesOfRoot(attributes);

        expect(result.length).toBe(3);
    });
});