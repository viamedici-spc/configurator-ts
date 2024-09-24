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
    ChoiceAttribute,
    ClientSideSessionInitialisationOptions,
    ComponentAttribute,
    Configuration, ConfigurationChanges,
    ConfigurationModelFromChannel,
    ConfigurationModelFromPackage,
    ConfigurationModelSource,
    ConfigurationModelSourceType,
    ConflictResolution,
    ConstraintExplanation,
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
import {eqNullable} from "@viamedici-spc/fp-ts-extensions/Eq";
import {union} from "../crossCutting/EqExtensions";
import {getUnsortedArrayEq} from "../crossCutting/ReadonlyArrayExtensions";
import {
    AttributeConsequence,
    AttributeDecision,
    AttributeMeta,
    BooleanAttributeConsequence,
    BooleanAttributeDecision,
    ChoiceAttributeConsequence,
    ChoiceAttributeDecision,
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

export const conflictResolutionEq: EqT<ConflictResolution> = union<ConflictResolution>()
    .with((r): r is AutomaticConflictResolution => r.type === "Automatic", automaticConflictResolutionEq)
    .with((r): r is ManualConflictResolution => r.type === "Manual", manualConflictResolutionEq);

export const setManyDropExistingDecisionsModeEq: EqT<SetManyDropExistingDecisionsMode> = Eq.struct<SetManyDropExistingDecisionsMode>({
    type: Str.Eq,
    conflictHandling: conflictResolutionEq
});

export const setManyKeepExistingDecisionsModeEq: EqT<SetManyKeepExistingDecisionsMode> = Eq.struct<SetManyKeepExistingDecisionsMode>({
    type: Str.Eq,
});

export const setManyModeEq: EqT<SetManyMode> = union<SetManyMode>()
    .with((m): m is SetManyDropExistingDecisionsMode => m.type === "DropExistingDecisions", setManyDropExistingDecisionsModeEq)
    .with((m): m is SetManyKeepExistingDecisionsMode => m.type === "KeepExistingDecisions", setManyKeepExistingDecisionsModeEq);

export const explicitBooleanDecisionEq: EqT<ExplicitBooleanDecision> = Eq.struct<ExplicitBooleanDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: eqNullable(Bool.Eq),
});

export const explicitNumericDecisionEq: EqT<ExplicitNumericDecision> = Eq.struct<ExplicitNumericDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: eqNullable(Num.Eq),
});

export const explicitComponentDecisionEq: EqT<ExplicitComponentDecision> = Eq.struct<ExplicitComponentDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    state: eqNullable(Str.Eq),
});

export const explicitChoiceDecisionEq: EqT<ExplicitChoiceDecision> = Eq.struct<ExplicitChoiceDecision>({
    type: Str.Eq,
    attributeId: globalAttributeIdEq,
    choiceValueId: Str.Eq,
    state: eqNullable(Str.Eq),
});

export const explicitDecisionEq: EqT<ExplicitDecision> = union<ExplicitDecision>()
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
    decisions: getUnsortedArrayEq(explicitDecisionEq)
});

export const decisionExplanationEq: EqT<DecisionExplanation> = Eq.struct<DecisionExplanation>({
    causedByDecisions: getUnsortedArrayEq(explicitDecisionEq),
    solution: explainSolutionEq
});

export const constraintExplanationEq: EqT<ConstraintExplanation> = Eq.struct<ConstraintExplanation>({
    causedByCardinalities: getUnsortedArrayEq(globalAttributeIdEq),
    causedByRules: getUnsortedArrayEq(globalConstraintIdEq)
});

export const attributeMetaEq: EqT<AttributeMeta> = Eq.struct<AttributeMeta>({
    key: globalAttributeIdKeyEq,
    sourceId: Eq.struct({
        configurationModel: Str.Eq,
        localId: Str.Eq,
    })
});

export const booleanAttributeDecisionEq: EqT<BooleanAttributeDecision> = Eq.struct<BooleanAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: eqNullable(Eq.struct({
        state: Bool.Eq,
        kind: Str.Eq
    }))
});

export const numericAttributeDecisionEq: EqT<NumericAttributeDecision> = Eq.struct<NumericAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: eqNullable(Eq.struct({
        state: Num.Eq,
        kind: Str.Eq
    }))
});

