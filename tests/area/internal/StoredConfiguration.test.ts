import {describe, expect, it} from "bun:test";
import type {StoredConfiguration, StoredConfigurationInvalid} from "../../../src";
import {ConfiguratorErrorType} from "../../../src";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";
import {loadConfiguration} from "../../../src/domain/logic/ConfigurationStoring";

const malformedConfigurations: any[] = [
    null,
    undefined,
    {},
    {
        // Schema not supported
        schemaVersion: 2,
        explicitDecisions: [],
    },
    {
        schemaVersion: 1,
        // Property name mismatch
        decisions: [],
    },
    {
        schemaVersion: 1,
        explicitDecisions: [
            {
                // Unknown type
                type: "BetterChoice",
                attributeId: {
                    localId: "Ch",
                },
                choiceValueId: "Val",
                state: "Included",
            },
        ],
    },
    {
        schemaVersion: 1,
        explicitDecisions: [
            {
                type: "Choice",
                attributeId: {
                    localId: "Ch",
                },
                choiceValueId: "Val",
                // Unknown state
                state: "Undecided",
            },
        ],
    },
    {
        schemaVersion: 1,
        explicitDecisions: [
            {
                type: "Choice",
                attributeId: {
                    localId: "Ch",
                    componentPath: [],
                    // Null is not allowed
                    sharedConfigurationModelId: null,
                },
                choiceValueId: "Val",
                state: "Included",
            },
        ],
    },
];

const wellFormedConfigurations: StoredConfiguration[] = [
    {
        schemaVersion: 1,
        explicitDecisions: [],
    },
    {
        schemaVersion: 1,
        explicitDecisions: [
            {
                type: "Choice",
                attributeId: {
                    localId: "Ch",
                    componentPath: [],
                    sharedConfigurationModelId: undefined,
                },
                choiceValueId: "Val",
                state: "Included",
            },
        ],
    },
    {
        // Every decision type and every attribute-id field, so the codecs and the public types stay in step.
        schemaVersion: 1,
        explicitDecisions: [
            {
                type: "Numeric",
                attributeId: {localId: "N", componentPath: ["C1", "C2"], sharedConfigurationModelId: "Shared"},
                state: 4.5,
            },
            {
                type: "Boolean",
                attributeId: {localId: "B", componentPath: undefined, sharedConfigurationModelId: undefined},
                state: false,
            },
            {
                type: "Choice",
                attributeId: {localId: "Ch", componentPath: ["C1"], sharedConfigurationModelId: undefined},
                choiceValueId: "V",
                state: "Excluded",
            },
            {
                type: "Component",
                attributeId: {localId: "Co", componentPath: undefined, sharedConfigurationModelId: "Shared"},
                state: "Included",
            },
        ],
    },
];

// One valid decision per type; each malformed decision below differs from one of them in exactly one field.
const validDecisions = {
    Numeric: {type: "Numeric", attributeId: {localId: "N"}, state: 1},
    Boolean: {type: "Boolean", attributeId: {localId: "B"}, state: true},
    Choice: {type: "Choice", attributeId: {localId: "C"}, choiceValueId: "V", state: "Included"},
    Component: {type: "Component", attributeId: {localId: "K"}, state: "Included"},
} as const;

function without(decision: object, field: string): object {
    return Object.fromEntries(Object.entries(decision).filter(([key]) => key !== field));
}

const malformedDecisions: ReadonlyArray<readonly [string, object]> = [
    ...Object.entries(validDecisions).flatMap(([type, decision]) => [
        [`${type} without attributeId`, without(decision, "attributeId")] as const,
        [`${type} without state`, without(decision, "state")] as const,
        [`${type} without attributeId.localId`, {...decision, attributeId: {}}] as const,
    ]),
    ["Choice without choiceValueId", without(validDecisions.Choice, "choiceValueId")],
    ["Component with an unknown state", {...validDecisions.Component, state: "Undecided"}],
    ["Numeric with the state as a string", {...validDecisions.Numeric, state: "1"}],
    ["Boolean with the state as a string", {...validDecisions.Boolean, state: "true"}],
];

describe("StoredConfiguration", () => {
    it.each(malformedConfigurations)("Malformed configuration get rejected", obj => {
        const configuration = obj as StoredConfiguration;

        const left = expectToBeLeft(loadConfiguration(configuration));
        expect(left).toEqual({
            type: ConfiguratorErrorType.StoredConfigurationInvalid,
        } satisfies StoredConfigurationInvalid);
    });

    it.each(Object.values(validDecisions))("A valid %p decision passes", decision => {
        expectToBeRight(
            loadConfiguration({schemaVersion: 1, explicitDecisions: [decision]} as unknown as StoredConfiguration),
        );
    });

    it.each(malformedDecisions)("A decision is rejected: %s", (_, decision) => {
        const left = expectToBeLeft(
            loadConfiguration({schemaVersion: 1, explicitDecisions: [decision]} as unknown as StoredConfiguration),
        );
        expect<unknown>(left.type).toBe(ConfiguratorErrorType.StoredConfigurationInvalid);
    });

    it.each(wellFormedConfigurations)("Well-formed configuration passes", obj => {
        const configuration = obj as StoredConfiguration;

        expectToBeRight(loadConfiguration(configuration));
    });
});