import {A, Eq, O, Option, pipe, RA, Str, TE} from "@viamedici-spc/fp-ts-extensions";
import * as Engine from "../apiClient/engine/models/generated/Engine";
import * as Domain from "../domain/Model";
import {match, P} from "ts-pattern";
import {getNullableEq, getNullTolerantReadOnlyArrayEq} from "../crossCutting/Eq";

export interface IRestToDomainMapper {
    mapToConfigurationModel(decisions: Engine.Decisions, consequences: Engine.Consequences): Domain.Configuration;

    mapToDecisions(decisions: Engine.Decisions): {};

    mapToBooleanDecision(booleanDecision: Engine.BooleanDecision): Domain.BooleanAttributeDecision;

    mapToNumericDecision(numericDecision: Engine.NumericDecision): Domain.NumericAttributeDecision;

    mapToComponentDecision(componentDecision: Engine.ComponentDecision): Domain.ComponentAttributeDecision;

    mapToExplicitChoiceValueDecision(choiceValueDecision: Engine.ChoiceValueDecision): Domain.ChoiceValueAttributeDecision;

    mapToGlobalAttributeId(attributeId: Engine.GlobalAttributeId): Domain.GlobalAttributeId;

    mapToExplainAnswer(explanation: Engine.ExplainResult, explain: Domain.ExplainQuestion): Domain.ExplainAnswer;

    mapToConfigurationSetManyConflictFailure(conflict: Engine.PutManyDecisionsConflictResponse, decisions: Engine.ExplicitDecisions, mode: Domain.SetManyMode): Domain.ConfigurationSetManyConflict;

    mapToSessionId(response: Engine.CreateSessionSuccessResponse | Engine.CreateSessionConflictResponse): Domain.TaskEitherResult<Domain.SessionId>;
}

const eqGlobalAttributeId = Eq.struct<Engine.GlobalAttributeId>({
    localId: Str.Eq,
    componentPath: getNullTolerantReadOnlyArrayEq(Str.Eq),
    sharedConfigurationModelId: getNullableEq(Str.Eq)
});

export default class RestToDomainMapper implements IRestToDomainMapper {
    public mapToDecisions(_: Engine.Decisions): {} {
        return {};
    }

    public mapToSessionId(response: Engine.CreateSessionSuccessResponse | Engine.CreateSessionConflictResponse): Domain.TaskEitherResult<Domain.SessionId>{
        return  match(response)
            .with({
                sessionId: P.string
            }, s => {
                return TE.right(s.sessionId);
            })
            .with({
                type: "ConfigurationModelNotFeasible"
            }, (f: Engine.CreateSessionConfigurationModelNotFeasibleConflict): Domain.TaskEitherResult<Domain.SessionId> => {

                const constraintExplanations = pipe(f.constraintExplanations,
                    RA.map((e): Domain.ConstraintExplanation => this.mapToConstraintExplanation(e))
                );

                return (TE.left({
                    type: Domain.FailureType.ConfigurationModelNotFeasible,
                    constraintExplanations: constraintExplanations
                }));
            })
            .with({
                type: "ConfigurationModelInvalid"
            }, (): Domain.TaskEitherResult<Domain.SessionId> => {
                return (TE.left({
                    type: Domain.FailureType.ConfigurationModelInvalid
                }));
            })

            .otherwise((): Domain.TaskEitherResult<Domain.SessionId> => (TE.left({
                type: Domain.FailureType.Unknown
            })));
    }

