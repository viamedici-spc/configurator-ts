import {O, Option, pipe, RA, Str} from "@viamedici-spc/fp-ts-extensions";
import {match} from "ts-pattern";
import {guardAgainstUnexpectedNullValue} from "../../crossCutting/Errors";
import {updateBy} from "../../crossCutting/ReadonlyArrayExtensions";
import * as Model from "../Model";
import {Decision} from "../Model";
import * as Engine from "../../apiClient/engine/models/generated/Engine";
import {IRestToDomainMapper} from "../../mappers/RestToDomainMapper";

export interface IDomainUpdater {
    updateConfigurationSession(session: Model.ConfigurationSessionState, response: Engine.PutDecisionResponse): Model.ConfigurationSessionState;
}

const updateAttribute = updateBy<Model.Attribute>({
    equals: (x, y) => Model.eqGlobalAttributeId.equals(x.attributeId, y.attributeId)
});

const updateChoiceValue = updateBy<Model.ChoiceValue>({
    equals: (x, y) => x.choiceValueId === y.choiceValueId
});

export class DomainUpdater implements IDomainUpdater {

    private readonly restToDomainMapper: IRestToDomainMapper;

    constructor(restToDomainMapper: IRestToDomainMapper) {
        this.restToDomainMapper = restToDomainMapper;
    }

    public updateConfigurationSession(session: Model.ConfigurationSessionState, response: Engine.PutDecisionResponse): Model.ConfigurationSessionState {

        const model = this.updateConfigurationModel(session.configuration, response);

        return {
            ...session,
            configuration: model
        };
    }

