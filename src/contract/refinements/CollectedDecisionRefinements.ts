import {Refinement} from "fp-ts/Refinement";
import {
    AttributeType,
    CollectedBooleanDecision,
    CollectedChoiceDecision,
    CollectedComponentDecision,
    CollectedDecision,
    CollectedNumericDecision,
    DecisionKind,
    CollectedExplicitDecision, CollectedImplicitDecision
} from "../Types";

export const collectedBooleanDecisionRefinement: Refinement<CollectedDecision, CollectedBooleanDecision> = (d): d is CollectedBooleanDecision => d.attributeType === AttributeType.Boolean;
export const collectedNumericDecisionRefinement: Refinement<CollectedDecision, CollectedNumericDecision> = (d): d is CollectedNumericDecision => d.attributeType === AttributeType.Numeric;
export const collectedComponentDecisionRefinement: Refinement<CollectedDecision, CollectedComponentDecision> = (d): d is CollectedComponentDecision => d.attributeType === AttributeType.Component;
export const collectedChoiceDecisionRefinement: Refinement<CollectedDecision, CollectedChoiceDecision> = (d): d is CollectedChoiceDecision => d.attributeType === AttributeType.Choice;

export const collectedExplicitDecisionRefinement: Refinement<CollectedDecision, CollectedExplicitDecision> = (d): d is CollectedExplicitDecision => d.kind === DecisionKind.Explicit;
export const collectedImplicitDecisionRefinement: Refinement<CollectedDecision, CollectedImplicitDecision> = (d): d is CollectedImplicitDecision => d.kind === DecisionKind.Implicit;