    public mapToExplainAnswer(explanation: Engine.ExplainResult, explainQuestion: Domain.ExplainQuestion): Domain.ExplainAnswer {

        const decisionsToApply = match(explainQuestion)
            .with({
                question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                subject: Domain.ExplainQuestionSubject.boolean
            }, (q): ReadonlyArray<Domain.BooleanAttributeDecision> => ([{
                type: Domain.DecisionType.Boolean,
                attributeId: q.attributeId,
                value: O.some(q.state)
            }]))
            .with({
                question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                subject: Domain.ExplainQuestionSubject.numeric
            }, (q): ReadonlyArray<Domain.NumericAttributeDecision> => ([{
                type: Domain.DecisionType.Numeric,
                attributeId: q.attributeId,
                value: O.some(q.state)
            }]))
            .with({
                question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                subject: Domain.ExplainQuestionSubject.component
            }, (q): ReadonlyArray<Domain.ComponentAttributeDecision> => ([{
                type: Domain.DecisionType.Component,
                attributeId: q.attributeId,
                state: O.some(q.state)
            }]))
            .with({
                question: Domain.ExplainQuestionType.whyIsStateNotPossible,
                subject: Domain.ExplainQuestionSubject.choiceValue
            }, (q): ReadonlyArray<Domain.ChoiceValueAttributeDecision> => ([{
                type: Domain.DecisionType.ChoiceValue,
                attributeId: q.attributeId,
                choiceValueId: q.choiceValueId,
                state: O.some(q.state)
            }]))
            .otherwise(() => []);

        const decisionExplanations = pipe(
            explanation.decisionExplanations,
            RA.map(decisionExplanation => this.mapToDecisionExplanation(decisionExplanation, decisionsToApply, { type: "Default"}))
        );

        const constraintExplanations = pipe(
            explanation.constraintExplanations,
            RA.map(constraintExplanation => this.mapToConstraintExplanation(constraintExplanation))
        );

        return match(explainQuestion)
            .with({answerType: Domain.ExplainAnswerType.decisions}, (): Domain.DecisionsExplainAnswer => {
                return {
                    decisionExplanations: decisionExplanations
                };
            })
            .with({answerType: Domain.ExplainAnswerType.constraints}, (): Domain.ConstraintsExplainAnswer => {
                return {
                    constraintExplanations: constraintExplanations
                };
            })
            .with({answerType: Domain.ExplainAnswerType.all}, (): Domain.FullExplainAnswer => {
                return {
                    constraintExplanations: constraintExplanations,
                    decisionExplanations: decisionExplanations
                };
            }).exhaustive();
    }

    public mapToConfigurationSetManyConflictFailure(conflict: Engine.PutManyDecisionsConflictResponse, decisions: Engine.ExplicitDecisions, mode: Domain.SetManyMode): Domain.ConfigurationSetManyConflict {
        const explicitDecisions = this.mapToExplicitDecisions(decisions);

        return {
            type: Domain.FailureType.ConfigurationSetManyConflict,
            decisionExplanations: pipe(conflict.decisionExplanations, RA.map(d => this.mapToDecisionExplanation(d, explicitDecisions, mode))),
            constraintExplanations: pipe(conflict.constraintExplanations, RA.map(c => this.mapToConstraintExplanation(c)))
        };
    }

    public mapToGlobalConstraintId(attributeId: Engine.GlobalConstraintId): Domain.GlobalConstraintId {
        return {
            localId: attributeId.localId,
            configurationModelId: attributeId.configurationModelId!,
        };
    }

    public mapToConfigurationModel(decisions: Engine.Decisions, consequences: Engine.Consequences): Domain.Configuration {
        const attributes = this.mapToAttributes(decisions, consequences);

        return {
            isSatisfied: consequences.isConfigurationSatisfied ?? false,
            attributes: attributes,
        };
    }

    public mapToBooleanDecision(booleanDecision: Engine.BooleanDecision): Domain.BooleanAttributeDecision {
        return {
            type: Domain.DecisionType.Boolean,
            attributeId: this.mapToGlobalAttributeId(booleanDecision.attributeId),
            value: O.fromNullable(booleanDecision.state)
        };
    }

    public mapToNumericDecision(numericDecision: Engine.NumericDecision): Domain.NumericAttributeDecision {
        return {
            type: Domain.DecisionType.Numeric,
            attributeId: this.mapToGlobalAttributeId(numericDecision.attributeId),
            value: O.fromNullable(numericDecision.state)
        };
    }

    public mapToComponentDecision(componentDecision: Engine.ComponentDecision): Domain.ComponentAttributeDecision {
        return {
            type: Domain.DecisionType.Component,
            attributeId: this.mapToGlobalAttributeId(componentDecision.attributeId),
            state: this.mapToDecisionState(componentDecision.state)
        };
    }

