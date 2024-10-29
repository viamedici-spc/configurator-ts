import {Bool, Eq, EqT, Num, O, pipe, RA, RM, RR, some, Str} from "@viamedici-spc/fp-ts-extensions";
import {
    AllowedInExplain,
    AllowedRulesInExplain,
    AllowedRulesInExplainAll,
    AllowedRulesInExplainNone,
    AllowedRulesInExplainSpecific,
    AllowedRulesInExplainType,
    Attribute,
    AttributeType,
    AutomaticConflictResolution,
    BooleanAttribute,
    ChoiceAttribute, ChoiceValue, ChoiceValueDecisionState,
    ClientSideSessionInitialisationOptions,
    ComponentAttribute, ComponentDecisionState,
    Configuration, ConfigurationChanges,
    ConfigurationModelFromChannel,
    ConfigurationModelFromPackage,
    ConfigurationModelSource,
    ConfigurationModelSourceType,
    ConflictResolution,
    ConstraintExplanation, Decision,
    DecisionExplanation,
    DecisionsToRespect,
    ExplainSolution,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision,
    FullExplainAnswer,
    GlobalAttributeId,
    GlobalAttributeIdKey,
    GlobalConstraintId,
    ManualConflictResolution,
    NumericAttribute,
    OptimisticDecisionOptions,
    ServerSideSessionInitialisationOptions,
    SessionContext,
    SetManyDropExistingDecisionsMode,
    SetManyKeepExistingDecisionsMode,
    SetManyMode
} from "./Types";
import {
    AttributeConsequence,
    AttributeDecision,
    AttributeMeta,
    BooleanAttributeConsequence,
    BooleanAttributeDecision,
    ChoiceAttributeConsequence,
    ChoiceAttributeDecision, ChoiceValueDecision,
    ComponentAttributeConsequence,
    ComponentAttributeDecision,
    NumericAttributeConsequence,
    NumericAttributeDecision
} from "../domain/model/PartialAttribute";
import HashedConfiguration from "../domain/model/HashedConfiguration";
import {HashedAttribute} from "../domain/model/HashedAttribute";
import {SetManyDecisionsConflict} from "./ConfiguratorError";
import {deepEqual} from "fast-equals";
import ConfigurationRawData from "../domain/model/ConfigurationRawData";
import {match} from "ts-pattern";
import {none} from "fp-ts/Option";

export const globalAttributeIdKeyEq: EqT<GlobalAttributeIdKey> = Str.Eq;
export const globalAttributeIdEq = Eq.struct<GlobalAttributeId>({
    localId: Str.Eq,
    componentPath: pipe(
        RA.getEq(Str.Eq),
        Eq.contramap((a: ReadonlyArray<string> | null | undefined) => a ?? [])
    ),
    sharedConfigurationModelId: Eq.eqNullable(Str.Eq),
});

export const globalConstraintIdEq = Eq.struct<GlobalConstraintId>({
    localId: Str.Eq,
    configurationModelId: Str.Eq
});

export const manualConflictResolutionEq: EqT<ManualConflictResolution> = Eq.struct<ManualConflictResolution>({
    type: Str.Eq,
    includeConstraintsInConflictExplanation: Bool.Eq
});

export const automaticConflictResolutionEq: EqT<AutomaticConflictResolution> = Eq.struct<AutomaticConflictResolution>({
    type: Str.Eq,
});

export const conflictResolutionEq: EqT<ConflictResolution> = Eq.union<ConflictResolution>()
    .with((r): r is AutomaticConflictResolution => r.type === "Automatic", automaticConflictResolutionEq)
    .with((r): r is ManualConflictResolution => r.type === "Manual", manualConflictResolutionEq);

export const setManyDropExistingDecisionsModeEq: EqT<SetManyDropExistingDecisionsMode> = Eq.struct<SetManyDropExistingDecisionsMode>({
    type: Str.Eq,
    conflictHandling: conflictResolutionEq
});

export const setManyKeepExistingDecisionsModeEq: EqT<SetManyKeepExistingDecisionsMode> = Eq.struct<SetManyKeepExistingDecisionsMode>({
    type: Str.Eq,
});

