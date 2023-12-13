import {createDefaultClient} from "../../setup/clientFactory";
import {explainSatisfactionDemo, externalFrameBackpack} from "../../setup/ConfigurationModelPackageDefinitions";
import {describe, expect, it} from "vitest";
import {
    AttributeType,
    ChoiceValueDecisionState,
    ConfigurationModelSourceType,
    ConstraintsExplainAnswer,
    DecisionsExplainAnswer,
    ExplainQuestionSubject,
    ExplainQuestionType,
    FullExplainAnswer,
    IConfigurationSession
} from "../../../src";
import {
    expectCausedByCardinalitiesAmount,
    expectCausedByCardinality,
    expectCausedByDecision,
    expectCausedByDecisionsAmount,
    expectCausedByRule,
    expectCausedByRulesAmount,
    expectConstraintExplanationAmount,
    expectDecisionExplanationAmount
} from "../../setup/Expectations";

describe("ConfiguratorClient-Explain", () => {

    const sut = createDefaultClient();

    describe("Success Cases - WhyStateNotPossible", () => {

        async function prepareSession(): Promise<IConfigurationSession> {
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
            await session.makeDecision({
                type: AttributeType.Numeric,
                attributeId: {localId: "KgPerSqM"},
                state: 0.6
            });

            return session;
        }

        function assertDecisions(result: FullExplainAnswer | DecisionsExplainAnswer) {
            expectDecisionExplanationAmount(result, 1);
            expectCausedByDecisionsAmount(result, 0, 2);
            expectCausedByDecision(result, 0, {
                type: AttributeType.Numeric,
                attributeId: {localId: "KgPerSqM"},
                state: 0.6
            });
            expectCausedByDecision(result, 0, {
                type: AttributeType.Boolean,
                attributeId: {localId: "IsCustom"},
                state: true
            });
        }

        function assertConstraints(result: FullExplainAnswer | ConstraintsExplainAnswer) {
            expectConstraintExplanationAmount(result, 1);
            expectCausedByRulesAmount(result, 0, 2);
            expectCausedByCardinalitiesAmount(result, 0, 0);
            expectCausedByRule(result, 0, {
                localId: "ReqFabricForWeight", configurationModelId: "root"
            });
            expectCausedByRule(result, 0, {
                localId: "ReqFabricForCustom", configurationModelId: "root"
            });
        }

        it("AnswerType Full", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.choiceValue,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            }, "full");

            assertDecisions(result);
            assertConstraints(result);
        });

        it("AnswerType Constraints", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.choiceValue,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            }, "constraints");

            expect((result as unknown as DecisionsExplainAnswer).decisionExplanations).toEqual([]);
            assertConstraints(result);
        });

        it("AnswerType Decisions", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.choiceValue,
                attributeId: {localId: "Fabric"},
                choiceValueId: "Nylon0050D",
                state: ChoiceValueDecisionState.Included
            }, "decisions");

            expect((result as unknown as ConstraintsExplainAnswer).constraintExplanations).toEqual([]);
            assertDecisions(result);
        });
    });

    describe("Success Cases - WhyNotSatisfied - Configuration", () => {

        async function prepareSession(): Promise<IConfigurationSession> {
            return await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: explainSatisfactionDemo
                },
            });
        }

        function assertDecisions(result: FullExplainAnswer | DecisionsExplainAnswer) {
            expectDecisionExplanationAmount(result, 0);
        }

        function assertConstraints(result: FullExplainAnswer | ConstraintsExplainAnswer) {
            expectConstraintExplanationAmount(result, 1);
            expectCausedByRulesAmount(result, 0, 1);
            expectCausedByCardinalitiesAmount(result, 0, 1);
            expectCausedByRule(result, 0, {
                localId: "either", configurationModelId: "root"
            });
            expectCausedByCardinality(result, 0, {localId: "A", configurationModelId: "root"});
        }

        it("AnswerType Full", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.configuration,
            }, "full");

            assertDecisions(result);
            assertConstraints(result);
        });

        it("AnswerType Constraints", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.configuration,
            }, "constraints");

            expect((result as unknown as DecisionsExplainAnswer).decisionExplanations).toEqual([]);
            assertConstraints(result);
        });

        it("AnswerType Decisions", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.configuration,
            }, "decisions");

            expect((result as unknown as ConstraintsExplainAnswer).constraintExplanations).toEqual([]);
            assertDecisions(result);
        });
    });

    describe("Success Cases - WhyNotSatisfied - Attribute", () => {

        async function prepareSession(): Promise<IConfigurationSession> {
            return await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: explainSatisfactionDemo
                },
            });
        }

        function assertDecisions(result: FullExplainAnswer | DecisionsExplainAnswer) {
            expectDecisionExplanationAmount(result, 0);
        }

        function assertConstraints(result: FullExplainAnswer | ConstraintsExplainAnswer) {
            expectConstraintExplanationAmount(result, 1);
            expectCausedByRulesAmount(result, 0, 0);
            expectCausedByCardinalitiesAmount(result, 0, 1);
            expectCausedByCardinality(result, 0, {localId: "A", configurationModelId: "root"});
        }

        it("AnswerType Full", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.attribute,
                attributeId: {localId: "A"}
            }, "full");

            assertDecisions(result);
            assertConstraints(result);
        });

        it("AnswerType Constraints", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.attribute,
                attributeId: {localId: "A"}
            }, "constraints");

            expect((result as unknown as DecisionsExplainAnswer).decisionExplanations).toEqual([]);
            assertConstraints(result);
        });

        it("AnswerType Decisions", async () => {
            const session = await prepareSession();

            const result = await session.explain({
                question: ExplainQuestionType.whyIsNotSatisfied,
                subject: ExplainQuestionSubject.attribute,
                attributeId: {localId: "A"}
            }, "decisions");

            expect((result as unknown as ConstraintsExplainAnswer).constraintExplanations).toEqual([]);
            assertDecisions(result);
        });
    });
});