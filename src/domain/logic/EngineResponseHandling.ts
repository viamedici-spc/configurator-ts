import * as Engine from "../../apiClient/engine/Engine";
import * as EtoD from "../mapper/EngineToDomainMapping";
import {
    mapConstraintExplanation,
    mapDecisionExplanation,
    mapInclusion,
    mapSelection,
    mapToExplicitDecision
} from "../mapper/EngineToDomainMapping";
import {
    AttributeType,
    CausedByDecision, ConstraintsExplainAnswer,
    DecisionExplanation, DecisionsExplainAnswer,
    ExplainQuestion,
    ExplainQuestionSubject,
    ExplainQuestionType,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision, FullExplainAnswer,
    GlobalAttributeId,
    GlobalAttributeIdKey,
    SetManyKeepExistingDecisionsMode,
    SetManyMode,
    SetManyResult
} from "../../contract/Types";
import {pipe, RA, RM, some} from "@viamedici-spc/fp-ts-extensions";
import GlobalAttributeIdKeyBuilder from "../../crossCutting/GlobalAttributeIdKeyBuilder";
import {none, Option} from "fp-ts/Option";
import {match} from "ts-pattern";
import {ConfiguratorError, ConfiguratorErrorType, SetManyDecisionsConflict} from "../../contract/ConfiguratorError";
import {
    AttributeConsequence,
    AttributeDecision,
    AttributeMeta,
    BooleanAttributeConsequence,
    BooleanAttributeDecision,
    ChoiceAttributeConsequence,
    ChoiceAttributeDecision,
    ChoiceValueConsequence,
    ComponentAttributeConsequence,
    ComponentAttributeDecision,
    NumericAttributeConsequence,
    NumericAttributeDecision
} from "../model/PartialAttribute";
import HashedConfiguration from "../model/HashedConfiguration";
import {
    fromRawData, integrateRawData,
    toHashedConfiguration
} from "./Configuration";
import {explicitDecisionByIdEq, globalAttributeIdKeyEq} from "../../contract/Eqs";
import ConfigurationRawData from "../model/ConfigurationRawData";
import {attributeConsequenceSe, attributeDecisionSe, attributeMetaSe} from "../Semigroups";

function getGlobalAttributeIdKey(attributeId: Engine.GlobalAttributeId): GlobalAttributeIdKey {
    return pipe(
        attributeId,
        EtoD.mapGlobalAttributeId,
        GlobalAttributeIdKeyBuilder
    );
}

export function integratePutDecisionResponse(configuration: HashedConfiguration, response: Engine.PutDecisionResponse): {
    configuration: HashedConfiguration,
    rawData: Partial<ConfigurationRawData>
} {
    const attributeConsequences = getAttributeConsequences(response.consequences);
    const attributeDecisions = getAttributeDecisions(response.affectedDecisions);

    const partialConfigurationRawData: Partial<ConfigurationRawData> = {
        isSatisfied: response.consequences.isConfigurationSatisfied,
        canContributeToSatisfaction: pipe(response.consequences.canAttributeContributeToConfigurationSatisfaction, RA.map(getGlobalAttributeIdKey)),
        decisions: attributeDecisions,
        consequences: attributeConsequences,
    };

    const updatedConfiguration = pipe(
        configuration,
        integrateRawData(partialConfigurationRawData),
        toHashedConfiguration
    );

    return {
        configuration: updatedConfiguration,
        rawData: partialConfigurationRawData
    };
}

export function createConfiguration(decisions: Engine.Decisions, consequences: Engine.Consequences, meta: Engine.CompleteMeta | null): {
    configuration: HashedConfiguration,
    rawData: ConfigurationRawData
} {
    const attributeMetas = getAttributeMeta(meta);
    const attributeConsequences = getAttributeConsequences(consequences);
    const attributeDecisions = getAttributeDecisions(decisions);

    const configurationRawData: ConfigurationRawData = {
        isSatisfied: consequences.isConfigurationSatisfied,
        canContributeToSatisfaction: pipe(consequences.canAttributeContributeToConfigurationSatisfaction, RA.map(getGlobalAttributeIdKey)),
        meta: attributeMetas,
        decisions: attributeDecisions,
        consequences: attributeConsequences,
    };

    return {
        configuration: fromRawData(configurationRawData),
        rawData: configurationRawData
    };
}


