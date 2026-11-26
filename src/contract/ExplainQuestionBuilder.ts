import type {
    ChoiceValueDecisionState,
    ChoiceValueId,
    ComponentDecisionState,
    GlobalAttributeId,
    WhyIsAttributeNotSatisfied,
    WhyIsBooleanStateNotPossible,
    WhyIsChoiceValueStateNotPossible,
    WhyIsComponentStateNotPossible,
    WhyIsConfigurationNotSatisfied,
    WhyIsNumericStateNotPossible,
} from "./Types";
import {ExplainQuestionSubject, ExplainQuestionType} from "./Types";

export type AttributeIdStage<TNext> = (attributeId: GlobalAttributeId) => TNext;

export type ChoiceValueIdStage<TNext> = {
    readonly choiceValue: (choiceValueId: ChoiceValueId) => TNext;
};

export type StateStage<TState, TNext> = {
    readonly state: (state: TState) => TNext;
};

export type ExplainQuestionBuilder = {
    readonly whyIsNotSatisfied: {
        readonly configuration: WhyIsConfigurationNotSatisfied;
        readonly attribute: AttributeIdStage<WhyIsAttributeNotSatisfied>;
    };
    readonly whyIsStateNotPossible: {
        readonly choice: AttributeIdStage<
            ChoiceValueIdStage<StateStage<ChoiceValueDecisionState, WhyIsChoiceValueStateNotPossible>>
        >;
        readonly numeric: AttributeIdStage<StateStage<number, WhyIsNumericStateNotPossible>>;
        readonly boolean: AttributeIdStage<StateStage<boolean, WhyIsBooleanStateNotPossible>>;
        readonly component: AttributeIdStage<StateStage<ComponentDecisionState, WhyIsComponentStateNotPossible>>;
    };
};

export const explainQuestionBuilder: ExplainQuestionBuilder = {
    whyIsNotSatisfied: {
        configuration: {
            question: ExplainQuestionType.whyIsNotSatisfied,
            subject: ExplainQuestionSubject.configuration,
        },
        attribute: attributeId => ({
            question: ExplainQuestionType.whyIsNotSatisfied,
            subject: ExplainQuestionSubject.attribute,
            attributeId: attributeId,
        }),
    },
    whyIsStateNotPossible: {
        choice: attributeId => ({
            choiceValue: choiceValueId => ({
                state: state => ({
                    question: ExplainQuestionType.whyIsStateNotPossible,
                    subject: ExplainQuestionSubject.choiceValue,
                    attributeId: attributeId,
                    choiceValueId: choiceValueId,
                    state: state,
                }),
            }),
        }),
        boolean: attributeId => ({
            state: state => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.boolean,
                attributeId: attributeId,
                state: state,
            }),
        }),
        numeric: attributeId => ({
            state: state => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.numeric,
                attributeId: attributeId,
                state: state,
            }),
        }),
        component: attributeId => ({
            state: state => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.component,
                attributeId: attributeId,
                state: state,
            }),
        }),
    },
};