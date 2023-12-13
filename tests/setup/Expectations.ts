import {constVoid, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {match, P} from "ts-pattern";
import {expect} from "vitest";
import {
    Attribute,
    BooleanAttribute,
    CausedByDecision,
    causedByDecisionEquals,
    ChoiceAttribute,
    ChoiceValueDecisionState,
    ComponentAttribute,
    ComponentDecisionState,
    Configuration,
    ConfigurationInterpreter,
    ConstraintsExplainAnswer,
    Decision,
    DecisionsExplainAnswer,
    FailureResult,
    FailureType,
    FullExplainAnswer,
    GlobalAttributeId,
    globalAttributeIdEquals,
    GlobalConstraintId,
    globalConstraintIdEquals,
    NumericAttribute
} from "../../src";

export function expectDecisionExplanationAmount(explainAnswer: FullExplainAnswer | DecisionsExplainAnswer, expectedAmount: number, message?: string) {
    expect(explainAnswer.decisionExplanations.length, message).toBe(expectedAmount);
}

export function expectConstraintExplanationAmount(explainAnswer: FullExplainAnswer | ConstraintsExplainAnswer, expectedAmount: number, message?: string) {
    expect(explainAnswer.constraintExplanations.length, message).toBe(expectedAmount);
}

export function expectCausedByDecision(explainAnswer: FullExplainAnswer | DecisionsExplainAnswer, explanationIndex: number, expectedCausedByDecision: CausedByDecision): void {
    pipe(
        explainAnswer.decisionExplanations,
        RA.lookup(explanationIndex),
        O.chain(explanation => {
            return pipe(explanation.causedByDecisions, RA.findFirst(causedByDecision => {
                return causedByDecisionEquals(causedByDecision, expectedCausedByDecision);
            }));
        }),
        O.doIfNone(() => () => expect(false, "Could not find the specified caused by decision.").toBe(true))
    );
}

export function expectCausedByRulesAmount(explainAnswer: FullExplainAnswer | ConstraintsExplainAnswer, explanationIndex: number, expectedAmount: number, message?: string): void {
    pipe(
        explainAnswer.constraintExplanations,
        RA.lookup(explanationIndex),
        O.map(explanation => expect(explanation.causedByRules.length, message).toBe(expectedAmount)),
        O.match(
            () => expect(false, "Could not find the specified caused by rule.").toBe(true),
            constVoid
        )
    );
}

export function expectCausedByCardinalitiesAmount(explainAnswer: FullExplainAnswer | ConstraintsExplainAnswer, explanationIndex: number, expectedAmount: number, message?: string): void {
    pipe(
        explainAnswer.constraintExplanations,
        RA.lookup(explanationIndex),
        O.map(explanation => expect(explanation.causedByCardinalities.length, message).toBe(expectedAmount)),
        O.match(
            () => expect(false, "Could not find the specified caused by rule.").toBe(true),
            constVoid
        )
    );
}

export function expectCausedByDecisionsAmount(explainAnswer: FullExplainAnswer | DecisionsExplainAnswer, explanationIndex: number, expectedAmount: number, message?: string): void {
    pipe(
        explainAnswer.decisionExplanations,
        RA.lookup(explanationIndex),
        O.map(explanation => expect(explanation.causedByDecisions.length, message).toBe(expectedAmount)),
        O.match(
            () => expect(false, "Could not find the specified caused by rule.").toBe(true),
            constVoid
        )
    );
}

export function expectCausedByRule(explainAnswer: FullExplainAnswer | ConstraintsExplainAnswer, explanationIndex: number, expectedGlobalConstraintId: GlobalConstraintId): void {
    pipe(
        explainAnswer.constraintExplanations,
        RA.lookup(explanationIndex),
        O.chain(explanation => {
            return pipe(explanation.causedByRules, RA.findFirst(causedByRule => {
                return globalConstraintIdEquals(causedByRule, expectedGlobalConstraintId);
            }));
        }),
        O.doIfNone(() => () => expect(false, "Could not find the specified caused by rule.").toBe(true))
    );
}

export function expectCausedByCardinality(explainAnswer: FullExplainAnswer | ConstraintsExplainAnswer, explanationIndex: number, expectedGlobalAttributeId: GlobalConstraintId): void {
    pipe(
        explainAnswer.constraintExplanations,
        RA.lookup(explanationIndex),
        O.chain(explanation => {
            return pipe(explanation.causedByCardinalities, RA.findFirst(causedByRule => {
                return globalAttributeIdEquals(causedByRule, expectedGlobalAttributeId);
            }));
        }),
        O.doIfNone(() => () => expect(false, "Could not find the specified caused by cardinality.").toBe(true))
    );
}

export function expectNoChoiceValue(configuration: Configuration, attributeId: GlobalAttributeId, choiceValueId: string) {
    pipe(
        ConfigurationInterpreter.getChoiceAttributes(configuration),
        RA.findFirst((d: ChoiceAttribute) => globalAttributeIdEquals(d.id, attributeId)),
        O.doIfNone(() => () => expect(false, "Could not find the specified attribute.").toBe(true)),
        O.chain((c: ChoiceAttribute) => pipe(c.values, RA.findFirst(v => v.id === choiceValueId))),
        O.doIfSome(s => () => {
            expect(s, "Expected choice value to not exist, but found some.").toBe(undefined);
        })
    );
}

export function expectChoice(configuration: Configuration, attributeId: GlobalAttributeId, choiceValueId: string, expectedDecision: Decision<ChoiceValueDecisionState> | null, message?: string) {
    pipe(
        ConfigurationInterpreter.getChoiceAttributes(configuration),
        RA.findFirst((d: ChoiceAttribute) => globalAttributeIdEquals(d.id, attributeId)),
        O.doIfNone(() => () => expect(false, "Could not find the specified attribute.").toBe(true)),
        O.chain((c: ChoiceAttribute) => pipe(c.values, RA.findFirst(v => v.id === choiceValueId))),
        O.match(
            () => expect(false, "Could not find the specified choice value").toBe(true),
            v => expect(v.decision, message).toEqual(expectedDecision)
        )
    );
}

export function expectPossibleChoiceDecisionStates(configuration: Configuration, attributeId: GlobalAttributeId, choiceValueId: string, possibleDecisionStates: ChoiceValueDecisionState[], message?: string) {
    pipe(
        ConfigurationInterpreter.getChoiceAttributes(configuration),
        RA.findFirst((d: ChoiceAttribute) => globalAttributeIdEquals(d.id, attributeId)),
        O.doIfNone(() => () => expect(false, "Could not find the specified attribute.").toBe(true)),
        O.chain((c: ChoiceAttribute) => pipe(c.values, RA.findFirst(v => v.id === choiceValueId))),
        O.match(
            () => expect(false, "Could not find the specified choice value").toBe(true),
            v => expect(v.possibleDecisionStates, message).toEqual(possibleDecisionStates)
        )
    );
}

export function expectComponent(configuration: Configuration, attributeId: GlobalAttributeId, expectedDecision: Decision<ComponentDecisionState> | null, message?: string) {
    pipe(
        ConfigurationInterpreter.getComponentAttributes(configuration),
        RA.findFirst((d: ComponentAttribute) => globalAttributeIdEquals(d.id, attributeId)),

        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect(c.decision, message).toStrictEqual(expectedDecision);
            })
    );
}