export const setManyModeEq: EqT<SetManyMode> = Eq.union<SetManyMode>()
    .with((m): m is SetManyDropExistingDecisionsMode => m.type === "DropExistingDecisions", setManyDropExistingDecisionsModeEq)
    .with((m): m is SetManyKeepExistingDecisionsMode => m.type === "KeepExistingDecisions", setManyKeepExistingDecisionsModeEq);

export const explicitBooleanDecisionEq: EqT<ExplicitBooleanDecision> = Eq.struct<ExplicitBooleanDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: Eq.eqNullable(Bool.Eq),
});

export const explicitNumericDecisionEq: EqT<ExplicitNumericDecision> = Eq.struct<ExplicitNumericDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: Eq.eqNullable(Num.Eq),
});

export const explicitComponentDecisionEq: EqT<ExplicitComponentDecision> = Eq.struct<ExplicitComponentDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: Eq.eqNullable(Str.Eq),
});

export const explicitChoiceDecisionEq: EqT<ExplicitChoiceDecision> = Eq.struct<ExplicitChoiceDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    choiceValueId: Str.Eq,
    state: Eq.eqNullable(Str.Eq),
});

export const explicitDecisionEq: EqT<ExplicitDecision> = Eq.union<ExplicitDecision>()
    .with((d): d is ExplicitBooleanDecision => d.type === AttributeType.Boolean, explicitBooleanDecisionEq)
    .with((d): d is ExplicitNumericDecision => d.type === AttributeType.Numeric, explicitNumericDecisionEq)
    .with((d): d is ExplicitComponentDecision => d.type === AttributeType.Component, explicitComponentDecisionEq)
    .with((d): d is ExplicitChoiceDecision => d.type === AttributeType.Choice, explicitChoiceDecisionEq);

export const explicitDecisionByIdEq = pipe(
    Eq.struct({
        attributeId: globalAttributeIdEq,
        choiceValueId: O.getEq(Str.Eq)
    }),
    Eq.contramap((d: ExplicitDecision) => match(d)
        .with({type: AttributeType.Choice}, c => ({
            attributeId: c.attributeId,
            choiceValueId: some(c.choiceValueId)
        }))
        .otherwise(d => ({
            attributeId: d.attributeId,
            choiceValueId: none
        })))
);

export const explainSolutionEq: EqT<ExplainSolution> = Eq.struct<ExplainSolution>({
    mode: setManyModeEq,
    decisions: RA.getUnsortedArrayEq(explicitDecisionEq)
});

export const decisionExplanationEq: EqT<DecisionExplanation> = Eq.struct<DecisionExplanation>({
    causedByDecisions: RA.getUnsortedArrayEq(explicitDecisionEq),
    solution: explainSolutionEq
});

export const constraintExplanationEq: EqT<ConstraintExplanation> = Eq.struct<ConstraintExplanation>({
    causedByCardinalities: RA.getUnsortedArrayEq(globalAttributeIdEq),
    causedByRules: RA.getUnsortedArrayEq(globalConstraintIdEq)
});

export const attributeMetaEq: EqT<AttributeMeta> = Eq.struct<AttributeMeta>({
    key: globalAttributeIdKeyEq,
    sourceId: Eq.struct({
        configurationModel: Str.Eq,
        localId: Str.Eq,
    })
});

const nullableBooleanDecisionEq: EqT<Decision<boolean> | null> = Eq.eqNullable(Eq.struct<Decision<boolean>>({
    state: Bool.Eq,
    kind: Str.Eq
}));
export const booleanAttributeDecisionEq: EqT<BooleanAttributeDecision> = Eq.struct<BooleanAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: nullableBooleanDecisionEq,
    nonOptimisticDecision: nullableBooleanDecisionEq,
});

const nullableNumericDecisionEq: EqT<Decision<number> | null> = Eq.eqNullable(Eq.struct<Decision<number>>({
    state: Num.Eq,
    kind: Str.Eq
}));
export const numericAttributeDecisionEq: EqT<NumericAttributeDecision> = Eq.struct<NumericAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: nullableNumericDecisionEq,
    nonOptimisticDecision: nullableNumericDecisionEq,
});

