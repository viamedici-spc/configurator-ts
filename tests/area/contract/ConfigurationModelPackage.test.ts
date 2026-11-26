import {expect, it} from "bun:test";
import type {ConfigurationModelPackage} from "../../../src";

// A side-loaded package is written with the public types alone, string literals included.
const configurationModelPackage = {
    root: "Root",
    configurationModels: [
        {
            configurationModelId: "Root",
            attributes: {booleanAttributes: [{attributeId: "A", isDecisionRequired: false}]},
            constraints: [
                {
                    type: "TextualConstraintCollection",
                    constraintId: "Rules",
                    operator: "And",
                    textualConstraints: ["A = true"],
                },
            ],
        },
    ],
} satisfies ConfigurationModelPackage;

it("a configuration model package type-checks with a textual constraint collection", () => {
    expect(configurationModelPackage.configurationModels[0]?.constraints[0]?.operator).toBe("And");
});