    private updateConfigurationModel(model: Model.Configuration, putDecisionResponse: Engine.PutDecisionResponse): Model.Configuration {

        const choiceAttributeDecisions = pipe(putDecisionResponse.affectedDecisions?.choiceValueDecisions ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));
        const choiceAttributeConsequences = pipe(putDecisionResponse.consequences?.choiceConsequences ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));

        const componentAttributeDecisions = pipe(putDecisionResponse.affectedDecisions?.componentDecisions ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));
        const componentAttributeConsequences = pipe(putDecisionResponse.consequences?.componentConsequences ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));

        const numericAttributeDecisions = pipe(putDecisionResponse.affectedDecisions?.numericDecisions ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));
        const numericAttributeConsequences = pipe(putDecisionResponse.consequences?.numericConsequences ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));

        const booleanAttributeDecisions = pipe(putDecisionResponse.affectedDecisions?.booleanDecisions ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));
        const booleanAttributeConsequences = pipe(putDecisionResponse.consequences?.booleanConsequences ?? [], RA.map(d => ({
            attributeId: this.restToDomainMapper.mapToGlobalAttributeId(d.attributeId), payload: d
        })));

        const variableIds: ReadonlyArray<Model.GlobalAttributeId> = pipe([],
            RA.concat(pipe(booleanAttributeDecisions, RA.map(a => a.attributeId))),
            RA.concat(pipe(booleanAttributeConsequences, RA.map(a => a.attributeId))),

            RA.concat(pipe(numericAttributeDecisions, RA.map(a => a.attributeId))),
            RA.concat(pipe(numericAttributeConsequences, RA.map(a => a.attributeId))),

            RA.concat(pipe(choiceAttributeDecisions, RA.map(a => a.attributeId))),
            RA.concat(pipe(choiceAttributeConsequences, RA.map(a => a.attributeId))),

            RA.concat(pipe(componentAttributeDecisions, RA.map(a => a.attributeId))),
            RA.concat(pipe(componentAttributeConsequences, RA.map(a => a.attributeId))),

            RA.uniq(Model.eqGlobalAttributeId)
        );

        const attributes = pipe(variableIds,
            RA.reduce(model.attributes, (a: ReadonlyArray<Model.Attribute>, c: Model.GlobalAttributeId) => {
                const attribute = model.attributes.find(a => Model.eqGlobalAttributeId.equals(a.attributeId, c)) as Model.Attribute;

                return match(attribute)
                    .with({
                        type: Model.AttributeType.Choice
                    }, (s, v) => {
                        const att = this.mergeChoice(v,
                            pipe(choiceAttributeConsequences, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload)),
                            pipe(choiceAttributeDecisions, RA.filter(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), RA.map(c => c.payload))
                        );

                        return updateAttribute(att)(a);
                    })

                    .with({
                        type: Model.AttributeType.Numeric
                    }, (s, v) => {
                        const att = this.mergeNumeric(v,
                            pipe(numericAttributeConsequences, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload)),
                            pipe(numericAttributeDecisions, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload))
                        );

                        return updateAttribute(att)(a);
                    })

                    .with({
                        type: Model.AttributeType.Boolean
                    }, (s, v) => {
                        const att = this.mergeBoolean(v,
                            pipe(booleanAttributeConsequences, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload)),
                            pipe(booleanAttributeDecisions, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload))
                        );

                        return updateAttribute(att)(a);
                    })

                    .with({
                        type: Model.AttributeType.Component
                    }, (s, v) => {
                        const att = this.mergeComponent(v,
                            pipe(componentAttributeConsequences, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload)),
                            pipe(componentAttributeDecisions, RA.findFirst(f => Model.eqGlobalAttributeId.equals(f.attributeId, c)), O.map(c => c.payload))
                        );

                        return updateAttribute(att)(a);
                    })
                    .exhaustive();
            }));

        return {
            ...model,
            isSatisfied: pipe(putDecisionResponse.consequences?.isConfigurationSatisfied, O.fromNullable, O.getOrElse((): boolean => model.isSatisfied)),
            attributes: attributes
        };
    }

    private mergeChoice(attribute: Model.ChoiceAttribute, consequence: O.Option<Engine.ChoiceConsequence>, decision: ReadonlyArray<Engine.ChoiceValueDecision>): Model.ChoiceAttribute {

        const choiceValueConsequences = pipe(consequence, O.map(choiceConsequence => choiceConsequence.values ?? []), O.getOrElse((): Engine.ChoiceValueConsequence[] => []));
        const decisions = pipe(decision);

        const choiceValueIds = pipe([] as string[],
            RA.concat(pipe(choiceValueConsequences, RA.map(c => c.choiceValueId))),
            RA.concat(pipe(decisions, RA.map(c => c.choiceValueId))),
            RA.map(guardAgainstUnexpectedNullValue),
            RA.uniq(Str.Eq)
        );

        const choiceValues = pipe(choiceValueIds, RA.reduce(attribute.values, (a, current): ReadonlyArray<Model.ChoiceValue> => {
            const choiceValueConsequence = pipe(choiceValueConsequences, RA.findFirst(x => x.choiceValueId === current));
            const choiceValueDecision = pipe(decisions, RA.findFirst(x => x.choiceValueId === current));

            const currentChoice = pipe(
                attribute.values.find(v => v.choiceValueId === current),
                O.fromNullable,
            );

            const mergedChoiceValue = this.mergeChoiceValue(current, currentChoice, choiceValueConsequence, choiceValueDecision);

            return updateChoiceValue(mergedChoiceValue)(a);
        }));

        return {
            ...attribute,
            isSatisfied: pipe(consequence, O.map(c => guardAgainstUnexpectedNullValue(c.isSatisfied)), O.getOrElse(() => attribute.isSatisfied)),
            values: choiceValues,
        };
    }

    private mergeChoiceValue(current: string, currentChoiceValue: O.Option<Model.ChoiceValue>, consequence: O.Option<Engine.ChoiceValueConsequence>, decision: O.Option<Engine.ChoiceValueDecision>): Model.ChoiceValue {

        const updatedDecision = pipe(
            decision,
            O.map(cvd => ({
                state: this.toDecisionState(guardAgainstUnexpectedNullValue(cvd.state)),
                kind: this.toDecisionKind(guardAgainstUnexpectedNullValue(cvd.kind))
            })),
            O.getOrElse(() => ({
                state: pipe(currentChoiceValue,
                    O.chain(cd => pipe(cd.decision, O.map(d => d.state)))
                ),
                kind: pipe(currentChoiceValue,
                    O.chain(cd => pipe(cd.decision, O.map(d => d.kind))),
                    O.getOrElse(() => Model.DecisionKind.Explicit)
                )
            }))
        );

        const possibleDecisionStates: ReadonlyArray<Model.DecisionState> = pipe(consequence,
            O.map(x => pipe(
                RA.fromArray(x.possibleDecisionStates ?? []),
                RA.map(s => this.toPossibleDecisionState(s)),
                RA.compact
            )),
            O.getOrElse(() => pipe(currentChoiceValue,
                O.map(cc => cc.possibleDecisionStates ?? []),
                O.getOrElse((): ReadonlyArray<Model.DecisionState> => [])
            ))
        );

        return {
            choiceValueId: current,
            decision: pipe(updatedDecision.state, O.map(s => ({
                state: s,
                kind: updatedDecision.kind
            }))),
            possibleDecisionStates: possibleDecisionStates,
        };
    }

    private mergeComponent(attribute: Model.ComponentAttribute, consequence: Option<Engine.ComponentConsequence>, decision: Option<Engine.ComponentDecision>): Model.ComponentAttribute {

        const mergedDecision = pipe(decision,
            O.map(cvd => {
                const state = this.toDecisionState(guardAgainstUnexpectedNullValue(cvd.state));
                return pipe(state,
                    O.map(state => ({
                        state: state,
                        kind: this.toDecisionKind(cvd.kind)
                    }))
                );
            }),
            O.getOrElse(() => {
                return pipe(attribute.decision, O.map(d => ({
                    state: d.state,
                    kind: d.kind
                })));
            })
        );

        const possibleDecisionStates: ReadonlyArray<Model.DecisionState> = pipe(consequence,
            O.map(x => pipe(
                RA.fromArray(x.possibleDecisionStates ?? []),
                RA.map(s => this.toPossibleDecisionState(s)),
                RA.compact
            )),
            O.getOrElse((): ReadonlyArray<Model.DecisionState> => attribute.possibleDecisionStates)
        );

        return {
            ...attribute,
            isSatisfied: pipe(consequence, O.map(c => c.isSatisfied), O.getOrElse(() => attribute.isSatisfied)),
            possibleDecisionStates: possibleDecisionStates,
            decision: mergedDecision
        };
    }

    private mergeNumeric(attribute: Model.NumericAttribute, consequence: Option<Engine.NumericConsequence>, decision: Option<Engine.NumericDecision>): Model.NumericAttribute {
        return {
            ...attribute,
            isSatisfied: pipe(consequence, O.chain(c => O.fromNullable(c.isSatisfied)), O.getOrElse((): boolean => attribute.isSatisfied)),
            decision: pipe(decision,
                O.match(() => attribute.decision, d =>
                    pipe(d.state, O.fromNullable, O.map((state): Decision<number> =>
                        ({
                            kind: this.toDecisionKind(d.kind),
                            state: state
                        }))
                    )
                )
            )
        };
    }

    private mergeBoolean(attribute: Model.BooleanAttribute, consequence: Option<Engine.BooleanConsequence>, decision: Option<Engine.BooleanDecision>): Model.BooleanAttribute {
        return {
            ...attribute,
            isSatisfied: pipe(consequence, O.chain(c => O.fromNullable(c.isSatisfied)), O.getOrElse((): boolean => attribute.isSatisfied)),
            decision: pipe(decision,
                O.match(() => attribute.decision, d =>
                    pipe(d.state, O.fromNullable, O.map((state): Decision<boolean> =>
                        ({
                            kind: this.toDecisionKind(d.kind),
                            state: state
                        }))
                    )
                )
            ),
            possibleDecisionStates: pipe(consequence, O.map(c => c.possibleDecisionStates), O.getOrElse(() => attribute.possibleDecisionStates))
        };
    }

    private toPossibleDecisionState(state: Engine.PossibleDecisionState): Option<Model.DecisionState> {
        return match(state)
            .with(Engine.PossibleDecisionState.Included, () => O.some(Model.DecisionState.Included))
            .with(Engine.PossibleDecisionState.Excluded, () => O.some(Model.DecisionState.Excluded))
            .otherwise(() => O.none);
    }

    private toDecisionState(state: Engine.DecisionState): Option<Model.DecisionState> {
        return match(state)
            .with(Engine.DecisionState.Included, () => O.some(Model.DecisionState.Included))
            .with(Engine.DecisionState.Excluded, () => O.some(Model.DecisionState.Excluded))
            .otherwise(() => O.none);
    }

    private toDecisionKind(state: Engine.DecisionKind): Model.DecisionKind {
        return match(state)
            .with(Engine.DecisionKind.Implicit, () => Model.DecisionKind.Implicit)
            .with(Engine.DecisionKind.Explicit, () => Model.DecisionKind.Explicit)
            .exhaustive();
    }
}