function getAttributeDecisions(decisions: Engine.Decisions): ReadonlyMap<GlobalAttributeIdKey, AttributeDecision> {
    type BaseDecision = { attributeId: Engine.GlobalAttributeId };
    const transformDecisions = <DE extends BaseDecision, DD, R>(decisions: DE[], decisionMapper: (decision: DE) => DD, resultBuilder: (decision: DD, engineDecision: DE) => R): ReadonlyArray<R & {
        id: GlobalAttributeId,
        key: GlobalAttributeIdKey
    }> => pipe(
        decisions ?? [],
        RA.map(d => ({
            attributeId: EtoD.mapGlobalAttributeId(d.attributeId),
            decision: d,
        })),
        RA.map(({attributeId, decision}) => ({
            id: attributeId,
            key: GlobalAttributeIdKeyBuilder(attributeId),
            ...resultBuilder(decisionMapper(decision), decision)
        }))
    );

    const booleanAttributeDecisions = transformDecisions(decisions.booleanDecisions, EtoD.mapBooleanDecision, (decision) => ({
        type: AttributeType.Boolean,
        decision: decision,
        nonOptimisticDecision: decision,
    })) satisfies ReadonlyArray<BooleanAttributeDecision>;

    const numericAttributeDecisions = transformDecisions(decisions.numericDecisions, EtoD.mapNumericDecision, (decision) => ({
        type: AttributeType.Numeric,
        decision: decision,
        nonOptimisticDecision: decision,
    })) satisfies ReadonlyArray<NumericAttributeDecision>;

    const componentAttributeDecisions = transformDecisions(decisions.componentDecisions, EtoD.mapComponentDecision, (decision) => ({
        type: AttributeType.Component,
        decision: decision,
        nonOptimisticDecision: decision,
    })) satisfies ReadonlyArray<ComponentAttributeDecision>;

    const choiceAttributeDecisions = transformDecisions(decisions.choiceValueDecisions, EtoD.mapChoiceValueDecision, (decision, engineDecision) => ({
        type: AttributeType.Choice,
        values: RA.of({
            id: engineDecision.choiceValueId,
            decision: decision,
            nonOptimisticDecision: decision,
        })
    })) satisfies ReadonlyArray<ChoiceAttributeDecision>;

    return pipe([
            ...booleanAttributeDecisions,
            ...numericAttributeDecisions,
            ...componentAttributeDecisions,
            ...choiceAttributeDecisions,
        ] as ReadonlyArray<AttributeDecision>,
        RA.map(a => [a.key, a] as [GlobalAttributeIdKey, AttributeDecision]),
        RM.fromFoldable(globalAttributeIdKeyEq, attributeDecisionSe, RA.Foldable),
    );
}

function getAttributeConsequences(consequences: Engine.Consequences): ReadonlyMap<GlobalAttributeIdKey, AttributeConsequence> {
    type BaseConsequence = { attributeId: Engine.GlobalAttributeId };
    const transformConsequences = <CE extends BaseConsequence, R>(decisions: CE[], resultBuilder: (consequence: CE) => R): ReadonlyArray<R & {
        id: GlobalAttributeId,
        key: GlobalAttributeIdKey
    }> => pipe(
        decisions ?? [],
        RA.map(d => ({
            attributeId: EtoD.mapGlobalAttributeId(d.attributeId),
            consequence: d,
        })),
        RA.map(({attributeId, consequence}) => ({
            id: attributeId,
            key: GlobalAttributeIdKeyBuilder(attributeId),
            ...resultBuilder(consequence)
        }))
    );

    const booleanAttributeConsequences = transformConsequences(consequences.booleanConsequences, (consequence) => ({
        type: AttributeType.Boolean,
        isSatisfied: consequence.isSatisfied,
        possibleDecisionStates: consequence.possibleDecisionStates,
        selection: mapSelection(consequence.selection),
    })) satisfies ReadonlyArray<BooleanAttributeConsequence>;

    const numericAttributeConsequences = transformConsequences(consequences.numericConsequences, (consequence) => ({
        type: AttributeType.Numeric,
        isSatisfied: consequence.isSatisfied,
        selection: mapSelection(consequence.selection),
        range: {
            max: consequence.range.max,
            min: consequence.range.min,
        },
        decimalPlaces: consequence.decimalPlaces,
    })) satisfies ReadonlyArray<NumericAttributeConsequence>;

    const componentAttributeConsequences = transformConsequences(consequences.componentConsequences, (consequence) => ({
        type: AttributeType.Component,
        isSatisfied: consequence.isSatisfied,
        possibleDecisionStates: pipe(consequence.possibleDecisionStates, RA.map(EtoD.mapPossibleDecisionStateToComponent)),
        inclusion: mapInclusion(consequence.inclusion),
        selection: consequence.selection ? EtoD.mapSelection(consequence.selection) : null,
    })) satisfies ReadonlyArray<ComponentAttributeConsequence>;

    const choiceAttributeConsequences = transformConsequences(consequences.choiceConsequences, (consequence) => ({
        type: AttributeType.Choice,
        isSatisfied: consequence.isSatisfied,
        cardinality: {
            lowerBound: consequence.cardinality.lowerBound,
            upperBound: consequence.cardinality.upperBound,
        },
        values: pipe(
            consequence.values ?? [],
            RA.map(v => ({
                id: v.choiceValueId,
                possibleDecisionStates: pipe(v.possibleDecisionStates, RA.map(EtoD.mapPossibleDecisionStateToChoice))
            } satisfies ChoiceValueConsequence))
        )
    })) satisfies ReadonlyArray<ChoiceAttributeConsequence>;

    return pipe(
        [
            ...booleanAttributeConsequences,
            ...numericAttributeConsequences,
            ...componentAttributeConsequences,
            ...choiceAttributeConsequences,
        ] as ReadonlyArray<AttributeConsequence>,
        RA.map(a => [a.key, a] as [GlobalAttributeIdKey, AttributeConsequence]),
        RM.fromFoldable(globalAttributeIdKeyEq, attributeConsequenceSe, RA.Foldable),
    );
}

