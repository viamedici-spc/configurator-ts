import {describe, expect, it} from "vitest";
import {ConfiguratorErrorType, StoredConfiguration, StoredConfigurationInvalid} from "../../../src";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";
import {loadConfiguration} from "../../../src/domain/logic/ConfigurationStoring";

const malformedConfigurations: any[] = [
    null,
    undefined,
    {},
    {
        // Schema not supported
        schemaVersion: 2,
        explicitDecisions: []
    },
    {
        schemaVersion: 1,
        // Property name mismatch
        decisions: []
    },
    {
        schemaVersion: 1,
        explicitDecisions: [{
            // Unknown type
            type: "BetterChoice",
            attributeId: {
                localId: "Ch"
            },
            choiceValueId: "Val",
            state: "Included"
        }]
    },
    {
        schemaVersion: 1,
        explicitDecisions: [{
            type: "Choice",
            attributeId: {
                localId: "Ch"
            },
            choiceValueId: "Val",
            // Unknown state
            state: "Undecided"
        }]
    },
    {
        schemaVersion: 1,
        explicitDecisions: [{
            type: "Choice",
            attributeId: {
                localId: "Ch",
                componentPath: [],
                // Null is not allowed
                sharedConfigurationModelId: null
            },
            choiceValueId: "Val",
            state: "Included"
        }]
    },
];

const wellFormedConfigurations: any[] = [
    {
        schemaVersion: 1,
        explicitDecisions: []
    },
    {
        schemaVersion: 1,
        explicitDecisions: [{
            type: "Choice",
            attributeId: {
                localId: "Ch",
                componentPath: [],
                sharedConfigurationModelId: undefined
            },
            choiceValueId: "Val",
            state: "Included"
        }]
    },
];

describe("StoredConfiguration", () => {
    it.each(malformedConfigurations)("Malformed configuration get rejected", (obj) => {
        const configuration = obj as StoredConfiguration;

        const left = expectToBeLeft(loadConfiguration(configuration));
        expect(left).toEqual({
            type: ConfiguratorErrorType.StoredConfigurationInvalid
        } satisfies StoredConfigurationInvalid);
    });

    it.each(wellFormedConfigurations)("Well-formed configuration passes", (obj) => {
        const configuration = obj as StoredConfiguration;

        expectToBeRight(loadConfiguration(configuration));
    });
});