import {createDefaultClient} from "../../setup/clientFactory";
import {externalFrameBackpack} from "../../setup/ConfigurationModelPackageDefinitions";
import {describe, expect, it} from "vitest";
import {
    AttributeType,
    ChoiceValueDecisionState,
    ConfigurationModelSourceType,
    DecisionKind,
    ExplainQuestionSubject,
    ExplainQuestionType,
    FailureType
} from "../../../src";
import {
    expectBoolean,
    expectCausedByDecision, expectCausedByRule,
    expectChoice,
    expectContractFailureResult,
    expectDecisionExplanationAmount
} from "../../setup/Expectations";
import {logJson} from "../../../src/crossCutting/Dev";

describe("ConfiguratorClient", () => {

    const sut = createDefaultClient();

    describe("Success Cases", () => {
        it("Basic", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                }
            });

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                state: true
            });
            expectBoolean(session.getConfiguration(), {
                localId: "TL",
                sharedConfigurationModelId: "requirement"
            }, {kind: DecisionKind.Explicit, state: true});

            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Cordura0700D",
                state: ChoiceValueDecisionState.Included
            });

            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0700D", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            });
        });

        it("Trigger OnConfigurationChangedHandler", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                }
            });

            let hasHandlerBeenCalled = false;

            session.setOnConfigurationChangedHandler(() => {
                hasHandlerBeenCalled = true;
            });

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                state: true
            });

            expectBoolean(session.getConfiguration(), {
                localId: "TL",
                sharedConfigurationModelId: "requirement"
            }, {kind: DecisionKind.Explicit, state: true});
            expect(hasHandlerBeenCalled).toBe(true);
        });

        it("Explain Conflict", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                }
            });

            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            });


            const explanation = await session.explain({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.choiceValue,
                attributeId: {localId: "Color"},
                choiceValueId: "RAL7013",
                state: ChoiceValueDecisionState.Included
            }, "full");


            expectDecisionExplanationAmount(explanation, 1);
            expectCausedByDecision(explanation, 0, {
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            });
            expectCausedByRule(explanation, 0, {
                localId: "ReqRAL7013",
                configurationModelId: "root"
            });
            expectCausedByRule(explanation, 0, {
                localId: "Incompatible",
                configurationModelId: "root"
            });
        });
    });

    describe("Failure Cases", () => {
        it("Decision Conflict", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                }
            });

            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            });

            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Nylon0050D", {
                kind: DecisionKind.Explicit,
                state: ChoiceValueDecisionState.Included
            });

            await expectContractFailureResult(() => session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Color"},
                choiceValueId: "RAL7013",
                state: ChoiceValueDecisionState.Included
            }), FailureType.ConfigurationConflict);

            expectChoice(session.getConfiguration(), {localId: "Color"}, "RAL7013", null);
        });
    });

    describe("Failure Cases - Network", () => {
        it("No connectivity", async () => {
            const client = createDefaultClient("offline.offline");

            try {
                const session = await client.createSession({
                    configurationModelSource: {
                        type: ConfigurationModelSourceType.Package,
                        configurationModelPackage: externalFrameBackpack
                    }
                });
            }
            catch (e: any){
                logJson(e, "after create session");
                expect(e.type).toEqual("Local.LowLevelCommunicationError");
            }
        })
    })
});