    public mapToExplicitChoiceValueDecision(choiceValueDecision: Engine.ChoiceValueDecision): Domain.ChoiceValueAttributeDecision {
        return {
            type: Domain.DecisionType.ChoiceValue,
            attributeId: this.mapToGlobalAttributeId(choiceValueDecision.attributeId),
            choiceValueId: choiceValueDecision.choiceValueId,
            state: this.mapToDecisionState(choiceValueDecision.state)
        };
    }

    public mapToGlobalAttributeId(attributeId: Engine.GlobalAttributeId): Domain.GlobalAttributeId {
        return {
            localId: attributeId.localId,
            sharedConfigurationModel: attributeId.sharedConfigurationModelId,
            componentPath: attributeId.componentPath ?? []
        };
    }

    public mapToChoiceValueDecision(d: Engine.ChoiceValueDecision): O.Option<Domain.Decision<Domain.DecisionState>> {
        return pipe(this.mapToDecisionState(d.state), O.map((s): Domain.Decision<Domain.DecisionState> => ({
            kind: this.mapToDecisionKind(d.kind), state: s
        })));
    }

    private mapToConstraintExplanation(constraintExplanation: Engine.ConstraintExplanation): Domain.ConstraintExplanation{
       return {
            causedByRules: pipe(constraintExplanation.causedByRules, RA.map(r => this.mapToRuleConstraint(r))),
                causedByCardinalities: pipe(constraintExplanation.causedByCardinalities, RA.map(r => this.mapToCardinalityConstraint(r)))
       };
    }

    private mapToRuleConstraint(causedByRule: Engine.RuleConstraint): Domain.RuleConstraint{
        return {
            type: Domain.ConstraintType.Rule,
            ruleId: this.mapToGlobalConstraintId(causedByRule.constraintId)
        }
    }

    private mapToCardinalityConstraint(causedByRule: Engine.CardinalityConstraint): Domain.CardinalityConstraint{
        return {
            type: Domain.ConstraintType.Cardinality,
            attributeId: this.mapToGlobalAttributeId(causedByRule.attributeId)
        }
    }

    private mapToExplicitDecisions(decisions: Engine.ExplicitDecisions): ReadonlyArray<Domain.AttributeDecision> {
        const booleanDecisions: ReadonlyArray<Domain.AttributeDecision> = pipe(decisions.booleanDecisions ?? [],
            RA.map((b): Domain.BooleanAttributeDecision => ({
                type: Domain.DecisionType.Boolean,
                attributeId: this.mapToGlobalAttributeId(b.attributeId),
                value: O.fromNullable(b.state)
            }))
        );

        const numericDecisions: ReadonlyArray<Domain.AttributeDecision> = pipe(decisions.numericDecisions ?? [],
            RA.map((b): Domain.NumericAttributeDecision => ({
                type: Domain.DecisionType.Numeric,
                attributeId: this.mapToGlobalAttributeId(b.attributeId),
                value: O.fromNullable(b.state)
            }))
        );

        const componentDecisions: ReadonlyArray<Domain.AttributeDecision> = pipe(decisions.componentDecisions ?? [],
            RA.map((b): Domain.ComponentAttributeDecision => ({
                type: Domain.DecisionType.Component,
                attributeId: this.mapToGlobalAttributeId(b.attributeId),
                state: pipe(O.fromNullable(b.state), O.map(s => this.mapToDecisionState(s)), O.flatten)
            }))
        );

        const choiceValueDecisions: ReadonlyArray<Domain.AttributeDecision> = pipe(decisions.choiceDecisions ?? [],
            RA.map((b): Domain.ChoiceValueAttributeDecision => ({
                type: Domain.DecisionType.ChoiceValue,
                attributeId: this.mapToGlobalAttributeId(b.attributeId),
                choiceValueId: b.choiceValueId,
                state: pipe(O.fromNullable(b.state), O.map(s => this.mapToDecisionState(s)), O.flatten)
            }))
        );


        return pipe([],
            RA.concat(booleanDecisions),
            RA.concat(numericDecisions),
            RA.concat(componentDecisions),
            RA.concat(choiceValueDecisions),
        );
    }

