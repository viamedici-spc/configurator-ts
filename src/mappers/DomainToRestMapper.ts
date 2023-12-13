import {match, P} from "ts-pattern";
import {A, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";

import * as Engine from "../apiClient/engine/models/generated/Engine";
import * as Domain from "../domain/Model";

export interface IDomainToRestMapper {
    mapSessionToExplicitDecisions(sessionState: Domain.ConfigurationSessionState): Engine.ExplicitDecisions;

    mapToExplicitDecision(decision: Domain.AttributeDecision): Engine.ExplicitDecision;

    mapToExplicitDecisions(decisions: readonly Domain.AttributeDecision[], mode: Domain.SetManyMode): Engine.ExplicitDecisions;

    mapToWhyStateNotPossibleRequest(question: Domain.WhyIsStateNotPossible): Engine.WhyStateNotPossibleRequest;

    mapToWhyNotSatisfiedRequest(question: Domain.WhyIsNotSatisfied): Engine.WhyNotSatisfiedRequest;
}

export default class DomainToRestMapper implements IDomainToRestMapper {

    public mapSessionToExplicitDecisions(sessionState: Domain.ConfigurationSessionState): Engine.ExplicitDecisions {
        return this.mapToExplicitDecisionsInner(sessionState.configuration.attributes);
    }

    public mapToExplicitDecision(decision: Domain.AttributeDecision): Engine.ExplicitDecision {

        return match(decision)
            .with({
                type: Domain.DecisionType.ChoiceValue
            }, (v: Domain.ChoiceValueAttributeDecision): Engine.ExplicitChoiceValueDecision => ({
                type: Engine.AttributeType.Choice,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                choiceValueId: v.choiceValueId,
                state: this.mapToDecisionState(v.state)
            }))

            .with({
                type: Domain.DecisionType.Component
            }, (v: Domain.ComponentAttributeDecision): Engine.ExplicitComponentDecision => ({
                type: Engine.AttributeType.Component,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: this.mapToDecisionState(v.state)
            }))

            .with({
                type: Domain.DecisionType.Numeric
            }, (v: Domain.NumericAttributeDecision): Engine.ExplicitNumericDecision => ({
                type: Engine.AttributeType.Numeric,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.value, O.toUndefined)
            }))

            .with({
                type: Domain.DecisionType.Boolean
            }, (v: Domain.BooleanAttributeDecision): Engine.ExplicitBooleanDecision => ({
                type: Engine.AttributeType.Boolean,
                attributeId: this.mapToGlobalAttributeId(v.attributeId),
                state: pipe(v.value, O.toUndefined)
            }))
            .exhaustive();
    }

    public mapToExplicitDecisions(decisions: readonly Domain.AttributeDecision[], mode: Domain.SetManyMode): Engine.ExplicitDecisions {
        const engineMode = this.mapToMode(mode);

        const booleanDecisions: Engine.ExplicitBooleanDecision[] = pipe([...decisions],
            A.filterMap(decision => {
                if (decision.type !== Domain.DecisionType.Boolean) {
                    return O.none;
                }

                return O.some({
                    type: Engine.AttributeType.Boolean,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    state: pipe(decision.value, O.toUndefined)
                });
            })
        );

        const numericDecisions: Engine.ExplicitNumericDecision[] = pipe([...decisions],
            A.filterMap(decision => {
                if (decision.type !== Domain.DecisionType.Numeric) {
                    return O.none;
                }

                return O.some({
                    type: Engine.AttributeType.Numeric,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    state: pipe(decision.value, O.toUndefined)
                });
            })
        );

        const choiceDecisions = pipe([...decisions],
            A.filterMap((decision): O.Option<Engine.ExplicitChoiceValueDecision> => {
                if (decision.type !== Domain.DecisionType.ChoiceValue) {
                    return O.none;
                }

                return O.some({
                    type: Engine.AttributeType.Choice,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    choiceValueId: decision.choiceValueId,
                    state: this.mapToDecisionState(decision.state)
                });
            })
        );

        const componentDecisions = pipe([...decisions],
            A.filterMap((decision): O.Option<Engine.ExplicitComponentDecision> => {
                if (decision.type !== Domain.DecisionType.Component) {
                    return O.none;
                }

                return O.some({
                    type: Engine.AttributeType.Component,
                    attributeId: this.mapToGlobalAttributeId(decision.attributeId),
                    state: this.mapToDecisionState(decision.state)
                });
            })
        );

        return {
            mode: engineMode,
            choiceDecisions: choiceDecisions,
            numericDecisions: numericDecisions,
            booleanDecisions: booleanDecisions,
            componentDecisions: componentDecisions
        };
    }

    private mapToExplicitDecisionsInner(attributes: ReadonlyArray<Domain.Attribute>): Engine.ExplicitDecisions {

        const booleanDecisions: Engine.ExplicitBooleanDecision[] = pipe([...attributes],
            A.filterMap(a => {
                if (a.type !== Domain.AttributeType.Boolean) {
                    return O.none;
                }

                return pipe(a.decision,
                    O.filter(d => d.kind === Domain.DecisionKind.Explicit),
                    O.map(() => this.mapToExplicitBooleanDecision(a))
                );
            })
        );

        const numericDecisions: Engine.ExplicitNumericDecision[] = pipe([...attributes],
            A.filterMap(a => {
                if (a.type !== Domain.AttributeType.Numeric) {
                    return O.none;
                }

                return pipe(a.decision,
                    O.filter(d => d.kind === Domain.DecisionKind.Explicit),
                    O.map(() => this.mapToExplicitNumericDecision(a))
                );
            })
        );

        const componentDecisions: Engine.ExplicitComponentDecision[] = pipe([...attributes],
            A.filterMap(a => {
                if (a.type !== Domain.AttributeType.Component) {
                    return O.none;
                }

                return pipe(a.decision,
                    O.filter(d => d.kind === Domain.DecisionKind.Explicit),
                    O.map(() => this.mapToExplicitComponentDecision(a))
                );
            })
        );

        const choiceDecisions: Engine.ExplicitChoiceValueDecision[] = pipe([...attributes],
            A.filterMap(a => {
                if (a.type !== Domain.AttributeType.Choice) {
                    return O.none;
                }

                // Filter choice decisions that have no values
                return pipe(
                    this.mapToExplicitChoiceDecisions(a),
                    O.fromPredicate(choiceDecision => pipe(choiceDecision, RA.isNonEmpty))
                );
            }),
            A.flatten
        );

        return {
            booleanDecisions: booleanDecisions,
            numericDecisions: numericDecisions,
            choiceDecisions: choiceDecisions,
            componentDecisions: componentDecisions
        };
    }

    // private stringifyGlobalAttributeId(id: Domain.GlobalAttributeId): string {
    //     const fromSharedConfigurationModel = O.fromNullable(id.sharedConfigurationModel);
    //     const fromComponentPath = pipe(
    //         O.fromNullable(id.componentPath),
    //         O.map(path => path.join('::'))
    //     );
    //
    //     const parts = [
    //         fromSharedConfigurationModel,
    //         fromComponentPath,
    //         O.fromNullable(id.localId) // assuming localId can be null/undefined even though type does not specify
    //     ];
    //
    //     return pipe(
    //         parts,
    //         A.compact,
    //         parts => parts.join('::')
    //     );
    // }

    public mapToMode(mode: Domain.SetManyMode): Engine.Mode {

        return match(mode)
            .with({type: "Default"}, (): Engine.DefaultMode => ({
                type: "Default"
            }))
            .with({type: "KeepExistingDecisions"}, (): Engine.KeepExistingDecisionsMode => ({
                type: "KeepExistingDecisions"
            }))
            .with({type: "DropExistingDecisions"}, (v): Engine.DropExistingDecisionsMode =>
                this.mapToDropExistingDecisionsMode(v)
            )
            .exhaustive();
    }

    private mapToGlobalAttributeId(attributeId: Domain.GlobalAttributeId): Engine.GlobalAttributeId {
        return {
            localId: attributeId.localId,
            componentPath: pipe(attributeId.componentPath, O.fromNullable, O.map(RA.toArray), O.toNullable),
            sharedConfigurationModelId: attributeId.sharedConfigurationModel
        };
    }

    private mapToDropExistingDecisionsMode(mode: Domain.SetManyDropExistingDecisionsMode): Engine.DropExistingDecisionsMode {
        const conflictResolution = match(mode.conflictHandling)
            .with({
                type: "Manual",
                includeConstraintsInConflictExplanation: P.boolean
            }, (v): Engine.ConflictResolution => ({
                type: "Manual",
                includeConstraintsInConflictExplanation: v.includeConstraintsInConflictExplanation
            }))
            .otherwise((): Engine.ConflictResolution => ({
                type: "Automatic"
            }));

        return {
            type: "DropExistingDecisions",
            conflictResolution: conflictResolution
        };
    }

    private mapToExplicitBooleanDecision(booleanAttribute: Domain.BooleanAttribute): Engine.ExplicitBooleanDecision {
        return {
            type: Engine.AttributeType.Boolean,
            attributeId: this.mapToGlobalAttributeId(booleanAttribute.attributeId),
            state: pipe(booleanAttribute.decision, O.map(d => d.state), O.toUndefined)
        };
    }

    private mapToExplicitNumericDecision(numericAttribute: Domain.NumericAttribute): Engine.ExplicitNumericDecision {
        return {
            type: Engine.AttributeType.Numeric,
            attributeId: this.mapToGlobalAttributeId(numericAttribute.attributeId),
            state: pipe(numericAttribute.decision, O.map(d => d.state), O.toUndefined)
        };
    }

    private mapToExplicitComponentDecision(componentAttribute: Domain.ComponentAttribute): Engine.ExplicitComponentDecision {
        return {
            type: Engine.AttributeType.Component,
            attributeId: this.mapToGlobalAttributeId(componentAttribute.attributeId),
            state: this.mapToDecisionState(pipe(componentAttribute.decision, O.map(d => d.state)))
        };
    }

    private mapToExplicitChoiceDecisions(choiceAttribute: Domain.ChoiceAttribute): Engine.ExplicitChoiceValueDecision[] {

        function isExplicitDecision(v: Domain.ChoiceValue) {
            return pipe(
                v.decision,
                O.map(d => d.kind === Domain.DecisionKind.Explicit),
                O.getOrElse(() => false)
            );
        }

        return pipe(
            choiceAttribute.values,
            RA.filter(isExplicitDecision),
            RA.map((v): Engine.ExplicitChoiceValueDecision => ({
                type: Engine.AttributeType.Choice,
                attributeId: this.mapToGlobalAttributeId(choiceAttribute.attributeId),
                choiceValueId: v.choiceValueId,
                state: this.mapToDecisionState(pipe(v.decision, O.map(d => d.state)))
            })),
            RA.toArray
        );
    }

    private mapToDecisionState(state: O.Option<Domain.DecisionState>): Engine.DecisionState {
        return pipe(state, O.map((s: Domain.DecisionState): Engine.DecisionState => match(s)
                .with(Domain.DecisionState.Included, () => Engine.DecisionState.Included)
                .with(Domain.DecisionState.Excluded, () => Engine.DecisionState.Excluded)
                .exhaustive()
            ),
            O.getOrElse((): Engine.DecisionState => Engine.DecisionState.Undefined)
        );
    }

    private mapToPossibleDecisionState(state: Domain.DecisionState): Engine.PossibleDecisionState {
        return match(state)
            .with(Domain.DecisionState.Included, () => Engine.PossibleDecisionState.Included)
            .with(Domain.DecisionState.Excluded, () => Engine.PossibleDecisionState.Excluded)
            .exhaustive();
    }

    public mapToWhyNotSatisfiedRequest(question: Domain.WhyIsNotSatisfied): Engine.WhyNotSatisfiedRequest {
        return match(question)
            .with({subject: Domain.ExplainQuestionSubject.attribute}, (e): Engine.WhyAttributeNotSatisfiedRequest => ({
                type: Engine.WhyNotSatisfiedType.Attribute,
                attributeId: this.mapToGlobalAttributeId(e.attributeId)
            }))
            .with({subject: Domain.ExplainQuestionSubject.configuration}, (): Engine.WhyConfigurationNotSatisfiedRequest => ({
                type: Engine.WhyNotSatisfiedType.Configuration
            }))
            .exhaustive();
    }

    public mapToWhyStateNotPossibleRequest(question: Domain.WhyIsStateNotPossible): Engine.WhyStateNotPossibleRequest {
        return match(question)

            .with({subject: Domain.ExplainQuestionSubject.boolean}, (e): Engine.WhyBooleanStateNotPossibleRequest => ({
                type: Engine.WhyStateNotPossibleType.Boolean,
                attributeId: this.mapToGlobalAttributeId(e.attributeId),
                state: e.state
            }))

            .with({subject: Domain.ExplainQuestionSubject.numeric}, (e): Engine.WhyNumericStateNotPossibleRequest => ({
                type: Engine.WhyStateNotPossibleType.Numeric,
                attributeId: this.mapToGlobalAttributeId(e.attributeId),
                state: e.state
            }))

            .with({subject: Domain.ExplainQuestionSubject.component}, (e): Engine.WhyComponentStateNotPossibleRequest => ({
                type: Engine.WhyStateNotPossibleType.Component,
                attributeId: this.mapToGlobalAttributeId(e.attributeId),
                state: this.mapToPossibleDecisionState(e.state)
            }))

            .with({subject: Domain.ExplainQuestionSubject.choiceValue}, (e): Engine.WhyChoiceValueStateNotPossibleRequest => ({
                type: Engine.WhyStateNotPossibleType.ChoiceValue,
                attributeId: this.mapToGlobalAttributeId(e.attributeId),
                choiceValueId: e.choiceValueId,
                state: this.mapToPossibleDecisionState(e.state)
            }))

            .exhaustive();
    }
}