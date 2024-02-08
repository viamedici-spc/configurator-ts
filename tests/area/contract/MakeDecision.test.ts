import {createDefaultClient} from "../../setup/clientFactory";
import {
    canContributeToDemo,
    changeDecisionDemo,
    externalFrameBackpack,
    implicationDemo
} from "../../setup/ConfigurationModelPackageDefinitions";
import {
    expectBoolean, expectCanContributeToConfigurationSatisfaction,
    expectChoice,
    expectComponent,
    expectContractFailureResult, expectIsSatisfied,
    expectNumeric,
    expectPossibleBooleanDecisionStates,
    expectPossibleChoiceDecisionStates,
    expectPossibleComponentDecisionStates
} from "../../setup/Expectations";
import {describe, expect, it} from "vitest";
import {
    AttributeType,
    ChoiceValueDecisionState,
    ComponentDecisionState,
    ConfigurationConflictReason,
    ConfigurationModelSourceType,
    DecisionKind,
    FailureType,
    IConfigurationSession
} from "../../../src";
import {ConfigurationModelPackageBuilder} from "../../setup/ConfigurationModelPackageBuilder";

describe("ConfiguratorClient-MakeDecision", () => {

    const sut = createDefaultClient();

    describe("Success Cases", () => {

        it("Make Choice Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", null, "No decision was made yet");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);

            // DO
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Cordura0500D",
                state: ChoiceValueDecisionState.Included
            });
            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            }, "Explicitly included");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", [ChoiceValueDecisionState.Included]);

            // UNDO
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Cordura0500D",
                state: null
            });
            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", null, "Explicitly undefined again");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
        });

        it("Make Numeric Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            // DO
            await session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "KgPerSqM"},
                state: 0.1
            });

            // UNDO
            await session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "KgPerSqM"},
                state: undefined
            });
        });

        it("Make Boolean Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            // DO
            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "IsCustom"},
                state: true
            });
            expectBoolean(session.getConfiguration(), {localId: "IsCustom"}, {
                kind: DecisionKind.Explicit,
                state: true
            });
            expectPossibleBooleanDecisionStates(session.getConfiguration(), {localId: "IsCustom"}, [true, false]);


            // UNDO
            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "IsCustom"},
                state: undefined
            });

            expectBoolean(session.getConfiguration(), {localId: "IsCustom"}, null);
            expectPossibleBooleanDecisionStates(session.getConfiguration(), {localId: "IsCustom"}, [true, false]);
        });

        it("Make Component Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            // DO
            await session.makeDecision({
                type: AttributeType.Component,
                attributeId: {localId: "LidBuckles"},
                state: ComponentDecisionState.Included
            });

            expectComponent(session.getConfiguration(), {localId: "LidBuckles"}, {
                kind: DecisionKind.Explicit,
                state: ComponentDecisionState.Included
            }, "The component should be included explicitly.");
            expectPossibleComponentDecisionStates(session.getConfiguration(), {localId: "LidBuckles"}, [ComponentDecisionState.Included, ComponentDecisionState.Excluded]);

            // UNDO
            await session.makeDecision({
                type: AttributeType.Component,
                attributeId: {localId: "LidBuckles"},
                state: null
            });

            expectComponent(session.getConfiguration(), {localId: "LidBuckles"}, null, "The component should be inclusion should be undefined explicitly.");
            expectPossibleComponentDecisionStates(session.getConfiguration(), {localId: "LidBuckles"}, [ComponentDecisionState.Included, ComponentDecisionState.Excluded]);
        });
    });

    describe("Success Cases - Implicit", async () => {

        async function sharedSetup(): Promise<IConfigurationSession> {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: implicationDemo
                },
            });

            expectNumeric(session.getConfiguration(), {localId: "numeric"}, null, "No decision has been made yet, and the implication should not trigger.");
            expectBoolean(session.getConfiguration(), {localId: "boolean"}, null, "No decision has been made yet, and the implication should not trigger.");
            expectComponent(session.getConfiguration(), {localId: "component"}, null, "No decision has been made yet, and the implication should not trigger.");
            expectChoice(session.getConfiguration(), {localId: "choice"}, "v2", null, "No decision has been made yet, and the implication should not trigger.");

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "trigger"},
                state: true
            });
            return session;
        }

        it("Implicate Numeric", async () => {

            const session = await sharedSetup();

            expectNumeric(session.getConfiguration(), {localId: "numeric"}, {
                kind: DecisionKind.Implicit,
                state: 3
            }, "Because of trigger the value 3 should now be implicated.");

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "trigger"},
                state: undefined
            });

            expectNumeric(session.getConfiguration(), {localId: "numeric"}, null, "The trigger decision has been un-made, and the implication should revert.");
        });

        it("Implicate Boolean", async () => {

            const session = await sharedSetup();

            expectBoolean(session.getConfiguration(), {localId: "boolean"}, {
                kind: DecisionKind.Implicit,
                state: true
            }, "Because of trigger the value true should now be implicated.");
            expectPossibleBooleanDecisionStates(session.getConfiguration(), {localId: "boolean"}, [true]);

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "trigger"},
                state: undefined
            });

            expectBoolean(session.getConfiguration(), {localId: "boolean"}, null, "The trigger decision has been un-made, and the implication should revert.");
            expectPossibleBooleanDecisionStates(session.getConfiguration(), {localId: "boolean"}, [true, false]);
        });

        it("Implicate Component", async () => {

            const session = await sharedSetup();

            expectComponent(session.getConfiguration(), {localId: "component"}, {
                kind: DecisionKind.Implicit,
                state: ComponentDecisionState.Included
            }, "Because of trigger the value true should now be implicated.");
            expectPossibleComponentDecisionStates(session.getConfiguration(), {localId: "component"}, [ComponentDecisionState.Included]);

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "trigger"},
                state: undefined
            });

            expectComponent(session.getConfiguration(), {localId: "component"}, null, "The trigger decision has been un-made, and the implication should revert.");
            expectPossibleComponentDecisionStates(session.getConfiguration(), {localId: "component"}, [ComponentDecisionState.Included, ComponentDecisionState.Excluded]);
        });

        it("Implicate Choice", async () => {

            const session = await sharedSetup();

            expectChoice(session.getConfiguration(), {localId: "choice"}, "v2", {
                kind: DecisionKind.Implicit,
                state: ChoiceValueDecisionState.Included
            }, "Because of trigger the value true should now be implicated.");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "choice"}, "v1", [ChoiceValueDecisionState.Excluded]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "choice"}, "v2", [ChoiceValueDecisionState.Included]);

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "trigger"},
                state: undefined
            });

            expectChoice(session.getConfiguration(), {localId: "choice"}, "v2", null, "The trigger decision has been un-made, and the implication should revert.");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "choice"}, "v1", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "choice"}, "v2", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
        });
    });

    describe("Success Cases - Change Decision", () => {

        it("Make Choice Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: changeDecisionDemo
                },
            });

            // DO
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "X"},
                choiceValueId: "X1",
                state: ChoiceValueDecisionState.Included
            });
            expectChoice(session.getConfiguration(), {localId: "X"}, "X1", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            }, "Explicitly included");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "X"}, "X1", [ChoiceValueDecisionState.Included]);

            // Change decision
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "X"},
                choiceValueId: "X2",
                state: ChoiceValueDecisionState.Included
            });
            expectChoice(session.getConfiguration(), {localId: "X"}, "X1", null, "Explicitly undefined again");
            expectChoice(session.getConfiguration(), {localId: "X"}, "X2", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            });
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "X"}, "X1", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "X"}, "X2", [ChoiceValueDecisionState.Included]);
        });

    });

    describe("Success Cases - CanContributeTo", () => {
        it("Updates according to response", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: canContributeToDemo
                },
            });


            const attributeX = {localId: "X"};
            const attributeY = {localId: "Y"};

            let configuration = session.getConfiguration();
            expect(configuration.isSatisfied).toBe(false);
            expectIsSatisfied(configuration, attributeX, true);
            expectIsSatisfied(configuration, attributeY, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeX, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeY, true);

            // DO
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "X"},
                choiceValueId: "X1",
                state: ChoiceValueDecisionState.Included
            });

            configuration = session.getConfiguration();
            expect(configuration.isSatisfied).toBe(true);
            expectIsSatisfied(configuration, attributeX, true);
            expectIsSatisfied(configuration, attributeY, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeX, false);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeY, false);
        });
    });

    describe("Failure Cases", () => {
        it("Make Numeric on Boolean", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "IsCustom"},
                state: 0.1
            }), FailureType.ConfigurationAttributeNotFound);
        });

        it("Make Strange Choice Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            // DO
            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Strange"},
                choiceValueId: "A/X",
                state: ChoiceValueDecisionState.Included
            }), FailureType.ConfigurationAttributeNotFound);
        });

        it("Make Strange Choice Value Decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            // DO
            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Strange",
                state: ChoiceValueDecisionState.Included
            }), FailureType.ConfigurationChoiceValueNotFound);
        });

        it("Make Boolean on Numeric", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "KgPerSqM"},
                state: false
            }), FailureType.ConfigurationAttributeNotFound);
        });

        it("Make Numeric out of range decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "KgPerSqM"},
                state: 100000
            }), {
                type: FailureType.ConfigurationConflict,
                reason: ConfigurationConflictReason.NumericDecisionOutOfRange
            });
        });

        it("Make Numeric invalid decision", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: new ConfigurationModelPackageBuilder().rootConfigurationModel(b => b
                        .integerAttribute("x", 0, 100)
                        .constraint("x", "x != 13")
                    ).build()
                },
            });

            await expectContractFailureResult(session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "x"},
                state: 13
            }), FailureType.ConfigurationConflict);
        });
    });
});