    private mapToDecisionExplanation(decisionExplanation: Engine.DecisionExplanation, originalDecisions: ReadonlyArray<Domain.AttributeDecision>, mode: Domain.SetManyMode): Domain.DecisionExplanation {

        const causedByBooleanDecisions = pipe(decisionExplanation.causedByBooleanDecisions, RA.map(d => this.mapToCausedByBooleanDecision(d)));
        const causedByNumericDecisions = pipe(decisionExplanation.causedByNumericDecisions, RA.map(d => this.mapToCausedByNumericDecision(d)));
        const causedByComponentDecisions = pipe(decisionExplanation.causedByComponentDecisions, RA.map(d => this.mapToCausedByComponentDecision(d)));
        const causedByChoiceValueDecisions = pipe(decisionExplanation.causedByChoiceDecisions, RA.map(d => this.mapToCausedByChoiceValueDecision(d)));

        const undoBooleanDecisions = pipe(causedByBooleanDecisions, RA.map((d): Domain.BooleanAttributeDecision => ({
            type: Domain.DecisionType.Boolean,
            attributeId: d.attributeId,
            value: O.none
        })));
        const undoNumericDecisions = pipe(causedByNumericDecisions, RA.map((d): Domain.NumericAttributeDecision => ({
            type: Domain.DecisionType.Numeric,
            attributeId: d.attributeId,
            value: O.none
        })));
        const undoComponentDecisions = pipe(causedByComponentDecisions, RA.map((d): Domain.ComponentAttributeDecision => ({
            type: Domain.DecisionType.Component,
            attributeId: d.attributeId,
            state: O.none
        })));
        const undoChoiceValueDecisions = pipe(causedByChoiceValueDecisions, RA.map((d): Domain.ChoiceValueAttributeDecision => ({
            type: Domain.DecisionType.ChoiceValue,
            attributeId: d.attributeId,
            choiceValueId: d.choiceValueId,
            state: O.none
        })));

        const undoDecisions = pipe([],
            RA.concat<Domain.AttributeDecision>(undoBooleanDecisions),
            RA.concat<Domain.AttributeDecision>(undoNumericDecisions),
            RA.concat<Domain.AttributeDecision>(undoComponentDecisions),
            RA.concat<Domain.AttributeDecision>(undoChoiceValueDecisions)
        );

        const filteredOriginalDecisions = RA.difference(Eq.fromEquals<Domain.AttributeDecision>((a: Domain.AttributeDecision, b: Domain.AttributeDecision): boolean => {
            const attributeIdEquals = Domain.eqGlobalAttributeId.equals(a.attributeId, b.attributeId);

            return match({a, b})
                .with({a: {
                        type: Domain.DecisionType.ChoiceValue
                    }, b: {
                        type: Domain.DecisionType.ChoiceValue
                    }}, (x): boolean => {
                    return attributeIdEquals && x.a.choiceValueId === x.b.choiceValueId;
                })
                .otherwise((): boolean => attributeIdEquals);
        }))(undoDecisions)(originalDecisions);

        return {
            causedByBooleanDecisions: causedByBooleanDecisions,
            causedByNumericDecisions: causedByNumericDecisions,
            causedByComponentDecisions: causedByComponentDecisions,
            causedByChoiceDecisions: causedByChoiceValueDecisions,
            solution: {
                decisions: pipe([],
                    RA.concat<Domain.AttributeDecision>(undoDecisions),
                    RA.concat<Domain.AttributeDecision>(filteredOriginalDecisions),
                ),
                mode: mode
            }
        };
    }

    private mapToCausedByBooleanDecision(booleanDecision: Engine.CausedByBooleanDecision): Domain.CausedByBooleanDecision {
        return {
            type: Domain.DecisionType.Boolean,
            attributeId: this.mapToGlobalAttributeId(booleanDecision.attributeId),
            state: booleanDecision.state!,
            reason: this.mapToReason(booleanDecision.reason)
        };
    }

