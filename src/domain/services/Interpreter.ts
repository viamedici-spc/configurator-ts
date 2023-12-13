import {O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {match} from "ts-pattern";
import * as Model from "../Model";

export class Interpreter {
    configurationSession = {
        hasExplicitDecisions(decisions: Model.ConfigurationSessionState): boolean {
            return pipe(decisions.configuration.attributes,
                RA.findFirst(a => {
                    return match(a)
                        .with({
                            type: Model.AttributeType.Boolean
                        }, (v: Model.BooleanAttribute) => {
                            return pipe(v.decision, O.filter(d => d.kind === Model.DecisionKind.Explicit), O.isSome);
                        })
                        .with({
                            type: Model.AttributeType.Numeric
                        }, (v: Model.NumericAttribute) => {
                            return pipe(v.decision, O.filter(d => d.kind === Model.DecisionKind.Explicit), O.isSome);
                        })
                        .with({
                            type: Model.AttributeType.Choice
                        }, (v: Model.ChoiceAttribute) => {
                            return pipe(v.values,
                                RA.findFirst(acv => pipe(acv.decision,
                                    O.map(d => d.kind === Model.DecisionKind.Explicit),
                                    O.getOrElse((): boolean => false)
                                )),
                                O.isSome
                            );
                        })
                        .with({
                            type: Model.AttributeType.Component
                        }, (v: Model.ComponentAttribute) => {
                            return pipe(v.decision, O.filter(d => d.kind === Model.DecisionKind.Explicit), O.isSome);
                        })
                        .exhaustive();
                }),
                O.match(() => false, () => true)
            );
        },
        getExplicitDecisions(configurationSession: Model.ConfigurationSessionState): ReadonlyArray<Model.AttributeDecision> {
            return pipe(configurationSession.configuration.attributes,
                RA.map(a => {
                    return match(a)
                        .with({
                            type: Model.AttributeType.Boolean
                        }, (v: Model.BooleanAttribute) => {
                            return pipe(v.decision,
                                O.filter(d => d.kind === Model.DecisionKind.Explicit),
                                O.map((d): Model.BooleanAttributeDecision => ({
                                    type: Model.DecisionType.Boolean,
                                    attributeId: v.attributeId,
                                    value: O.fromNullable(d.state)
                                })),
                                O.map(d => [d])
                            );
                        })
                        .with({
                            type: Model.AttributeType.Numeric
                        }, (v: Model.NumericAttribute) => {
                            return pipe(v.decision,
                                O.filter(d => d.kind === Model.DecisionKind.Explicit),
                                O.map((d): Model.NumericAttributeDecision => ({
                                    type: Model.DecisionType.Numeric,
                                    attributeId: v.attributeId,
                                    value: O.fromNullable(d.state)
                                })),
                                O.map(d => [d])
                            );
                        })
                        .with({
                            type: Model.AttributeType.Choice
                        }, (v: Model.ChoiceAttribute) => {
                            return pipe(v.values,
                                RA.map(acv => pipe(acv.decision,
                                    O.filter(d => d.kind === Model.DecisionKind.Explicit),
                                    O.map((d): Model.ChoiceValueAttributeDecision => ({
                                        type: Model.DecisionType.ChoiceValue,
                                        attributeId: v.attributeId,
                                        choiceValueId: acv.choiceValueId,
                                        state: O.fromNullable(d.state)
                                    }))
                                )),
                                RA.compact,
                                O.of
                            );
                        })
                        .with({
                            type: Model.AttributeType.Component
                        }, (v: Model.ComponentAttribute) => {
                            return pipe(v.decision,
                                O.filter(d => d.kind === Model.DecisionKind.Explicit),
                                O.map((d): Model.ComponentAttributeDecision => ({
                                    type: Model.DecisionType.Component,
                                    attributeId: v.attributeId,
                                    state: O.fromNullable(d.state)
                                })),
                                O.map(d => [d]));
                        })
                        .exhaustive() as O.Option<Model.AttributeDecision[]>;
                }),
                RA.compact,
                RA.flatten
            );
        }
    };
}