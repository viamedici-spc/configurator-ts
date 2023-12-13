import {externalFrameBackpack} from "../../setup/ConfigurationModelPackageDefinitions";
import {createDefaultClient} from "../../setup/clientFactory";
import {expectBoolean, expectChoice, expectContractFailureResult} from "../../setup/Expectations";
import {describe, it} from "vitest";

import {
    AttributeType,
    ChoiceValueDecisionState,
    ConfigurationModelSourceType,
    ConfigurationSetManyConflict,
    DecisionKind,
    ExplainQuestionSubject,
    ExplainQuestionType,
    ExplainSolution,
    ExplicitDecision,
    FailureType,
    SetManyMode
} from "../../../src";

describe("ApplySolution", () => {

    const sut = createDefaultClient();

    describe("Success Cases", () => {
        it("After Explain", async () => {
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

            const explanation = await session.explain({
                subject: ExplainQuestionSubject.choiceValue,
                question: ExplainQuestionType.whyIsStateNotPossible,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            }, "decisions");

            await session.applySolution(explanation.decisionExplanations[0].solution!);
            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Nylon0050D", {
                state: ChoiceValueDecisionState.Included,
                kind: DecisionKind.Explicit
            });
            expectBoolean(session.getConfiguration(), {localId: "TL", sharedConfigurationModelId: "requirement"},  {
                state: false,
                kind: DecisionKind.Implicit
            });
        });

        it("After Set Many", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                }
            });

            try {
                const mode: SetManyMode = {
                    type: "DropExistingDecisions",
                    conflictHandling: {
                        type: "Manual",
                        includeConstraintsInConflictExplanation: false
                    }
                };
                const decisions: ReadonlyArray<ExplicitDecision> = [
                    {
                        type: AttributeType.Boolean,
                        attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                        state: true
                    },
                    {
                        type: AttributeType.Choice,
                        attributeId: {localId: "Fabric"},
                        choiceValueId: "Nylon0050D",
                        state: ChoiceValueDecisionState.Included
                    }
                ];
                await session.setMany(decisions, mode);
            } catch (exception) {
                const conflict = exception as ConfigurationSetManyConflict;

                await session.applySolution(conflict.decisionExplanations[0].solution!);
                expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Nylon0050D", null);
                expectBoolean(session.getConfiguration(), {localId: "TL", sharedConfigurationModelId: "requirement"},  {
                    kind: DecisionKind.Explicit,
                    state: true
                });
            }
        });
    });

    describe("Failure Cases", () => {
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

            await session.explain({
                subject: ExplainQuestionSubject.choiceValue,
                question: ExplainQuestionType.whyIsStateNotPossible,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            }, "decisions");

            const invalidSolution: ExplainSolution = {
                "decisions": [
                    {
                        type: AttributeType.Choice,
                        attributeId: {localId: "Fabric"},
                        state: ChoiceValueDecisionState.Included,
                        choiceValueId: "Nylon0050D"
                    },
                    {
                        type: AttributeType.Choice,
                        attributeId: {localId: "Color"},
                        state: ChoiceValueDecisionState.Included,
                        choiceValueId: "RAL7013"
                    },
                    {
                        type: AttributeType.Choice,
                        attributeId: {localId: "Rating"},
                        state: null,
                        choiceValueId: "TL"
                    }
                ],
                mode: {
                    type: "Default"
                }
            };

            await expectContractFailureResult(session.applySolution(invalidSolution), FailureType.ConfigurationSolutionNotAvailable);
        });
    });
});