    private mapToReason(reason: Engine.Reason): Domain.Reason {
        return match(reason)
            .with(Engine.Reason.NotAvailable, () => Domain.Reason.NotAvailable)
            .with(Engine.Reason.StateNotPossible, () => Domain.Reason.StateNotPossible)
            .exhaustive();
    }

    private mapToCausedByNumericDecision(numericDecision: Engine.CausedByNumericDecision): Domain.CausedByNumericDecision {
        return {
            type: Domain.DecisionType.Numeric,
            attributeId: this.mapToGlobalAttributeId(numericDecision.attributeId),
            state: numericDecision.state!,
            reason: this.mapToReason(numericDecision.reason)
        };
    }

    private mapToCausedByComponentDecision(componentDecision: Engine.CausedByComponentDecision): Domain.CausedByComponentDecision {
        return {
            type: Domain.DecisionType.Component,
            attributeId: this.mapToGlobalAttributeId(componentDecision.attributeId),
            state: this.mapToPossibleDecisionState(componentDecision.state),
            reason: this.mapToReason(componentDecision.reason)
        };
    }

    private mapToCausedByChoiceValueDecision(choiceValueDecision: Engine.CausedByChoiceValueDecision): Domain.CausedByChoiceValueDecision {
        return {
            type: Domain.DecisionType.ChoiceValue,
            attributeId: this.mapToGlobalAttributeId(choiceValueDecision.attributeId),
            choiceValueId: choiceValueDecision.choiceValueId,
            state: this.mapToPossibleDecisionState(choiceValueDecision.state),
            reason: this.mapToReason(choiceValueDecision.reason)
        };
    }