function getAttributeMeta(meta: Engine.CompleteMeta | null): ReadonlyMap<GlobalAttributeIdKey, AttributeMeta> {
    return pipe(
        meta?.configurationModels ?? [],
        RA.chain(model => pipe(
            model.globalAttributeIds,
            RA.map(globalId => ({
                key: GlobalAttributeIdKeyBuilder(EtoD.mapGlobalAttributeId(globalId)),
                sourceId: {
                    localId: globalId.localId,
                    configurationModel: model.configurationModelId
                }
            } satisfies AttributeMeta))
        )),
        RA.map(a => [a.key, a] as [GlobalAttributeIdKey, AttributeMeta]),
        RM.fromFoldable(globalAttributeIdKeyEq, attributeMetaSe, RA.Foldable),
    );
}

export function integratePutManyDecisionsResponse(configuration: HashedConfiguration, response: Engine.PutManyDecisionsResponse): {
    configuration: HashedConfiguration,
    rawData: Partial<ConfigurationRawData>,
    result: SetManyResult
} {
    const {
        configuration: updatedConfiguration,
        rawData
    } = integratePutDecisionResponse(configuration, response satisfies Engine.PutDecisionResponse);
    const rejectedDecisions = mapToExplicitDecision(response.rejectedDecisions);

    return {
        configuration: updatedConfiguration,
        rawData: rawData,
        result: {
            rejectedDecisions: rejectedDecisions
        }
    };
}

export function processPutManyDecisionsConflict(decisions: ReadonlyArray<ExplicitDecision>, mode: SetManyMode): (error: Engine.Unspecified | Engine.PutManyDecisionsConflict) => Option<ConfiguratorError> {
    return error => {
        if (error.type !== "PutManyDecisionsConflict") {
            return none;
        }

        const constraintExplanations = pipe(error.constraintExplanations ?? [], RA.map(mapConstraintExplanation));
        const decisionExplanations = buildDecisionExplanations(error.decisionExplanations ?? [], decisions, mode);

        return some({
            type: ConfiguratorErrorType.SetManyDecisionsConflict,
            title: error.title ?? "",
            detail: error.detail ?? "",
            decisionExplanations: decisionExplanations,
            constraintExplanations: constraintExplanations
        } satisfies SetManyDecisionsConflict);
    };
}

export function processExplainResult(question: ExplainQuestion): (response: Engine.ExplainResult) => FullExplainAnswer {
    const result = processDecisionsExplainResult(question);

    return (response) => ({
        ...result(response.decisionExplanations),
        ...processConstraintsExplainResult(response.constraintExplanations)
    });
}

