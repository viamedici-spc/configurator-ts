import {ChoiceValue, ChoiceValueDecisionState} from "../Types";

export function isAllowed(choiceValue: ChoiceValue): boolean {
    return choiceValue.possibleDecisionStates.some(s =>
        s === ChoiceValueDecisionState.Included
    );
}

export function isBlocked(choiceValue: ChoiceValue): boolean {
    return !isAllowed(choiceValue);
}