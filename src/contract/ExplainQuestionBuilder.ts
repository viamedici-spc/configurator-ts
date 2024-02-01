import {
    ChoiceValueDecisionState,
    ChoiceValueId,
    ComponentDecisionState,
    ExplainQuestionSubject,
    ExplainQuestionType,
    GlobalAttributeId, WhyIsAttributeNotSatisfied, WhyIsBooleanStateNotPossible, WhyIsChoiceValueStateNotPossible,
    WhyIsComponentStateNotPossible, WhyIsConfigurationNotSatisfied, WhyIsNumericStateNotPossible
} from "./Types";

export type AttributeIdStage<TNext> = (attributeId: GlobalAttributeId) => TNext

export type ChoiceValueIdStage<TNext> = {
    choiceValue: (choiceValueId: ChoiceValueId) => TNext
}

export type StateStage<TState, TNext> = {
    state: (state: TState) => TNext
}

export type ExplainQuestionBuilder = {
    whyIsNotSatisfied: {
        configuration: WhyIsConfigurationNotSatisfied,
        attribute: AttributeIdStage<WhyIsAttributeNotSatisfied>
    },
    whyIsStateNotPossible: {
        choice: AttributeIdStage<ChoiceValueIdStage<StateStage<ChoiceValueDecisionState, WhyIsChoiceValueStateNotPossible>>>,
        numeric: AttributeIdStage<StateStage<number, WhyIsNumericStateNotPossible>>,
        boolean: AttributeIdStage<StateStage<boolean, WhyIsBooleanStateNotPossible>>,
        component: AttributeIdStage<StateStage<ComponentDecisionState, WhyIsComponentStateNotPossible>>
    }
};

export const explainQuestionBuilder: ExplainQuestionBuilder = {
    whyIsNotSatisfied: {
        configuration: {
            question: ExplainQuestionType.whyIsNotSatisfied,
            subject: ExplainQuestionSubject.configuration
        },
        attribute: (attributeId) => ({
            question: ExplainQuestionType.whyIsNotSatisfied,
            subject: ExplainQuestionSubject.attribute,
            attributeId: attributeId
        })
    },
    whyIsStateNotPossible: {
        choice: (attributeId) => ({
            choiceValue: (choiceValueId) => ({
                state: (state) => ({
                    question: ExplainQuestionType.whyIsStateNotPossible,
                    subject: ExplainQuestionSubject.choiceValue,
                    attributeId: attributeId,
                    choiceValueId: choiceValueId,
                    state: state
                })
            })
        }),
        boolean: (attributeId) => ({
            state: (state) => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.boolean,
                attributeId: attributeId,
                state: state
            })
        }),
        numeric: (attributeId) => ({
            state: (state) => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.numeric,
                attributeId: attributeId,
                state: state
            })
        }),
        component: (attributeId) => ({
            state: (state) => ({
                question: ExplainQuestionType.whyIsStateNotPossible,
                subject: ExplainQuestionSubject.component,
                attributeId: attributeId,
                state: state
            })
        })
    }
};