const nullableComponentDecisionEq: EqT<Decision<ComponentDecisionState> | null> = Eq.eqNullable(Eq.struct<Decision<ComponentDecisionState>>({
    state: Str.Eq,
    kind: Str.Eq
}));
export const componentAttributeDecisionEq: EqT<ComponentAttributeDecision> = Eq.struct<ComponentAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: nullableComponentDecisionEq,
    nonOptimisticDecision: nullableComponentDecisionEq,
});

const nullableChoiceValueDecisionEq: EqT<Decision<ChoiceValueDecisionState> | null> = Eq.eqNullable(Eq.struct<Decision<ChoiceValueDecisionState>>({
    state: Str.Eq,
    kind: Str.Eq
}));
export const choiceAttributeDecisionEq: EqT<ChoiceAttributeDecision> = Eq.struct<ChoiceAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    values: RA.getUnsortedArrayEq(Eq.struct<ChoiceValueDecision>({
        id: Str.Eq,
        decision: nullableChoiceValueDecisionEq,
        nonOptimisticDecision: nullableChoiceValueDecisionEq,
    }))
});

export const attributeDecisionEq: EqT<AttributeDecision> = Eq.union<AttributeDecision>()
    .with((d): d is BooleanAttributeDecision => d.type === AttributeType.Boolean, booleanAttributeDecisionEq)
    .with((d): d is NumericAttributeDecision => d.type === AttributeType.Numeric, numericAttributeDecisionEq)
    .with((d): d is ComponentAttributeDecision => d.type === AttributeType.Component, componentAttributeDecisionEq)
    .with((d): d is ChoiceAttributeDecision => d.type === AttributeType.Choice, choiceAttributeDecisionEq);

export const booleanAttributeConsequenceEq: EqT<BooleanAttributeConsequence> = Eq.struct<BooleanAttributeConsequence>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    possibleDecisionStates: RA.getUnsortedArrayEq(Bool.Eq),
    selection: Str.Eq,
    isSatisfied: Bool.Eq
});

export const numericAttributeConsequenceEq: EqT<NumericAttributeConsequence> = Eq.struct<NumericAttributeConsequence>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    range: Eq.struct({
        max: Num.Eq,
        min: Num.Eq,
    }),
    isSatisfied: Bool.Eq,
    selection: Str.Eq,
    decimalPlaces: Num.Eq,
});

export const componentAttributeConsequenceEq: EqT<ComponentAttributeConsequence> = Eq.struct<ComponentAttributeConsequence>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    possibleDecisionStates: RA.getUnsortedArrayEq(Str.Eq),
    isSatisfied: Bool.Eq,
    inclusion: Str.Eq,
    selection: Eq.eqNullable(Str.Eq),
});

export const choiceAttributeConsequenceEq: EqT<ChoiceAttributeConsequence> = Eq.struct<ChoiceAttributeConsequence>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    isSatisfied: Bool.Eq,
    cardinality: Eq.struct({
        upperBound: Num.Eq,
        lowerBound: Num.Eq,
    }),
    values: RA.getUnsortedArrayEq(Eq.struct({
        id: Str.Eq,
        possibleDecisionStates: RA.getUnsortedArrayEq(Str.Eq),
    }))
});

export const attributeConsequenceEq: EqT<AttributeConsequence> = Eq.union<AttributeConsequence>()
    .with((c): c is BooleanAttributeConsequence => c.type === AttributeType.Boolean, booleanAttributeConsequenceEq)
    .with((c): c is NumericAttributeConsequence => c.type === AttributeType.Numeric, numericAttributeConsequenceEq)
    .with((c): c is ComponentAttributeConsequence => c.type === AttributeType.Component, componentAttributeConsequenceEq)
    .with((c): c is ChoiceAttributeConsequence => c.type === AttributeType.Choice, choiceAttributeConsequenceEq);