export const componentAttributeDecisionEq: EqT<ComponentAttributeDecision> = Eq.struct<ComponentAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    decision: eqNullable(Eq.struct({
        state: Str.Eq,
        kind: Str.Eq
    }))
});

export const choiceAttributeDecisionEq: EqT<ChoiceAttributeDecision> = Eq.struct<ChoiceAttributeDecision>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    values: getUnsortedArrayEq(Eq.struct({
        id: Str.Eq,
        decision: eqNullable(Eq.struct({
            state: Str.Eq,
            kind: Str.Eq
        }))
    }))
});

export const attributeDecisionEq: EqT<AttributeDecision> = union<AttributeDecision>()
    .with((d): d is BooleanAttributeDecision => d.type === AttributeType.Boolean, booleanAttributeDecisionEq)
    .with((d): d is NumericAttributeDecision => d.type === AttributeType.Numeric, numericAttributeDecisionEq)
    .with((d): d is ComponentAttributeDecision => d.type === AttributeType.Component, componentAttributeDecisionEq)
    .with((d): d is ChoiceAttributeDecision => d.type === AttributeType.Choice, choiceAttributeDecisionEq);

export const booleanAttributeConsequenceEq: EqT<BooleanAttributeConsequence> = Eq.struct<BooleanAttributeConsequence>({
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    possibleDecisionStates: getUnsortedArrayEq(Bool.Eq),
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
    possibleDecisionStates: getUnsortedArrayEq(Str.Eq),
    isSatisfied: Bool.Eq,
    inclusion: Str.Eq,
    selection: eqNullable(Str.Eq),
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
    values: getUnsortedArrayEq(Eq.struct({
        id: Str.Eq,
        possibleDecisionStates: getUnsortedArrayEq(Str.Eq),
    }))
});

export const attributeConsequenceEq: EqT<AttributeConsequence> = union<AttributeConsequence>()
    .with((c): c is BooleanAttributeConsequence => c.type === AttributeType.Boolean, booleanAttributeConsequenceEq)
    .with((c): c is NumericAttributeConsequence => c.type === AttributeType.Numeric, numericAttributeConsequenceEq)
    .with((c): c is ComponentAttributeConsequence => c.type === AttributeType.Component, componentAttributeConsequenceEq)
    .with((c): c is ChoiceAttributeConsequence => c.type === AttributeType.Choice, choiceAttributeConsequenceEq);

const baseAttribute = {
    type: Str.Eq,
    id: globalAttributeIdEq,
    key: globalAttributeIdKeyEq,
    sourceId: eqNullable(Eq.struct({
        configurationModel: Str.Eq,
        localId: Str.Eq,
    })),
    canContributeToConfigurationSatisfaction: Bool.Eq,
    isSatisfied: Bool.Eq,
};

export const booleanAttributeEq: EqT<BooleanAttribute> = Eq.struct<BooleanAttribute>({
    ...baseAttribute,
    selection: Str.Eq,
    possibleDecisionStates: getUnsortedArrayEq(Bool.Eq),
    decision: eqNullable(Eq.struct({
        state: Bool.Eq,
        kind: Str.Eq
    })),
});

export const numericAttributeEq: EqT<NumericAttribute> = Eq.struct<NumericAttribute>({
    ...baseAttribute,
    selection: Str.Eq,
    range: Eq.struct({
        max: Num.Eq,
        min: Num.Eq,
    }),
    decimalPlaces: Num.Eq,
    decision: eqNullable(Eq.struct({
        state: Num.Eq,
        kind: Str.Eq
    })),
});

export const componentAttributeEq: EqT<ComponentAttribute> = Eq.struct<ComponentAttribute>({
    ...baseAttribute,
    inclusion: Str.Eq,
    selection: eqNullable(Str.Eq),
    possibleDecisionStates: getUnsortedArrayEq(Str.Eq),
    decision: eqNullable(Eq.struct({
        state: Str.Eq,
        kind: Str.Eq
    })),
});

export const choiceAttributeEq: EqT<ChoiceAttribute> = Eq.struct<ChoiceAttribute>({
    ...baseAttribute,
    cardinality: Eq.struct({
        upperBound: Num.Eq,
        lowerBound: Num.Eq,
    }),
    values: RM.getEq(Str.Eq, Eq.struct({
        id: Str.Eq,
        possibleDecisionStates: getUnsortedArrayEq(Str.Eq),
        decision: eqNullable(Eq.struct({
            state: Str.Eq,
            kind: Str.Eq
        })),
    }))
});

