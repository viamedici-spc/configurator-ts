import {flow, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import * as Domain from "../domain/Model";
import * as Contract from "../contract/Types";
import {CausedByDecision, ChoiceValueDecisionState, ComponentDecisionState, Decision} from "../contract/Types";
import {match, P} from "ts-pattern";
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord";
import {ConfigurationConflictReason, FailureResult, FailureResultFactory, FailureType} from "../contract/Results";

export interface IDomainToContractMapper {

    mapToConfiguration(configuration: Domain.Configuration): Contract.Configuration;

    mapToFailureResult(failureResult: Domain.FailureResult): FailureResult;

    mapToSessionContext(configuration: Domain.ConfigurationSessionContext): Contract.SessionContext;

    mapToExplainAnswer(explainAnswer: Domain.ExplainAnswer): Contract.ExplainAnswer;
}

export default class DomainToContractMapper implements IDomainToContractMapper {
    public mapToExplainAnswer(explainAnswer: Domain.ExplainAnswer): Contract.ExplainAnswer {
        const d = match(explainAnswer)
            .with({
                decisionExplanations: P.array(P.any),
            }, (v) => {
                return pipe(v.decisionExplanations, RA.map(e => this.mapToDecisionExplanation(e)));
            })
            .otherwise(() => []);

        const c = match(explainAnswer)
            .with({
                constraintExplanations: P.array(P.any),
            }, (v) => {
                return pipe(v.constraintExplanations, RA.map(e => this.mapToConstraintExplanation(e)));
            })
            .otherwise(() => []);

        return {
            decisionExplanations: d,
            constraintExplanations: c
        };
    }

    private mapToConstraintExplanation(constraintExplanation: Domain.ConstraintExplanation): Contract.ConstraintExplanation {
        return {
            causedByCardinalities: pipe(constraintExplanation.causedByCardinalities, RA.map(c => {
                return this.mapToGlobalAttributeId(c.attributeId);
            })),
            causedByRules: pipe(constraintExplanation.causedByRules, RA.map(r => {
                return this.mapToGlobalConstraintId(r.ruleId);
            }))
        };
    }

    private mapToDecisionExplanation(decisionExplanation: Domain.DecisionExplanation): Contract.DecisionExplanation {
        const d: ReadonlyArray<CausedByDecision> = pipe(decisionExplanation.causedByChoiceDecisions, RA.map(d => this.mapToCausedByChoiceAttributeDecision(d)));
        const c: ReadonlyArray<CausedByDecision> = pipe(decisionExplanation.causedByComponentDecisions, RA.map(c => this.mapToCausedByComponentAttributeDecision(c)));
        const n: ReadonlyArray<CausedByDecision> = pipe(decisionExplanation.causedByNumericDecisions, RA.map(n => this.mapToCausedByNumericAttributeDecision(n)));
        const b: ReadonlyArray<CausedByDecision> = pipe(decisionExplanation.causedByBooleanDecisions, RA.map(b => this.mapToCausedByBooleanAttributeDecision(b)));

        return {
            causedByDecisions: pipe([],
                RA.concat(d),
                RA.concat(c),
                RA.concat(n),
                RA.concat(b),
            ),
            solution: this.mapToSolution(decisionExplanation.solution)
        };
    }

    private mapToSolution(solution: Domain.ExplainSolution): Contract.ExplainSolution {
        return {
            decisions: pipe(solution.decisions, RA.map(d => this.mapToExplicitDecision(d))),
            mode: this.mapToMode(solution.mode)
        };
    }

    public mapToMode(mode: Domain.SetManyMode): Contract.SetManyMode {
        return match(mode)
            .with({type: "DropExistingDecisions"}, (v): Contract.SetManyDropExistingDecisionsMode => ({
                type: "DropExistingDecisions",
                conflictHandling: this.mapToConflictHandling(v.conflictHandling)
            }))
            .otherwise((): Contract.SetManyDefaultMode => ({
                type: "Default"
            }));
    }

    private mapToConflictHandling(conflictHandling: Domain.ConflictResolution): Contract.ConflictResolution {
        return match(conflictHandling)
            .with({ type: "Manual" }, (v): Contract.ManualConflictResolution => {
                return {
                    type: "Manual",
                    includeConstraintsInConflictExplanation: v.includeConstraintsInConflictExplanation
                }
            })
            .with({ type: "Automatic" }, (v): Contract.AutomaticConflictResolution => ({
                type: "Automatic"
            }))
            .exhaustive();
    }

    public mapToSessionContext(sessionContext: Domain.ConfigurationSessionContext): Contract.SessionContext {
        return {
            configurationModelSource: this.mapToConfigurationModelSource(sessionContext.configurationModelSource),
            attributeRelations: this.mapToDecisionsToRespect(sessionContext.decisionsToRespect),
            usageRuleParameters: this.mapToUsageRuleParameters(sessionContext.usageRuleParameters)
        };
    }

    public mapToFailureResult(failureResult: Domain.FailureResult): FailureResult {

        return match(failureResult)

            .with({type: Domain.FailureType.ConfigurationConflict}, (v: Domain.ConfigurationConflict): FailureResult => ({
                type: FailureType.ConfigurationConflict,
                reason: match(v.reason)
                    .with(Domain.ConfigurationConflictReason.NumericDecisionOutOfRange, () => ConfigurationConflictReason.NumericDecisionOutOfRange)
                    .otherwise(() => undefined)
            }))
            .with({type: Domain.FailureType.ConfigurationApplicationError}, (): FailureResult => ({
                type: FailureType.ConfigurationApplicationError
            }))
            .with({type: Domain.FailureType.ConfigurationUnauthenticated}, (): FailureResult => ({
                type: FailureType.ConfigurationUnauthenticated
            }))
            .with({type: Domain.FailureType.ConfigurationModelNotFound}, (): FailureResult => ({
                type: FailureType.ConfigurationModelNotFound
            }))
            .with({type: Domain.FailureType.ConfigurationTimeout}, (): FailureResult => ({
                type: FailureType.ConfigurationTimeout
            }))

            .with({type: Domain.FailureType.ConfigurationAttributeNotFound}, (): FailureResult => ({
                type: FailureType.ConfigurationAttributeNotFound
            }))
            .with({type: Domain.FailureType.ConfigurationChoiceValueNotFound}, (): FailureResult => ({
                type: FailureType.ConfigurationChoiceValueNotFound
            }))
            .with({type: Domain.FailureType.ConfigurationSolutionNotAvailable}, (): FailureResult => ({
                type: FailureType.ConfigurationSolutionNotAvailable
            }))
            .with({type: Domain.FailureType.ConfigurationRejectedDecisionsConflict}, (v: Domain.ConfigurationRejectedDecisionsConflict) => {
                const rejectedDecisions: ReadonlyArray<Contract.ExplicitDecision> = pipe(v.rejectedDecisions, RA.map(d => this.mapToExplicitDecision(d)));

                return FailureResultFactory.createConfigurationRejectedDecisionsConflict(rejectedDecisions);
            })

            .with({type: Domain.FailureType.DecisionsToRespectInvalid}, (): FailureResult => ({
                type: FailureType.DecisionsToRespectInvalid
            }))
            .with({type: Domain.FailureType.ServiceError}, (): FailureResult => ({
                type: FailureType.ServiceError
            }))
            .with({type: Domain.FailureType.CommunicationError}, (): FailureResult => ({
                type: FailureType.CommunicationError
            }))

            .with({type: Domain.FailureType.Unknown}, (): FailureResult => ({
                type: FailureType.Unknown
            }))

            .with({type: Domain.FailureType.ConfigurationModelInvalid}, (): FailureResult => ({
                type: FailureType.ConfigurationModelInvalid
            }))

            .with({type: Domain.FailureType.ConfigurationInitializationFailure}, (): FailureResult => ({
                type: FailureType.ConfigurationInitializationFailure
            }))

            .with({type: Domain.FailureType.ConfigurationModelNotFeasible}, (f): FailureResult => ({
                type: FailureType.ConfigurationModelNotFeasible,
                constraintExplanations: pipe(f.constraintExplanations, RA.map(c => this.mapToConstraintExplanation(c)))
            }))

            .with({type: Domain.FailureType.ConfigurationSetManyConflict}, (f): FailureResult => ({
                type: FailureType.ConfigurationSetManyConflict,
                decisionExplanations: pipe(f.decisionExplanations, RA.map(d => this.mapToDecisionExplanation(d))),
                constraintExplanations: pipe(f.constraintExplanations, RA.map(c => this.mapToConstraintExplanation(c)))
            }))
            .exhaustive();
    }

    public mapToConfiguration(configuration: Domain.Configuration): Contract.Configuration {
        return {
            isSatisfied: configuration.isSatisfied,
            attributes: pipe(configuration.attributes, RA.map(a => this.mapToAttribute(a)))
        };
    }

    private mapToDecisionsToRespect(decisionsToRespect: O.Option<Domain.AttributeRelations>): Contract.AttributeRelations | undefined {
        return pipe(
            decisionsToRespect,
            O.map(flow(RA.map((decisionsToRespect): Contract.DecisionsToRespect => ({
                attributeId: this.mapToGlobalAttributeId(decisionsToRespect.attributeId),
                decisions: pipe(
                    decisionsToRespect.decisions,
                    RA.map(decisionToRespect => this.mapToGlobalAttributeId(decisionToRespect))
                )
            })))),
            O.toUndefined
        );
    }

    private mapToGlobalAttributeId(attributeId: Domain.GlobalAttributeId): Contract.GlobalAttributeId {
        return {
            localId: attributeId.localId,
            sharedConfigurationModelId: attributeId.sharedConfigurationModel,
            componentPath: [...attributeId.componentPath ?? []]
        };
    }

    private mapToGlobalConstraintId(constraintId: Domain.GlobalConstraintId): Contract.GlobalConstraintId {
        return {
            localId: constraintId.localId,
            configurationModelId: constraintId.configurationModelId
        };
    }

    private mapToConfigurationModelSource(configurationModelSource: Domain.ConfigurationModelSource): Contract.ConfigurationModelSource {
        return match(configurationModelSource)
            .with({type: Domain.ConfigurationModelSourceType.Package}, (v): Contract.ConfigurationModelSource => ({
                type: Contract.ConfigurationModelSourceType.Package,
                configurationModelPackage: v.configurationModelPackage
            }))
            .with({type: Domain.ConfigurationModelSourceType.Channel}, (v): Contract.ConfigurationModelSource => ({
                type: Contract.ConfigurationModelSourceType.Channel,
                deploymentName: v.deploymentName,
                channel: v.channel
            }))
            .exhaustive();
    }

    private mapToExplicitDecision(attributeDecision: Domain.AttributeDecision): Contract.ExplicitDecision {
        return match(attributeDecision)
            .with({
                type: Domain.DecisionType.ChoiceValue
            }, (v: Domain.ChoiceValueAttributeDecision): Contract.ExplicitChoiceDecision => ({
                type: Contract.AttributeType.Choice,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.state, O.map(s => this.mapToChoiceValueDecisionState(s)), O.toUndefined),
                choiceValueId: v.choiceValueId
            }))
            .with({
                type: Domain.DecisionType.Component
            }, (v: Domain.ComponentAttributeDecision): Contract.ExplicitComponentDecision => ({
                type: Contract.AttributeType.Component,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.state, O.map(s => this.mapToComponentDecisionState(s)), O.toUndefined)
            }))
            .with({
                type: Domain.DecisionType.Numeric
            }, (v: Domain.NumericAttributeDecision): Contract.ExplicitNumericDecision => ({
                type: Contract.AttributeType.Numeric,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.value, O.toUndefined)
            }))
            .with({
                type: Domain.DecisionType.Boolean
            }, (v: Domain.BooleanAttributeDecision): Contract.ExplicitBooleanDecision => ({
                type: Contract.AttributeType.Boolean,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.value, O.toUndefined)
            }))
            .exhaustive();
    }

    private mapToCardinality(type: Domain.ConstraintType) {
        return match(type)
            .with(Domain.ConstraintType.Cardinality, () => Contract.ConstraintType.Cardinality)
            .with(Domain.ConstraintType.Component, () => Contract.ConstraintType.Component)
            .with(Domain.ConstraintType.Rule, () => Contract.ConstraintType.Rule)
            .exhaustive();
    }

    private mapToCausedByAttributeDecision(causedBy: Domain.CausedByDecision): Contract.CausedByDecision {
        return match(causedBy)
            .with({type: Domain.DecisionType.ChoiceValue}, (v): Contract.CausedByDecision => this.mapToCausedByChoiceAttributeDecision(v))
            .with({type: Domain.DecisionType.Numeric}, (v): Contract.CausedByDecision => this.mapToCausedByNumericAttributeDecision(v))
            .with({type: Domain.DecisionType.Boolean}, (v): Contract.CausedByDecision => this.mapToCausedByBooleanAttributeDecision(v))
            .with({type: Domain.DecisionType.Component}, (v): Contract.CausedByDecision => this.mapToCausedByComponentAttributeDecision(v))
            .exhaustive();
    }

    private mapToCausedByChoiceAttributeDecision(causedBy: Domain.CausedByChoiceValueDecision): Contract.CausedByChoiceValueDecision {
        return {
            type: Contract.AttributeType.Choice,
            attributeId: this.mapToGlobalAttributeId(causedBy.attributeId),
            choiceValueId: causedBy.choiceValueId,
            state: this.mapToChoiceValueDecisionState(causedBy.state)
        };
    }

    private mapToCausedByNumericAttributeDecision(causedBy: Domain.CausedByNumericDecision): Contract.CausedByNumericDecision {
        return {
            type: Contract.AttributeType.Numeric,
            attributeId: this.mapToGlobalAttributeId(causedBy.attributeId),
            state: causedBy.state
        };
    }

    private mapToCausedByBooleanAttributeDecision(causedBy: Domain.CausedByBooleanDecision): Contract.CausedByBooleanDecision {
        return {
            type: Contract.AttributeType.Boolean,
            attributeId: this.mapToGlobalAttributeId(causedBy.attributeId),
            state: causedBy.state
        };
    }

    private mapToCausedByComponentAttributeDecision(causedBy: Domain.CausedByComponentDecision): Contract.CausedByComponentDecision {
        return {
            type: Contract.AttributeType.Component,
            attributeId: this.mapToGlobalAttributeId(causedBy.attributeId),
            state: this.mapToComponentDecisionState(causedBy.state)
        };
    }

    private mapToSelection(selection: Domain.Selection): Contract.Selection {
        return match(selection)
            .with(Domain.Selection.Mandatory, () => Contract.Selection.Mandatory)
            .with(Domain.Selection.Optional, () => Contract.Selection.Optional)
            .exhaustive();
    }

    private mapToAttribute(attribute: Domain.Attribute): Contract.Attribute {

        const common = {
            id: this.mapToGlobalAttributeId(attribute.attributeId),
            isSatisfied: attribute.isSatisfied,
            canContributeToConfigurationSatisfaction: attribute.canContributeToConfigurationSatisfaction
        };

        return match(attribute)
            .with({
                type: Domain.AttributeType.Boolean
            }, (v: Domain.BooleanAttribute): Contract.BooleanAttribute => ({
                ...common,
                type: Contract.AttributeType.Boolean,
                decision: pipe(v.decision, O.map((s): Decision<boolean> => ({
                    state: s.state,
                    kind: this.mapToDecisionKind(s.kind)
                })), O.toNullable),
                selection: this.mapToSelection(v.selection),
                possibleDecisionStates: v.possibleDecisionStates,

            }))
            .with({
                type: Domain.AttributeType.Numeric
            }, (v: Domain.NumericAttribute): Contract.NumericAttribute => ({
                ...common,
                type: Contract.AttributeType.Numeric,
                decision: pipe(v.decision, O.map((s): Decision<number> => ({
                    state: s.state,
                    kind: this.mapToDecisionKind(s.kind)
                })), O.toNullable),
                range: v.range,
                decimalPlaces: v.decimalPlaces,
                selection: this.mapToSelection(v.selection)
            }))
            .with({type: Domain.AttributeType.Choice}, (v: Domain.ChoiceAttribute): Contract.ChoiceAttribute => ({
                ...common,
                type: Contract.AttributeType.Choice,
                cardinality: v.cardinality,
                values: pipe(v.values, RA.map((acv): Contract.ChoiceValue => {
                    const decision = pipe(
                        acv.decision,
                        O.map((d): Contract.Decision<ChoiceValueDecisionState> => ({
                            state: this.mapToChoiceValueDecisionState(d.state),
                            kind: this.mapToDecisionKind(d.kind)
                        })),
                        O.toNullable
                    );

                    return {
                        id: acv.choiceValueId,
                        possibleDecisionStates: pipe(acv.possibleDecisionStates, RA.map(pds => this.mapToChoiceValueDecisionState(pds))),
                        decision: decision
                    };
                })),
            }))
            .with({type: Domain.AttributeType.Component}, (v: Domain.ComponentAttribute): Contract.ComponentAttribute => ({
                ...common,
                type: Contract.AttributeType.Component,
                // state: pipe(v.decision, O.map(d => this.mapToComponentDecisionState(d.state)), O.getOrElse((): Contract.ComponentDecisionState => Contract.ComponentDecisionState.Undefined)),
                // kind: pipe(v.decision, O.map((d) => this.mapToDecisionKind(d.kind)), O.getOrElse((): Contract.DecisionKind => Contract.DecisionKind.Explicit)),
                decision: pipe(v.decision, O.map((d): Contract.Decision<ComponentDecisionState> => ({
                    state: this.mapToComponentDecisionState(d.state),
                    kind: this.mapToDecisionKind(d.kind)
                })), O.toNullable),
                possibleDecisionStates: pipe(v.possibleDecisionStates, RA.map(pds => this.mapToComponentDecisionState(pds))),
                selection: pipe(v.selection, O.fromNullable, O.map(s => this.mapToSelection(s)), O.toUndefined),
                inclusion: this.mapToInclusion(v.inclusion),
            }))
            .exhaustive();
    }

    private mapToInclusion(inclusion: Domain.Inclusion): Contract.Inclusion {
        return match(inclusion)
            .with(Domain.Inclusion.Always, () => Contract.Inclusion.Always)
            .with(Domain.Inclusion.Optional, () => Contract.Inclusion.Optional)
            .exhaustive();
    }

    private mapToComponentDecisionState(state: Domain.DecisionState): Contract.ComponentDecisionState {
        return match(state)
            .with(Domain.DecisionState.Included, () => Contract.ComponentDecisionState.Included)
            .with(Domain.DecisionState.Excluded, () => Contract.ComponentDecisionState.Excluded)
            .exhaustive();
    }

    private mapToChoiceValueDecisionState(state: Domain.DecisionState): Contract.ChoiceValueDecisionState {
        return match(state)
            .with(Domain.DecisionState.Included, () => Contract.ChoiceValueDecisionState.Included)
            .with(Domain.DecisionState.Excluded, () => Contract.ChoiceValueDecisionState.Excluded)
            .exhaustive();
    }

    private mapToDecisionKind(kind: Domain.DecisionKind): Contract.DecisionKind {
        return match(kind)
            .with(Domain.DecisionKind.Explicit, () => Contract.DecisionKind.Explicit)
            .with(Domain.DecisionKind.Implicit, () => Contract.DecisionKind.Implicit)
            .exhaustive();
    }

    private mapToUsageRuleParameters(usageRuleParameters: ReadonlyRecord<string, string>): ReadonlyRecord<string, string> {
        return usageRuleParameters;
    }
}