const baseAttribute = {
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    sourceId: Eq.eqNullable(Eq.struct({
        configurationModel: Str.Eq,
        localId: Str.Eq,
    })),
    canContributeToConfigurationSatisfaction: Bool.Eq,
    isSatisfied: Bool.Eq,
};

export const booleanAttributeEq: EqT<BooleanAttribute> = Eq.struct<BooleanAttribute>({
    ...baseAttribute,
    selection: Str.Eq,
    possibleDecisionStates: RA.getUnsortedArrayEq(Bool.Eq),
    decision: nullableBooleanDecisionEq,
    nonOptimisticDecision: nullableBooleanDecisionEq,
});

export const numericAttributeEq: EqT<NumericAttribute> = Eq.struct<NumericAttribute>({
    ...baseAttribute,
    selection: Str.Eq,
    range: Eq.struct({
        max: Num.Eq,
        min: Num.Eq,
    }),
    decimalPlaces: Num.Eq,
    decision: nullableNumericDecisionEq,
    nonOptimisticDecision: nullableNumericDecisionEq,
});

export const componentAttributeEq: EqT<ComponentAttribute> = Eq.struct<ComponentAttribute>({
    ...baseAttribute,
    inclusion: Str.Eq,
    selection: Eq.eqNullable(Str.Eq),
    possibleDecisionStates: RA.getUnsortedArrayEq(Str.Eq),
    decision: nullableComponentDecisionEq,
    nonOptimisticDecision: nullableComponentDecisionEq,
});

export const choiceAttributeEq: EqT<ChoiceAttribute> = Eq.struct<ChoiceAttribute>({
    ...baseAttribute,
    cardinality: Eq.struct({
        upperBound: Num.Eq,
        lowerBound: Num.Eq,
    }),
    values: RM.getEq(Str.Eq, Eq.struct<ChoiceValue>({
        id: Str.Eq,
        possibleDecisionStates: RA.getUnsortedArrayEq(Str.Eq),
        decision: nullableChoiceValueDecisionEq,
        nonOptimisticDecision: nullableChoiceValueDecisionEq,
    }))
});

export const attributeEq: EqT<Attribute> = Eq.union<Attribute>()
    .with((a): a is BooleanAttribute => a.type === AttributeType.Boolean, booleanAttributeEq)
    .with((a): a is NumericAttribute => a.type === AttributeType.Numeric, numericAttributeEq)
    .with((a): a is ComponentAttribute => a.type === AttributeType.Component, componentAttributeEq)
    .with((a): a is ChoiceAttribute => a.type === AttributeType.Choice, choiceAttributeEq);

export const hashedAttributeEq: EqT<HashedAttribute> = Eq.fromEquals((x, y) => x.hash === y.hash);

export const configurationEq: EqT<Configuration> = Eq.struct({
    isSatisfied: Bool.Eq,
    attributes: RM.getEq(globalAttributeIdKeyEq, attributeEq)
});

export const hashedConfigurationEq: EqT<HashedConfiguration> = Eq.struct<HashedConfiguration>({
    isSatisfied: Bool.Eq,
    attributes: RM.getEq(globalAttributeIdKeyEq, hashedAttributeEq)
});

export const fullExplainAnswerEq: EqT<FullExplainAnswer> = Eq.struct<FullExplainAnswer>({
    decisionExplanations: RA.getUnsortedArrayEq(decisionExplanationEq),
    constraintExplanations: RA.getUnsortedArrayEq(constraintExplanationEq),
});

export const setManyDecisionsConflictEq: EqT<SetManyDecisionsConflict> = Eq.struct<SetManyDecisionsConflict>({
    type: Str.Eq,
    title: Str.Eq,
    detail: Str.Eq,
    decisionExplanations: RA.getUnsortedArrayEq(decisionExplanationEq),
    constraintExplanations: RA.getUnsortedArrayEq(constraintExplanationEq),
});