    private mapToAttributes(decisions: Engine.Decisions, consequences: Engine.Consequences): ReadonlyArray<Domain.Attribute> {

        function lookupCanContributeTo(attributeId: Engine.GlobalAttributeId): boolean {
            return pipe(consequences.canAttributeContributeToConfigurationSatisfaction,
                RA.findFirst(a => eqGlobalAttributeId.equals(a, attributeId)), O.isSome);
        }

        const choiceIds: ReadonlyArray<Engine.GlobalAttributeId> = pipe([],
            RA.concat(pipe(decisions.choiceValueDecisions, RA.map(d => d.attributeId))),
            RA.concat(pipe(consequences.choiceConsequences, RA.map(d => d.attributeId))),
            RA.uniq(eqGlobalAttributeId)
        );

        const choiceAttributes: ReadonlyArray<Domain.Attribute> = pipe(choiceIds,
            RA.map((attributeId: Engine.GlobalAttributeId) => {
                const choiceDecisions = pipe(decisions.choiceValueDecisions ?? [], A.filter(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                const choiceConsequence = pipe(consequences.choiceConsequences ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                return pipe(choiceConsequence, O.map(choiceConsequence => this.mapToChoiceAttributes(choiceConsequence, choiceDecisions, lookupCanContributeTo(attributeId))));
            }),
            RA.compact
        );

        const numericIds: ReadonlyArray<Engine.GlobalAttributeId> = pipe([],
            RA.concat(pipe(decisions.numericDecisions, RA.map(d => d.attributeId))),
            RA.concat(pipe(consequences.numericConsequences, RA.map(d => d.attributeId))),
            RA.uniq(eqGlobalAttributeId)
        );

        const numericAttributes: ReadonlyArray<Domain.Attribute> = pipe(numericIds,
            RA.map((attributeId: Engine.GlobalAttributeId) => {
                const numericDecision = pipe(decisions.numericDecisions ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                const numericConsequence = pipe(consequences.numericConsequences ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                return pipe(numericConsequence, O.map(numericConsequence => this.mapToNumericAttribute(numericConsequence, numericDecision, lookupCanContributeTo(attributeId))));
            }),
            RA.compact
        );

        const booleanIds: ReadonlyArray<Engine.GlobalAttributeId> = pipe([],
            RA.concat(pipe(decisions.booleanDecisions, RA.map(d => d.attributeId))),
            RA.concat(pipe(consequences.booleanConsequences, RA.map(d => d.attributeId))),
            RA.uniq(eqGlobalAttributeId)
        );

        const booleanAttributes: ReadonlyArray<Domain.Attribute> = pipe(booleanIds,
            RA.map((attributeId: Engine.GlobalAttributeId) => {
                const booleanDecision = pipe(decisions.booleanDecisions ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                const booleanConsequence = pipe(consequences.booleanConsequences ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                return pipe(booleanConsequence, O.map(booleanConsequence => this.mapToBooleanAttribute(booleanConsequence, booleanDecision, lookupCanContributeTo(attributeId))));
            }),
            RA.compact
        );

        const componentIds: ReadonlyArray<Engine.GlobalAttributeId> = pipe([],
            RA.concat(pipe(decisions.componentDecisions, RA.map(d => d.attributeId))),
            RA.concat(pipe(consequences.componentConsequences, RA.map(d => d.attributeId))),
            RA.uniq(eqGlobalAttributeId)
        );

        const componentAttributes: ReadonlyArray<Domain.Attribute> = pipe(componentIds,
            RA.map((attributeId: Engine.GlobalAttributeId) => {
                const componentDecision = pipe(decisions.componentDecisions ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                const componentConsequence = pipe(consequences.componentConsequences ?? [], A.findFirst(d => eqGlobalAttributeId.equals(d.attributeId, attributeId)));
                return pipe(componentConsequence, O.map(componentConsequence => this.mapToComponentAttribute(componentConsequence, componentDecision, lookupCanContributeTo(attributeId))));
            }),
            RA.compact
        );

        return pipe([],
            RA.concat(choiceAttributes),
            RA.concat(componentAttributes),
            RA.concat(numericAttributes),
            RA.concat(booleanAttributes)
        );
    }

    private mapToComponentAttribute(consequence: Engine.ComponentConsequence, decision: O.Option<Engine.ComponentDecision>, canContribute: boolean): Domain.ComponentAttribute {
        return {
            type: Domain.AttributeType.Component,
            attributeId: this.mapToGlobalAttributeId(consequence.attributeId),
            isSatisfied: consequence.isSatisfied,
            possibleDecisionStates: pipe(consequence.possibleDecisionStates, A.map(pds => this.mapToPossibleDecisionState(pds))),
            decision: pipe(decision, O.chain(d => pipe(this.mapToDecisionState(d.state), O.map(state => ({
                state: state,
                kind: d.kind
            }))))),
            inclusion: this.mapToInclusion(consequence.inclusion),
            selection: pipe(consequence.selection, O.fromNullable, O.map(s => this.mapToSelection(s)), O.toUndefined),
            canContributeToConfigurationSatisfaction: canContribute
        };
    }

    private mapToChoiceAttributes(consequence: Engine.ChoiceConsequence, decisions: ReadonlyArray<Engine.ChoiceValueDecision>, canContribute: boolean): Domain.ChoiceAttribute {

        const values = pipe(consequence.values,
            A.map(choiceConsequenceValue => {
                const decision = pipe(decisions, RA.findFirst(d => d.choiceValueId == choiceConsequenceValue.choiceValueId));
                return this.mapToChoiceValue(choiceConsequenceValue, decision);
            })
        );

        return {
            type: Domain.AttributeType.Choice,
            attributeId: this.mapToGlobalAttributeId(consequence.attributeId),
            isSatisfied: consequence.isSatisfied,
            cardinality: this.mapToCardinality(consequence.cardinality),
            values: values,
            canContributeToConfigurationSatisfaction: canContribute
        };
    }

    private mapToBooleanAttribute(consequence: Engine.BooleanConsequence, decision: Option<Engine.BooleanDecision>, canContribute: boolean): Domain.BooleanAttribute {
        return {
            type: Domain.AttributeType.Boolean,
            attributeId: this.mapToGlobalAttributeId(consequence.attributeId),
            isSatisfied: consequence.isSatisfied,
            selection: this.mapToSelection(consequence.selection),
            possibleDecisionStates: consequence.possibleDecisionStates,
            decision: pipe(
                decision,
                O.chain((d) =>
                    pipe(d.state, O.fromNullable,
                        O.map((state): Domain.Decision<boolean> => ({
                            kind: this.mapToDecisionKind(d.kind),
                            state: state
                        }))
                    )
                )
            ),
            canContributeToConfigurationSatisfaction: canContribute
        };
    }

    private mapToNumericAttribute(consequence: Engine.NumericConsequence, decision: O.Option<Engine.NumericDecision>, canContribute: boolean): Domain.NumericAttribute {

        return {
            type: Domain.AttributeType.Numeric,
            attributeId: this.mapToGlobalAttributeId(consequence.attributeId),
            isSatisfied: consequence.isSatisfied,
            range: {
                min: consequence.range.min,
                max: consequence.range.max
            },
            selection: this.mapToSelection(consequence.selection),
            decimalPlaces: consequence.decimalPlaces,

            decision: pipe(
                decision,
                O.chain((d) =>
                    pipe(d.state, O.fromNullable,
                        O.map((state): Domain.Decision<number> => ({
                            kind: this.mapToDecisionKind(d.kind),
                            state: state
                        }))
                    )
                )
            ),
            canContributeToConfigurationSatisfaction: canContribute
        };
    }

    private mapToChoiceValue(consequence: Engine.ChoiceValueConsequence, decision: O.Option<Engine.ChoiceValueDecision>): Domain.ChoiceValue {

        const possibleDecisionStates: Domain.DecisionState[] = pipe(consequence.possibleDecisionStates,
            A.map((decisionState: Engine.PossibleDecisionState) => this.mapToPossibleDecisionState(decisionState))
        );

        return {
            choiceValueId: consequence.choiceValueId,
            decision: pipe(decision, O.chain(d => this.mapToChoiceValueDecision(d))),
            possibleDecisionStates: possibleDecisionStates
        };
    }

    private mapToDecisionKind(decisionKind: Engine.DecisionKind): Domain.DecisionKind {
        return match(decisionKind)
            .with(Engine.DecisionKind.Implicit, () => Domain.DecisionKind.Implicit)
            .with(Engine.DecisionKind.Explicit, () => Domain.DecisionKind.Explicit)
            .exhaustive();
    }

    private mapToDecisionState(decisionState: Engine.DecisionState): O.Option<Domain.DecisionState> {
        return match(decisionState)
            .with(Engine.DecisionState.Included, (): O.Option<Domain.DecisionState> => O.some(Domain.DecisionState.Included))
            .with(Engine.DecisionState.Excluded, (): O.Option<Domain.DecisionState> => O.some(Domain.DecisionState.Excluded))
            .with(Engine.DecisionState.Undefined, () => O.none)
            .exhaustive();
    }

    private mapToPossibleDecisionState(decisionState: Engine.PossibleDecisionState): Domain.DecisionState {
        return match(decisionState)
            .with(Engine.PossibleDecisionState.Included, () => Domain.DecisionState.Included)
            .with(Engine.PossibleDecisionState.Excluded, () => Domain.DecisionState.Excluded)
            .exhaustive();
    }

    private mapToSelection(selection: Engine.Selection): Domain.Selection {
        return match(selection)
            .with(Engine.Selection.Mandatory, () => Domain.Selection.Mandatory)
            .with(Engine.Selection.Optional, () => Domain.Selection.Optional)
            .exhaustive();
    }

    private mapToInclusion(decisionState: Engine.Inclusion): Domain.Inclusion {
        return match(decisionState)
            .with(Engine.Inclusion.Always, () => Domain.Inclusion.Always)
            .with(Engine.Inclusion.Optional, () => Domain.Inclusion.Optional)
            .exhaustive();
    }

    private mapToCardinality(cardinality: Engine.Cardinality): Domain.Cardinality {
        return {
            lowerBound: cardinality.lowerBound,
            upperBound: cardinality.upperBound
        };
    }
}