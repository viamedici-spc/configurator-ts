import {
    expectBoolean,
    expectChoice,
    expectContractFailureResult,
    expectNoChoiceValue,
    expectNumeric,
    expectPossibleBooleanDecisionStates,
    expectPossibleChoiceDecisionStates
} from "../../setup/Expectations";
import {createDefaultClient} from "../../setup/clientFactory";
import {externalFrameBackpack, extModel, fancyCar, orgModel} from "../../setup/ConfigurationModelPackageDefinitions";
import {describe, expect, it, vi} from "vitest";
import {
    AllowedInExplain,
    AllowedRulesInExplainSpecific,
    AllowedRulesInExplainType,
    AttributeType,
    ChoiceValueDecisionState,
    ConfigurationModelFromPackage,
    ConfigurationModelSourceType,
    DecisionKind,
    FailureType,
    SessionContext
} from "../../../src";

describe("Session Context", () => {

    const sut = createDefaultClient();

    const sessionContextA: SessionContext = {
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: externalFrameBackpack
        }
    };

    const sessionContextB: SessionContext = {
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: fancyCar
        }
    };

    const org: SessionContext = {
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: orgModel
        }
    };

    const ext: SessionContext = {
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: extModel
        }
    };

    describe("Switch Configuration Model", () => {
        describe("Success Cases", () => {
            it("Basic with no compatible choices", async () => {

                const session = await sut.createSession(sessionContextA);

                await session.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "Color"},
                    choiceValueId: "Grey",
                    state: ChoiceValueDecisionState.Included
                });

                await session.setSessionContext(sessionContextB);

                expectNoChoiceValue(session.getConfiguration(), {localId: "Color"}, "Grey");
            });

            it("Basic with compatible choice Color::Olive", async () => {

                const session = await sut.createSession(sessionContextA);

                await session.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "Color"},
                    choiceValueId: "Olive",
                    state: ChoiceValueDecisionState.Included
                });

                await session.setSessionContext(sessionContextB);

                expectChoice(session.getConfiguration(), {localId: "Color"}, "Olive", {
                    kind: DecisionKind.Explicit,
                    state: ChoiceValueDecisionState.Included
                });
            });
        });

        describe("Success Cases - Optimized", () => {
            it("Multiple successive calls reduced", async () => {

                const callbackMock = vi.fn();

                const session = await sut.createSession(sessionContextA);

                await session.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "Color"},
                    choiceValueId: "Grey",
                    state: ChoiceValueDecisionState.Included
                });

                session.setOnConfigurationChangedHandler(callbackMock);

                await Promise.all([
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextB)
                ]);

                expect(callbackMock.mock.calls.length).toBeLessThan(7);
                console.log("Number of updates", callbackMock.mock.calls.length);

                expectNoChoiceValue(session.getConfiguration(), {localId: "Color"}, "Grey");
            });

            it("Multiple successive, alternating calls reduced", async () => {
                const callbackMock = vi.fn();

                const session = await sut.createSession(sessionContextA);

                await session.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "Color"},
                    choiceValueId: "Grey",
                    state: ChoiceValueDecisionState.Included
                });

                session.setOnConfigurationChangedHandler(callbackMock);

                await Promise.all([
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextA),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextA),
                    session.setSessionContext(sessionContextB),
                    session.setSessionContext(sessionContextA),
                    session.setSessionContext(sessionContextB)
                ]);

                expect(callbackMock.mock.calls.length).toBeLessThan(7);
                console.log("Number of updates", callbackMock.mock.calls.length);

                expectNoChoiceValue(session.getConfiguration(), {localId: "Color"}, "Grey");
            });
        });
    });

    describe("Extend Configuration Model", () => {
        it("Basic continuation after extending the model", async () => {

            // Maintainer note: The purpose of this test is to show how consequences (and decisions)
            // are preserved when changing the model from a basic model to an extended version.

            const session = await sut.createSession(org);

            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Color"},
                choiceValueId: "Red",
                state: ChoiceValueDecisionState.Included
            });
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Color", componentPath: ["Sub"]},
                choiceValueId: "Red",
                state: ChoiceValueDecisionState.Included
            });
            await session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "Amount"},
                state: 10
            });
            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "Enabled"},
                state: true
            });

            await session.setSessionContext(ext);

            // Choice Color from the root model
            expectChoice(session.getConfiguration(), {localId: "Color"}, "Red", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            });
            expectChoice(session.getConfiguration(), {localId: "Color"}, "Black", null);
            expectChoice(session.getConfiguration(), {localId: "Color"}, "Olive", null);

            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Color"}, "Red", [ChoiceValueDecisionState.Included]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Color"}, "Black", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Color"}, "Olive", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);

            // Choice Color from the Sub component
            expectChoice(session.getConfiguration(), {localId: "Color", componentPath: ["Sub"]}, "Red", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            });
            expectChoice(session.getConfiguration(), {localId: "Color", componentPath: ["Sub"]}, "Black", null);
            expectChoice(session.getConfiguration(), {localId: "Color", componentPath: ["Sub"]}, "Olive", null);

            expectPossibleChoiceDecisionStates(session.getConfiguration(), {
                localId: "Color",
                componentPath: ["Sub"]
            }, "Red", [ChoiceValueDecisionState.Included]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {
                localId: "Color",
                componentPath: ["Sub"]
            }, "Red", [ChoiceValueDecisionState.Included]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {
                localId: "Color",
                componentPath: ["Sub"]
            }, "Black", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {
                localId: "Color",
                componentPath: ["Sub"]
            }, "Olive", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);

            // Numeric Amount
            expectNumeric(session.getConfiguration(), {localId: "Amount"}, {
                kind: DecisionKind.Explicit,
                state: 10
            });

            // Boolean Enabled
            expectBoolean(session.getConfiguration(), {localId: "Enabled"}, {
                kind: DecisionKind.Explicit,
                state: true
            });
            expectPossibleBooleanDecisionStates(session.getConfiguration(), {localId: "Enabled"}, [true, false]);
        });
    });

    describe("Attributes To Respect", () => {
        describe("Success Cases", () => {
            it("Ignore Rating", async () => {
                const session = await sut.createSession({
                    ...sessionContextA,
                    attributeRelations: [
                        {attributeId: {localId: "Color"}, decisions: [{localId: "Color"}, {localId: "Fabric"}]},
                        {attributeId: {localId: "Fabric"}, decisions: [{localId: "Fabric"}, {localId: "Color"}]},
                        {
                            attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                            decisions: [
                                {localId: "WR", sharedConfigurationModelId: "requirement"},
                                {localId: "HL", sharedConfigurationModelId: "requirement"},
                                {localId: "Color"},
                                {localId: "Fabric"}]
                        },
                        {
                            attributeId: {localId: "WR", sharedConfigurationModelId: "requirement"},
                            decisions: [
                                {localId: "TL", sharedConfigurationModelId: "requirement"},
                                {localId: "HL", sharedConfigurationModelId: "requirement"},
                                {localId: "Color"},
                                {localId: "Fabric"}]
                        },
                        {
                            attributeId: {localId: "HL", sharedConfigurationModelId: "requirement"},
                            decisions: [
                                {localId: "TL", sharedConfigurationModelId: "requirement"},
                                {localId: "WR", sharedConfigurationModelId: "requirement"},
                                {localId: "Color"},
                                {localId: "Fabric"}]
                        },
                        {attributeId: {localId: "IsCustom"}, decisions: []},
                        {attributeId: {localId: "KgPerSqM"}, decisions: []},
                        {attributeId: {localId: "LidBuckles"}, decisions: []},
                        {attributeId: {localId: "AttachmentBuckles"}, decisions: []},
                        {attributeId: {localId: "material", componentPath: ["AttachmentBuckles"]}, decisions: []},
                        {attributeId: {localId: "material", componentPath: ["LidBuckles"]}, decisions: []},
                    ]
                });

                await session.makeDecision({
                    type: AttributeType.Boolean,
                    attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                    state: true
                });

                expectBoolean(session.getConfiguration(), {
                    localId: "TL",
                    sharedConfigurationModelId: "requirement"
                }, {kind: DecisionKind.Explicit, state: true}, "Non-conflicting choice, should be applied.");

                await session.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "Color"},
                    choiceValueId: "Olive",
                    state: ChoiceValueDecisionState.Included
                });

                expectChoice(session.getConfiguration(), {localId: "Color"}, "Olive", {
                    kind: DecisionKind.Explicit,
                    state: ChoiceValueDecisionState.Included
                }, "Should have been applied because of the attribute relations.");
                expectBoolean(session.getConfiguration(), {
                    localId: "TL",
                    sharedConfigurationModelId: "requirement"
                }, {
                    kind: DecisionKind.Implicit,
                    state: false
                }, "Should have been taken back because of the color choice.");
            });
        });

        describe("Failure Cases", () => {
            it("Incomplete decisions to respect", async () => {
                await expectContractFailureResult(() =>
                    sut.createSession({
                        ...sessionContextA,
                        attributeRelations: [
                            {attributeId: {localId: "Color"}, decisions: [{localId: "Color"}, {localId: "Fabric"}]}
                        ]
                    }), FailureType.DecisionsToRespectInvalid
                );
            });
        });
    });

    describe("Equality Tests", () => {
        const configurationModelSource: ConfigurationModelFromPackage = {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: {
                root: "root",
                configurationModels: [{
                    configurationModelId: "root",
                    attributes: {
                        booleanAttributes: [{
                            attributeId: "bool1",
                            isDecisionRequired: true
                        }]
                    },
                    constraints: [{
                        constraintId: "c1",
                        textualConstraint: "true"
                    }]
                }]
            }
        };
        const basicSessionContext: SessionContext = {
            configurationModelSource: configurationModelSource
        };
        const expectedBasicSessionContext: Required<SessionContext> = {
            configurationModelSource: configurationModelSource,
            usageRuleParameters: {},
            allowedInExplain: null,
            attributeRelations: null
        };
        const allowedInExplain: AllowedInExplain = {
            rules: {
                type: AllowedRulesInExplainType.specific,
                rules: [{configurationModelId: "root", localId: "c1"}]
            } satisfies AllowedRulesInExplainSpecific
        };

        it("Basic Context is equal", async () => {
            const session = await sut.createSession(basicSessionContext);

            expect(session.getSessionContext()).toStrictEqual(expectedBasicSessionContext);
        });

        it("AllowedInExplain is passed correctly", async () => {
            const session = await sut.createSession({
                ...basicSessionContext,
                allowedInExplain: allowedInExplain
            });

            expect(session.getSessionContext()).toStrictEqual({
                ...expectedBasicSessionContext,
                allowedInExplain: allowedInExplain
            });
        });
    });
});