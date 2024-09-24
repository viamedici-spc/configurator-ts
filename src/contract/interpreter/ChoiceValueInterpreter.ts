import {ChoiceValue, ChoiceValueDecisionState} from "../Types";

export function isAllowed(choiceValue: ChoiceValue): boolean {
    return choiceValue.possibleDecisionStates.includes(ChoiceValueDecisionState.Included);
}

export function isBlocked(choiceValue: ChoiceValue): boolean {
    return !isAllowed(choiceValue);
}