export function expectPossibleComponentDecisionStates(configuration: Configuration, attributeId: GlobalAttributeId, possibleDecisionStates: ComponentDecisionState[], message?: string) {
    pipe(ConfigurationInterpreter.getComponentAttributes(configuration),
        RA.findFirst(d => globalAttributeIdEquals(d.id, attributeId)),
        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect([...c.possibleDecisionStates].sort(), message).toStrictEqual(possibleDecisionStates.sort());
            })
    );
}

export function expectPossibleBooleanDecisionStates(configuration: Configuration, attributeId: GlobalAttributeId, possibleDecisionStates: boolean[], message?: string) {
    pipe(ConfigurationInterpreter.getBooleanAttributes(configuration),
        RA.findFirst(d => globalAttributeIdEquals(d.id, attributeId)),
        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect([...c.possibleDecisionStates].sort(), message).toStrictEqual(possibleDecisionStates.sort());
            })
    );
}

export function expectNumeric(configuration: Configuration, attributeId: GlobalAttributeId, expectedDecision: Decision<number> | null, message?: string) {
    pipe(
        ConfigurationInterpreter.getNumericAttributes(configuration),
        RA.findFirst((d: NumericAttribute) => globalAttributeIdEquals(d.id, attributeId)),

        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect(c.decision, message).toStrictEqual(expectedDecision);
            })
    );
}

export function expectBoolean(configuration: Configuration, attributeId: GlobalAttributeId, expectedDecision: Decision<boolean> | null, message?: string) {
    pipe(
        ConfigurationInterpreter.getBooleanAttributes(configuration),
        RA.findFirst((d: BooleanAttribute) => globalAttributeIdEquals(d.id, attributeId)),

        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect(c.decision, message).toStrictEqual(expectedDecision);
            })
    );
}

export function expectIsSatisfied(configuration: Configuration, attributeId: GlobalAttributeId, expected: boolean, message?: string) {
    pipe(
        configuration.attributes,
        RA.findFirst((d: Attribute) => globalAttributeIdEquals(d.id, attributeId)),

        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect(c.isSatisfied, message).toStrictEqual(expected);
            })
    );
}

export function expectCanContributeToConfigurationSatisfaction(configuration: Configuration, attributeId: GlobalAttributeId, expected: boolean, message?: string) {
    pipe(
        configuration.attributes,
        RA.findFirst((d: Attribute) => globalAttributeIdEquals(d.id, attributeId)),

        O.match(
            () => expect(false, "Could not find the specified attribute.").toBe(true),
            c => {
                expect(c.canContributeToConfigurationSatisfaction, message).toStrictEqual(expected);
            })
    );
}

export async function expectContractFailureResult<T>(operation: Promise<T> | (() => Promise<T>), failureType: FailureType | FailureResult): Promise<FailureResult> {
    const promise = match(operation)
        .with(P.instanceOf(Promise<T>), (v) => v)
        .with(P._, (v: () => Promise<T>) => v())
        .exhaustive();

    return await promise.then(() => {
        throw "Expected operation to throw, but it did not.";
    }).catch(e => {

        match(failureType)
            .with({
                type: P.string
            }, (f) => expect(e).toStrictEqual(f))
            .otherwise(f => expect(e.type).toStrictEqual(f));

        return e as FailureResult;
    });
}