import {describe, expect, it} from "vitest";
import {AttributeType, BooleanAttribute, DecisionKind, Selection, ConfigurationInterpreter} from "../../../../src";

const filterAttributesOfComponent = ConfigurationInterpreter.filterAttributesOfComponent;

function stubAttribute(id: string, path: string[]): BooleanAttribute{
    return {
        id: {
            localId: id,
            componentPath: path
        },
        type: AttributeType.Boolean,
        decision: null,
        isSatisfied: false,
        possibleDecisionStates: [true, false],
        selection: Selection.Mandatory,
        canContributeToConfigurationSatisfaction: false
    }
}

describe("Configuration Interpreter", () => {
    describe("Component", () => {
        const attributes = [
            stubAttribute("1", ["a"]),
            stubAttribute("2", ["a", "b"]),
            stubAttribute("3", ["a", "b", "c"]),
            stubAttribute("4", ["a", "b", "c", "d"]),
            stubAttribute("5", ["a", "x"]),
            stubAttribute("6", ["a", "x", "y"]),
            stubAttribute("7", ["b"]),
        ];

        const componentPath = {
            localId: "not-relevant",
            componentPath: ["a", "b"]
        };

        it("filterAttributesOfComponent with includeSubcomponents", async () => {
            const result = filterAttributesOfComponent(attributes, componentPath, true);

            expect(result.length).toBe(3);
        });

        it("filterAttributesOfComponent without includeSubcomponents", async () => {
            const result = filterAttributesOfComponent(attributes, componentPath, false);

            expect(result.length).toBe(1);
        })
    })
})