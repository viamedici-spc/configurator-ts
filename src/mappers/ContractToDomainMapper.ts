import * as Domain from "../domain/Model";
import * as Contract from "../contract/Types";
import {ChoiceAttribute} from "../contract/Types";
import {O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {match, P} from "ts-pattern";
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord";

export interface IContractToDomainMapper {
    mapToAttributeDecisions(decisions: ReadonlyArray<Contract.ExplicitDecision>): ReadonlyArray<Domain.AttributeDecision>;

    mapToAttributeDecision(decision: Contract.ExplicitDecision): Domain.AttributeDecision;

    mapToMode(mode: Contract.SetManyMode): Domain.SetManyMode;

    mapToConfiguration(configuration: Contract.Configuration): Domain.Configuration;

    mapToSolution(solution: Contract.ExplainSolution): Domain.ExplainSolution;

    mapToDecisionsToRespect(decisionsToRespect?: Contract.AttributeRelations | null | undefined): O.Option<Domain.AttributeRelations>;

    mapToSessionContext(sessionContext: Contract.SessionContext): Domain.ConfigurationSessionContext;

    mapToExplainQuestion(explainQuestion: Contract.ExplainQuestion, answerType: "decisions" | "constraints" | "full"): Domain.ExplainQuestion;
}

export default class ContractToDomainMapper implements IContractToDomainMapper {
    mapToExplainQuestion(explainQuestion: Contract.ExplainQuestion, answerType: "decisions" | "constraints" | "full"): Domain.ExplainQuestion {
        const common = {
            answerType: match(answerType)
                .with("decisions", () => Domain.ExplainAnswerType.decisions)
                .with("constraints", () => Domain.ExplainAnswerType.constraints)
                .with("full", () => Domain.ExplainAnswerType.all)
                .exhaustive()
        };

        return match(explainQuestion)
            .with({
                question: Contract.ExplainQuestionType.whyIsNotSatisfied,
                subject: Contract.ExplainQuestionSubject.configuration
            }, (v): Domain.WhyIsConfigurationNotSatisfied => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsNotSatisfied,
                    subject: Domain.ExplainQuestionSubject.configuration
                };
            })
            .with({
                question: Contract.ExplainQuestionType.whyIsNotSatisfied,
                subject: Contract.ExplainQuestionSubject.attribute
            }, (v): Domain.WhyIsAttributeNotSatisfied => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsNotSatisfied,
                    subject: Domain.ExplainQuestionSubject.attribute,
                    attributeId: this.mapToGlobalAttributeId(v.attributeId)
                };
            })

            .with({
                question: Contract.ExplainQuestionType.whyIsStateNotPossible,
                subject: Contract.ExplainQuestionSubject.choiceValue
            }, (v): Domain.WhyIsChoiceValueStateNotPossible => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                    subject: Domain.ExplainQuestionSubject.choiceValue,
                    attributeId: this.mapToGlobalAttributeId(v.attributeId),
                    choiceValueId: v.choiceValueId,
                    state: this.mapToDecisionState(v.state)
                };
            })
            .with({
                question: Contract.ExplainQuestionType.whyIsStateNotPossible,
                subject: Contract.ExplainQuestionSubject.component
            }, (v): Domain.WhyIsComponentStateNotPossible => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                    subject: Domain.ExplainQuestionSubject.component,
                    attributeId: this.mapToGlobalAttributeId(v.attributeId),
                    state: this.mapToDecisionState(v.state)
                };
            })
            .with({
                question: Contract.ExplainQuestionType.whyIsStateNotPossible,
                subject: Contract.ExplainQuestionSubject.numeric
            }, (v): Domain.WhyIsNumericStateNotPossible => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                    subject: Domain.ExplainQuestionSubject.numeric,
                    attributeId: this.mapToGlobalAttributeId(v.attributeId),
                    state: v.state
                };
            })
            .with({
                question: Contract.ExplainQuestionType.whyIsStateNotPossible,
                subject: Contract.ExplainQuestionSubject.boolean
            }, (v): Domain.WhyIsBooleanStateNotPossible => {
                return {
                    ...common,
                    question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                    subject: Domain.ExplainQuestionSubject.boolean,
                    attributeId: this.mapToGlobalAttributeId(v.attributeId),
                    state: v.state
                };
            })

            .exhaustive();
    }

    public mapToConfiguration(configuration: Contract.Configuration): Domain.Configuration {
        return {
            isSatisfied: configuration.isSatisfied,
            attributes: pipe(configuration.attributes,
                RA.map(a => this.mapToAttribute(a))
            )
        };
    }

    public mapToAttributeDecisions(decisions: ReadonlyArray<Contract.ExplicitDecision>): ReadonlyArray<Domain.AttributeDecision> {
        return pipe(
            decisions,
            RA.map(d => this.mapToAttributeDecision(d))
        );
    }

    public mapToSessionContext(sessionContext: Contract.SessionContext): Domain.ConfigurationSessionContext {
        return {
            configurationModelSource: this.mapToConfigurationModelSource(sessionContext.configurationModelSource),
            decisionsToRespect: this.mapToDecisionsToRespect(sessionContext.attributeRelations),
            usageRuleParameters: this.mapToUsageRuleParameters(sessionContext.usageRuleParameters)
        };
    }

    public mapToAttributeDecision(decision: Contract.ExplicitDecision): Domain.AttributeDecision {
        return match(decision)

            .with({
                type: Contract.AttributeType.Choice,
                choiceValueId: P.string
            }, (decision: Contract.ExplicitChoiceDecision): Domain.ChoiceValueAttributeDecision => {
                return ({
                    type: Domain.DecisionType.ChoiceValue,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    choiceValueId: decision.choiceValueId,
                    state: this.mapToDecisionStateOption(decision.state)
                });
            })

            .with({
                type: Contract.AttributeType.Numeric
            }, (decision: Contract.ExplicitNumericDecision): Domain.NumericAttributeDecision => ({
                type: Domain.DecisionType.Numeric,
                attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                value: O.fromNullable(decision.state)
            }))

            .with({
                type: Contract.AttributeType.Boolean
            }, (decision: Contract.ExplicitBooleanDecision): Domain.BooleanAttributeDecision => ({
                type: Domain.DecisionType.Boolean,
                attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                value: O.fromNullable(decision.state)
            }))

            .with({
                type: Contract.AttributeType.Component
            }, (decision: Contract.ExplicitComponentDecision): Domain.ComponentAttributeDecision =>
                ({
                    type: Domain.DecisionType.Component,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    state: pipe(O.fromNullable(decision.state), O.chain(state => this.mapToDecisionStateOption(state)))
                }))

            .exhaustive();
    }

    public mapToDecisionsToRespect(decisionsToRespect?: Contract.AttributeRelations | null | undefined): O.Option<Domain.AttributeRelations> {

        return pipe(
            O.fromNullable(decisionsToRespect),
            O.map(v =>
                pipe(v, RA.map((i): Domain.DecisionsToRespect => ({
                    attributeId: this.mapToGlobalAttributeId(i.attributeId),
                    decisions: pipe(i.decisions, RA.map(d => this.mapToGlobalAttributeId(d)))
                })))
            )
        );
    }

    public mapToMode(mode: Contract.SetManyMode): Domain.SetManyMode {
        return match(mode)
            .with({type: "Default"}, (): Domain.SetManyDefaultMode => ({
                type: "Default"
            }))
            .with({type: "KeepExistingDecisions"}, (): Domain.SetManyKeepExistingDecisionsMode => ({
                type: "KeepExistingDecisions"
            }))
            .with({type: "DropExistingDecisions"}, (v): Domain.SetManyDropExistingDecisionsMode => ({
                type: "DropExistingDecisions",
                conflictHandling: this.mapToConflictHandling(v.conflictHandling)
            }))
            .exhaustive();
    }

    private mapToConflictHandling(conflictHandling: Contract.ConflictResolution): Domain.ConflictResolution {
        return match(conflictHandling)
            .with({type: "Manual"}, (v): Domain.ManualConflictResolution => {
                return {
                    type: "Manual",
                    includeConstraintsInConflictExplanation: v.includeConstraintsInConflictExplanation
                };
            })
            .with({type: "Automatic"}, (v): Domain.AutomaticConflictResolution => ({
                type: "Automatic"
            }))
            .exhaustive();
    }

    private mapToGlobalAttributeId(attributeId: Contract.GlobalAttributeId): Domain.GlobalAttributeId {
        return {
            localId: attributeId.localId,
            componentPath: attributeId.componentPath ?? [],
            sharedConfigurationModel: attributeId.sharedConfigurationModelId
        };
    }

    private mapToConfigurationModelSource(configurationModelSource: Contract.ConfigurationModelSource): Domain.ConfigurationModelSource {
        return match(configurationModelSource)
            .with({type: Contract.ConfigurationModelSourceType.Package}, (v): Domain.ConfigurationModelSource => ({
                type: Domain.ConfigurationModelSourceType.Package,
                configurationModelPackage: v.configurationModelPackage
            }))
            .with({type: Contract.ConfigurationModelSourceType.Channel}, (v): Domain.ConfigurationModelSource => ({
                type: Domain.ConfigurationModelSourceType.Channel,
                deploymentName: v.deploymentName,
                channel: v.channel
            }))
            .exhaustive();
    }

    public mapToSolution(solution: Contract.ExplainSolution): Domain.ExplainSolution {
        return {
            decisions: pipe(solution.decisions,
                RA.map(d => this.mapToAttributeDecision(d))
            ),
            mode: this.mapToMode(solution.mode)
        };
    }

    private mapToAttribute(attribute: Contract.Attribute): Domain.Attribute {
        return match(attribute)
            .with({type: Contract.AttributeType.Boolean}, (v): Domain.BooleanAttribute => ({
                type: Domain.AttributeType.Boolean,
                attributeId: this.mapToGlobalAttributeId(v.id),
                isSatisfied: v.isSatisfied,
                possibleDecisionStates: v.possibleDecisionStates,
                selection: this.mapToSelection(v.selection),
                decision: pipe(v.decision, O.fromNullable,
                    O.map(d => ({
                        kind: this.mapToDecisionKind(d.kind),
                        state: d.state
                    }))
                ),
                canContributeToConfigurationSatisfaction: v.canContributeToConfigurationSatisfaction
            }))
            .with({type: Contract.AttributeType.Numeric}, (v): Domain.NumericAttribute => ({
                type: Domain.AttributeType.Numeric,
                attributeId: this.mapToGlobalAttributeId(v.id),
                isSatisfied: v.isSatisfied,
                range: {
                    min: v.range.min,
                    max: v.range.max
                },
                decimalPlaces: v.decimalPlaces,
                selection: this.mapToSelection(v.selection),
                decision: pipe(v.decision, O.fromNullable,
                    O.map(d => ({
                        kind: this.mapToDecisionKind(d.kind),
                        state: d.state
                    }))
                ),
                canContributeToConfigurationSatisfaction: v.canContributeToConfigurationSatisfaction
            }))
            .with({type: Contract.AttributeType.Choice}, (v: ChoiceAttribute): Domain.ChoiceAttribute => ({
                type: Domain.AttributeType.Choice,
                attributeId: this.mapToGlobalAttributeId(v.id),
                isSatisfied: v.isSatisfied,
                cardinality: {
                    lowerBound: v.cardinality.lowerBound,
                    upperBound: v.cardinality.upperBound
                },
                values: pipe(v.values, RA.map(cv => this.mapToChoiceValue(cv))),
                canContributeToConfigurationSatisfaction: v.canContributeToConfigurationSatisfaction
            }))

            .with({type: Contract.AttributeType.Component}, (v: Contract.ComponentAttribute): Domain.ComponentAttribute => ({
                type: Domain.AttributeType.Component,
                attributeId: this.mapToGlobalAttributeId(v.id),
                isSatisfied: v.isSatisfied,
                decision: pipe(v.decision, O.fromNullable,
                    O.chain(d =>
                        pipe(
                            this.mapToDecisionStateOption(d.state),
                            O.map((state): Domain.Decision<Domain.DecisionState> =>
                                ({
                                    kind: this.mapToDecisionKind(d.kind),
                                    state: state
                                }))
                        )
                    )
                ),
                possibleDecisionStates: pipe(v.possibleDecisionStates, RA.map(pds => this.mapToDecisionStateOption(pds)), RA.compact),
                selection: pipe(v.selection, O.fromNullable, O.map(s => this.mapToSelection(s)), O.toUndefined),
                inclusion: this.mapToInclusion(v.inclusion),
                canContributeToConfigurationSatisfaction: v.canContributeToConfigurationSatisfaction
            }))
            .exhaustive();
    }

    private mapToChoiceValue(choiceValue: Contract.ChoiceValue): Domain.ChoiceValue {
        return {
            choiceValueId: choiceValue.id,
            decision: this.mapToChoiceValueDecision(choiceValue),
            possibleDecisionStates: pipe(choiceValue.possibleDecisionStates, RA.map(pds => this.mapToDecisionStateOption(pds)), RA.compact)
        };
    }

    private mapToChoiceValueDecision(choiceValue: Contract.ChoiceValue): O.Option<Domain.Decision<Domain.DecisionState>> {
        return pipe(choiceValue.decision, O.fromNullable,
            O.chain((decision) =>
                pipe(
                    this.mapToDecisionStateOption(decision.state), O.map((state): Domain.Decision<Domain.DecisionState> =>
                        ({
                            state: state,
                            kind: this.mapToDecisionKind(decision.kind)
                        }))
                )
            )
        );
    }

    private mapToDecisionKind(decisionKind: Contract.DecisionKind): Domain.DecisionKind {
        return match(decisionKind)
            .with(Contract.DecisionKind.Implicit, () => Domain.DecisionKind.Implicit)
            .with(Contract.DecisionKind.Explicit, () => Domain.DecisionKind.Explicit)
            .exhaustive();
    }

    private mapToSelection(decisionKind: Contract.Selection): Domain.Selection {
        return match(decisionKind)
            .with(Contract.Selection.Mandatory, () => Domain.Selection.Mandatory)
            .with(Contract.Selection.Optional, () => Domain.Selection.Optional)
            .exhaustive();
    }

    private mapToInclusion(decisionKind: Contract.Inclusion): Domain.Inclusion {
        return match(decisionKind)
            .with(Contract.Inclusion.Always, () => Domain.Inclusion.Always)
            .with(Contract.Inclusion.Optional, () => Domain.Inclusion.Optional)
            .exhaustive();
    }

    private mapToDecisionState(decisionState: Contract.ComponentDecisionState | Contract.ChoiceValueDecisionState): Domain.DecisionState {
        return match(decisionState)
            .with(P.union(Contract.ChoiceValueDecisionState.Included, Contract.ComponentDecisionState.Included), () => Domain.DecisionState.Included)
            .with(P.union(Contract.ChoiceValueDecisionState.Excluded, Contract.ComponentDecisionState.Excluded), () => Domain.DecisionState.Excluded)
            .exhaustive();
    }

    private mapToDecisionStateOption(decisionState: Contract.ComponentDecisionState | Contract.ChoiceValueDecisionState | null | undefined): O.Option<Domain.DecisionState> {
        return pipe(O.fromNullable(decisionState), O.map(s => this.mapToDecisionState(s)));
    }

    private mapToUsageRuleParameters(usageRuleParameters?: Record<string, string> | null): ReadonlyRecord<string, string> {
        return usageRuleParameters ?? {};
    }
}