export const attributeEq: EqT<Attribute> = union<Attribute>()
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
    decisionExplanations: getUnsortedArrayEq(decisionExplanationEq),
    constraintExplanations: getUnsortedArrayEq(constraintExplanationEq),
});

export const setManyDecisionsConflictEq: EqT<SetManyDecisionsConflict> = Eq.struct<SetManyDecisionsConflict>({
    type: Str.Eq,
    title: Str.Eq,
    detail: Str.Eq,
    decisionExplanations: getUnsortedArrayEq(decisionExplanationEq),
    constraintExplanations: getUnsortedArrayEq(constraintExplanationEq),
});

const sessionInitialisationOptionsEq: EqT<ServerSideSessionInitialisationOptions | ClientSideSessionInitialisationOptions> = union<ServerSideSessionInitialisationOptions | ClientSideSessionInitialisationOptions>()
    .with((o): o is ClientSideSessionInitialisationOptions => (o as ClientSideSessionInitialisationOptions).accessToken != null, Eq.struct<ClientSideSessionInitialisationOptions>({
        accessToken: Str.Eq,
    }))
    .with((o): o is ServerSideSessionInitialisationOptions => (o as ServerSideSessionInitialisationOptions).sessionCreateUrl != null, Eq.struct<ServerSideSessionInitialisationOptions>({
        sessionCreateUrl: Str.Eq,
    }));

const allowedInExplain: EqT<AllowedInExplain> = Eq.struct<AllowedInExplain>({
    rules: eqNullable(union<AllowedRulesInExplain>()
        .with((a): a is AllowedRulesInExplainNone => a.type === AllowedRulesInExplainType.none, Eq.struct({type: Str.Eq}))
        .with((a): a is AllowedRulesInExplainAll => a.type === AllowedRulesInExplainType.all, Eq.struct({type: Str.Eq}))
        .with((a): a is AllowedRulesInExplainSpecific => a.type === AllowedRulesInExplainType.specific, Eq.struct({
            type: Str.Eq,
            rules: getUnsortedArrayEq(globalConstraintIdEq)
        })))
});

const decisionsToRespectEq: EqT<DecisionsToRespect> = Eq.struct<DecisionsToRespect>({
    attributeId: globalAttributeIdEq,
    decisions: getUnsortedArrayEq(globalAttributeIdEq)
});

const configurationModelSourceEq: EqT<ConfigurationModelSource> = union<ConfigurationModelSource>()
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
    apiBaseUrl: eqNullable(Str.Eq),
    sessionInitialisationOptions: sessionInitialisationOptionsEq,
    configurationModelSource: configurationModelSourceEq,
    provideSourceId: eqNullable(Bool.Eq),
    optimisticDecisionOptions: eqNullable(Eq.struct<OptimisticDecisionOptions>({
        restoreConfiguration: eqNullable(Bool.Eq),
        applySolution: eqNullable(Bool.Eq),
        makeDecision: eqNullable(Bool.Eq),
        setMany: eqNullable(Bool.Eq)
    })),
    allowedInExplain: eqNullable(allowedInExplain),
    usageRuleParameters: eqNullable(RR.getEq(Str.Eq)),
    attributeRelations: eqNullable(getUnsortedArrayEq(decisionsToRespectEq))
});

export const configurationRawDataEq: EqT<ConfigurationRawData> = Eq.struct<ConfigurationRawData>({
    isSatisfied: Bool.Eq,
    canContributeToSatisfaction: getUnsortedArrayEq(globalAttributeIdKeyEq),
    meta: RM.getEq(globalAttributeIdKeyEq, attributeMetaEq),
    decisions: RM.getEq(globalAttributeIdKeyEq, attributeDecisionEq),
    consequences: RM.getEq(globalAttributeIdKeyEq, attributeConsequenceEq),
});

export const configurationChangesEq: EqT<ConfigurationChanges> = Eq.struct<ConfigurationChanges>({
    isSatisfied: eqNullable(Bool.Eq),
    attributes: Eq.struct({
        added: getUnsortedArrayEq(attributeEq),
        changed: getUnsortedArrayEq(attributeEq),
        removed: getUnsortedArrayEq(globalAttributeIdEq),
    })
});