const sessionInitialisationOptionsEq: EqT<ServerSideSessionInitialisationOptions | ClientSideSessionInitialisationOptions> = Eq.union<ServerSideSessionInitialisationOptions | ClientSideSessionInitialisationOptions>()
    .with((o): o is ClientSideSessionInitialisationOptions => (o as ClientSideSessionInitialisationOptions).accessToken != null, Eq.struct<ClientSideSessionInitialisationOptions>({
        accessToken: Str.Eq,
    }))
    .with((o): o is ServerSideSessionInitialisationOptions => (o as ServerSideSessionInitialisationOptions).sessionCreateUrl != null, Eq.struct<ServerSideSessionInitialisationOptions>({
        sessionCreateUrl: Str.Eq,
    }));

const allowedInExplain: EqT<AllowedInExplain> = Eq.struct<AllowedInExplain>({
    rules: Eq.eqNullable(Eq.union<AllowedRulesInExplain>()
        .with((a): a is AllowedRulesInExplainNone => a.type === AllowedRulesInExplainType.none, Eq.struct({type: Str.Eq}))
        .with((a): a is AllowedRulesInExplainAll => a.type === AllowedRulesInExplainType.all, Eq.struct({type: Str.Eq}))
        .with((a): a is AllowedRulesInExplainSpecific => a.type === AllowedRulesInExplainType.specific, Eq.struct({
            type: Str.Eq,
            rules: RA.getUnsortedArrayEq(globalConstraintIdEq)
        })))
});

const decisionsToRespectEq: EqT<DecisionsToRespect> = Eq.struct<DecisionsToRespect>({
    attributeId: globalAttributeIdEq,
    decisions: RA.getUnsortedArrayEq(globalAttributeIdEq)
});

const configurationModelSourceEq: EqT<ConfigurationModelSource> = Eq.union<ConfigurationModelSource>()
    .with((s): s is ConfigurationModelFromChannel => s.type === ConfigurationModelSourceType.Channel, Eq.struct<ConfigurationModelFromChannel>({
        type: Str.Eq,
        channel: Str.Eq,
        deploymentName: Str.Eq
    }))
    .with((s): s is ConfigurationModelFromPackage => s.type === ConfigurationModelSourceType.Package, Eq.struct<ConfigurationModelFromPackage>({
        type: Str.Eq,
        configurationModelPackage: Eq.fromEquals(deepEqual)
    }));

export const sessionContextEq: EqT<SessionContext> = Eq.struct<SessionContext>({
    apiBaseUrl: Eq.eqNullable(Str.Eq),
    sessionInitialisationOptions: sessionInitialisationOptionsEq,
    configurationModelSource: configurationModelSourceEq,
    provideSourceId: Eq.eqNullable(Bool.Eq),
    optimisticDecisionOptions: Eq.eqNullable(Eq.struct<OptimisticDecisionOptions>({
        restoreConfiguration: Eq.eqNullable(Bool.Eq),
        applySolution: Eq.eqNullable(Bool.Eq),
        makeDecision: Eq.eqNullable(Bool.Eq),
        setMany: Eq.eqNullable(Bool.Eq)
    })),
    allowedInExplain: Eq.eqNullable(allowedInExplain),
    usageRuleParameters: Eq.eqNullable(RR.getEq(Str.Eq)),
    attributeRelations: Eq.eqNullable(RA.getUnsortedArrayEq(decisionsToRespectEq))
});

export const configurationRawDataEq: EqT<ConfigurationRawData> = Eq.struct<ConfigurationRawData>({
    isSatisfied: Bool.Eq,
    canContributeToSatisfaction: RA.getUnsortedArrayEq(globalAttributeIdKeyEq),
    meta: RM.getEq(globalAttributeIdKeyEq, attributeMetaEq),
    decisions: RM.getEq(globalAttributeIdKeyEq, attributeDecisionEq),
    consequences: RM.getEq(globalAttributeIdKeyEq, attributeConsequenceEq),
});

export const configurationChangesEq: EqT<ConfigurationChanges> = Eq.struct<ConfigurationChanges>({
    isSatisfied: Eq.eqNullable(Bool.Eq),
    attributes: Eq.struct({
        added: RA.getUnsortedArrayEq(attributeEq),
        changed: RA.getUnsortedArrayEq(attributeEq),
        removed: RA.getUnsortedArrayEq(globalAttributeIdEq),
    })
});