export function processDecisionsExplainResult(question: ExplainQuestion): (response: ReadonlyArray<Engine.DecisionExplanation>) => DecisionsExplainAnswer {
    const decision = match(question)
        .returnType<ExplicitDecision | null>()
        .with({question: ExplainQuestionType.whyIsStateNotPossible, subject: ExplainQuestionSubject.boolean}, q => ({
            type: AttributeType.Boolean,
            attributeId: q.attributeId,
            state: q.state
        } satisfies ExplicitBooleanDecision))
        .with({question: ExplainQuestionType.whyIsStateNotPossible, subject: ExplainQuestionSubject.numeric}, q => ({
            type: AttributeType.Numeric,
            attributeId: q.attributeId,
            state: q.state
        } satisfies ExplicitNumericDecision))
        .with({question: ExplainQuestionType.whyIsStateNotPossible, subject: ExplainQuestionSubject.component}, q => ({
            type: AttributeType.Component,
            attributeId: q.attributeId,
            state: q.state
        } satisfies ExplicitComponentDecision))
        .with({
            question: ExplainQuestionType.whyIsStateNotPossible,
            subject: ExplainQuestionSubject.choiceValue
        }, q => ({
            type: AttributeType.Choice,
            attributeId: q.attributeId,
            choiceValueId: q.choiceValueId,
            state: q.state
        } satisfies ExplicitChoiceDecision))
        .otherwise(() => null);

    return (response) => ({
        // TODO: Use automatic ConflictHandling if compatible with KeepExistingDecisions.
        decisionExplanations: buildDecisionExplanations(response, decision ?? [], {type: "KeepExistingDecisions"} satisfies SetManyKeepExistingDecisionsMode)
    });
}

export function processConstraintsExplainResult(response: ReadonlyArray<Engine.ConstraintExplanation>): ConstraintsExplainAnswer {
    return {
        constraintExplanations: pipe(response, RA.map(EtoD.mapConstraintExplanation))
    };
}

function buildDecisionExplanations(explanations: ReadonlyArray<Engine.DecisionExplanation>, decisions: RA.SingleOrArray<ExplicitDecision>, mode: SetManyMode) {
    return pipe(
        explanations,
        RA.map(mapDecisionExplanation),
        RA.map(e => {
            const undoCausingBooleanDecisions = pipe(
                e.causedByBooleanDecisions,
                RA.map(d => ({
                    type: AttributeType.Boolean,
                    attributeId: d.attributeId,
                    state: null
                } satisfies ExplicitBooleanDecision))
            );
            const undoCausingNumericDecisions = pipe(
                e.causedByNumericDecisions,
                RA.map(d => ({
                    type: AttributeType.Numeric,
                    attributeId: d.attributeId,
                    state: null
                } satisfies ExplicitNumericDecision))
            );
            const undoCausingComponentDecisions = pipe(
                e.causedByComponentDecisions,
                RA.map(d => ({
                    type: AttributeType.Component,
                    attributeId: d.attributeId,
                    state: null
                } satisfies ExplicitComponentDecision))
            );
            const undoCausingChoiceValueDecisions = pipe(
                e.causedByChoiceValueDecisions,
                RA.map(d => ({
                    type: AttributeType.Choice,
                    attributeId: d.attributeId,
                    choiceValueId: d.choiceValueId,
                    state: null
                } satisfies ExplicitChoiceDecision))
            );

            const causedByDecisions = pipe(
                e.causedByBooleanDecisions,
                RA.concat<CausedByDecision>(e.causedByNumericDecisions),
                RA.concat<CausedByDecision>(e.causedByComponentDecisions),
                RA.concat<CausedByDecision>(e.causedByChoiceValueDecisions)
            );
            const undoDecisions = pipe(
                undoCausingBooleanDecisions,
                RA.concat<ExplicitDecision>(undoCausingNumericDecisions),
                RA.concat<ExplicitDecision>(undoCausingComponentDecisions),
                RA.concat<ExplicitDecision>(undoCausingChoiceValueDecisions),
            );

            // Concat the undo decisions with original wanted decisions. Undo decisions have priority over the other.
            const solutionDecisions = RA.getUnionSemigroup(explicitDecisionByIdEq).concat(undoDecisions, RA.fromSingleOrArray(decisions));

            return {
                causedByDecisions: causedByDecisions,
                solution: {
                    mode: mode,
                    decisions: solutionDecisions
                }
            } satisfies DecisionExplanation;
        })
    );
}