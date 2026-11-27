import {expect, it} from "bun:test";
import * as DtoE from "../../../src/domain/mapper/DomainToEngineMapping";
import type {ConfigurationModelPackage, SessionContext} from "../../../src";
import {ConfigurationModelSourceType} from "../../../src";

// Every attribute kind, both inclusion types, both constraint types and a shared model; one list `null`, one absent.
const configurationModelPackage: ConfigurationModelPackage = {
    root: "Root",
    configurationModels: [
        {
            configurationModelId: "Root",
            sharedFromConfigurationModels: ["Shared"],
            attributes: {
                choiceAttributes: [
                    {attributeId: "C", lowerBound: 0, upperBound: 2, choiceValues: [{choiceValueId: "V"}]},
                ],
                numericAttributes: [{attributeId: "N", isDecisionRequired: true, min: 0, max: 10, decimalPlaces: 2}],
                booleanAttributes: [{attributeId: "B", isDecisionRequired: false}],
                componentAttributes: [
                    {
                        attributeId: "K1",
                        configurationModelId: "Part",
                        inclusion: {type: "OptionallyIncluded", isDecisionRequired: true},
                    },
                    {attributeId: "K2", configurationModelId: "Part", inclusion: {type: "AlwaysIncluded"}},
                ],
            },
            constraints: [
                {type: "TextualConstraint", constraintId: "R1", textualConstraint: "B = true"},
                {
                    type: "TextualConstraintCollection",
                    constraintId: "R2",
                    operator: "Or",
                    textualConstraints: ["C = V", "N > 1"],
                },
            ],
        },
        {configurationModelId: "Part", attributes: {booleanAttributes: null}, constraints: null},
        {configurationModelId: "Shared", attributes: {}},
    ],
};

it("maps a configuration model package to the engine's request field by field", () => {
    const sessionContext: SessionContext = {
        sessionInitialisationOptions: {accessToken: "Token1"},
        configurationModelSource: {type: ConfigurationModelSourceType.Package, configurationModelPackage},
    };

    // Compared as the request is sent: JSON keeps `null` and drops a field that is `undefined`.
    const sent: unknown = JSON.parse(JSON.stringify(DtoE.mapSessionContext(sessionContext).configurationModelSource));

    expect(sent).toStrictEqual({type: "Package", configurationModelPackage});
});