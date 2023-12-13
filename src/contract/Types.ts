import {ConfigurationModelPackage} from "../apiClient/engine/models/generated/Engine";

import {Bool, Eq, Num, Str} from "@viamedici-spc/fp-ts-extensions";
import {getNullableEq, getNullTolerantReadOnlyArrayEq} from "../crossCutting/Eq";
import {match} from "ts-pattern";

type NonEmpty<T extends string = string> = T extends '' ? never : T;

export type SessionId = string;
export type LocalAttributeId = NonEmpty;
export type LocalRuleId = NonEmpty;
export type ChoiceValueId = NonEmpty;
export type ConfigurationModelId = NonEmpty;
export type ChannelId = NonEmpty;

export type GlobalAttributeId = {
    localId: LocalAttributeId,
    sharedConfigurationModelId?: ConfigurationModelId | null,
    componentPath?: LocalAttributeId[] | null
};

export const eqGlobalAttributeId = Eq.struct<GlobalAttributeId>({
    localId: Str.Eq,
    componentPath: getNullTolerantReadOnlyArrayEq(Str.Eq),
    sharedConfigurationModelId: getNullableEq(Str.Eq)
});

export type GlobalConstraintId = {
    localId: LocalRuleId,
    configurationModelId: ConfigurationModelId
};

export const eqGlobalConstraintId = Eq.struct<GlobalConstraintId>({
    localId: Str.Eq,
    configurationModelId: Str.Eq
});

export const eqCausedByDecision = Eq.fromEquals<CausedByDecision>((x: CausedByDecision, y: CausedByDecision) => {

    return match({x, y})
        .with({
            x: {type: AttributeType.Choice},
            y: {type: AttributeType.Choice}
        }, (v) => eqCausedByChoiceValueDecision.equals(v.x, v.y))
        .with({
            x: {type: AttributeType.Component},
            y: {type: AttributeType.Component}
        }, (v) => eqCausedByComponentDecision.equals(v.x, v.y))
        .with({
            x: {type: AttributeType.Numeric},
            y: {type: AttributeType.Numeric}
        }, (v) => eqCausedByNumericDecision.equals(v.x, v.y))
        .with({
            x: {type: AttributeType.Boolean},
            y: {type: AttributeType.Boolean}
        }, (v) => eqCausedByBooleanDecision.equals(v.x, v.y))
        .otherwise(() => false) as boolean;
});

const eqCausedByChoiceValueDecision = Eq.struct<CausedByChoiceValueDecision>({
    type: Str.Eq,
    attributeId: eqGlobalAttributeId,
    state: Str.Eq,
    choiceValueId: Str.Eq
});

const eqCausedByComponentDecision = Eq.struct<CausedByComponentDecision>({
    type: Str.Eq,
    attributeId: eqGlobalAttributeId,
    state: Str.Eq,
});

const eqCausedByNumericDecision = Eq.struct<CausedByNumericDecision>({
    type: Str.Eq,
    attributeId: eqGlobalAttributeId,
    state: Num.Eq,
});

const eqCausedByBooleanDecision = Eq.struct<CausedByBooleanDecision>({
    type: Str.Eq,
    attributeId: eqGlobalAttributeId,
    state: Bool.Eq,
});

// ---------------------------------------------------------------------------------------------------------------------
type ExplicitDecisionBase = {
    readonly type: AttributeType
    readonly attributeId: GlobalAttributeId
};

export type ExplicitDecision = ExplicitDecisionBase
    & (ExplicitChoiceDecision | ExplicitNumericDecision | ExplicitBooleanDecision | ExplicitComponentDecision);

export type ExplicitNumericDecision = ExplicitDecisionBase & {
    readonly type: AttributeType.Numeric,
    readonly state: number | null | undefined
};

export type ExplicitBooleanDecision = ExplicitDecisionBase & {
    readonly type: AttributeType.Boolean,
    readonly state: boolean | null | undefined
};

export type ExplicitChoiceDecision = ExplicitDecisionBase & {
    readonly type: AttributeType.Choice,
    readonly choiceValueId: ChoiceValueId,
    readonly state: ChoiceValueDecisionState | null | undefined
};

export type ExplicitComponentDecision = ExplicitDecisionBase & {
    readonly type: AttributeType.Component,
    readonly state: ComponentDecisionState | null | undefined
};

// ---------------------------------------------------------------------------------------------------------------------
type CausedByDecisionBase = {
    readonly type: AttributeType
    readonly attributeId: GlobalAttributeId
};

export type CausedByDecision = CausedByDecisionBase
    & (CausedByChoiceValueDecision | CausedByNumericDecision | CausedByBooleanDecision | CausedByComponentDecision);

export type CausedByNumericDecision = CausedByDecisionBase & {
    readonly type: AttributeType.Numeric,
    readonly state: number
};

export type CausedByBooleanDecision = CausedByDecisionBase & {
    readonly type: AttributeType.Boolean,
    readonly state: boolean
};

export type CausedByChoiceValueDecision = CausedByDecisionBase & {
    readonly type: AttributeType.Choice,
    readonly choiceValueId: string,
    readonly state: ChoiceValueDecisionState
};

export type CausedByComponentDecision = CausedByDecisionBase & {
    readonly type: AttributeType.Component,
    readonly state: ComponentDecisionState
};

// ---------------------------------------------------------------------------------------------------------------------
export type ExplainQuestion =
    WhyIsNotSatisfied
    | WhyIsStateNotPossible;

export enum ExplainQuestionType {
    whyIsNotSatisfied = "why-is-not-satisfied",
    whyIsStateNotPossible = "why-is-state-not-possible"
}

export enum ExplainQuestionSubject {
    choiceValue = "choice-value",
    component = "component",
    boolean = "boolean",
    numeric = "numeric",
    configuration = "configuration",
    attribute = "attribute"
}

export type WhyIsNotSatisfied =
    WhyIsConfigurationNotSatisfied
    | WhyIsAttributeNotSatisfied;

export type WhyIsConfigurationNotSatisfied = {
    question: ExplainQuestionType.whyIsNotSatisfied
    subject: ExplainQuestionSubject.configuration
}

export type WhyIsAttributeNotSatisfied = {
    question: ExplainQuestionType.whyIsNotSatisfied
    subject: ExplainQuestionSubject.attribute,
    attributeId: GlobalAttributeId
}

export type WhyIsStateNotPossible =
    WhyIsChoiceValueStateNotPossible
    | WhyIsNumericStateNotPossible
    | WhyIsBooleanStateNotPossible
    | WhyIsComponentStateNotPossible;

export type WhyIsChoiceValueStateNotPossible = {
    question: ExplainQuestionType.whyIsStateNotPossible,
    subject: ExplainQuestionSubject.choiceValue,
    attributeId: GlobalAttributeId,
    choiceValueId: ChoiceValueId,
    state: ChoiceValueDecisionState
}

export type WhyIsNumericStateNotPossible = {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.numeric,
    attributeId: GlobalAttributeId,
    state: number
}

export type WhyIsBooleanStateNotPossible = {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.boolean,
    attributeId: GlobalAttributeId,
    state: boolean
}

export type WhyIsComponentStateNotPossible = {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.component,
    attributeId: GlobalAttributeId,
    state: ComponentDecisionState
}

export type ExplainAnswer =
    DecisionsExplainAnswer
    | ConstraintsExplainAnswer
    | FullExplainAnswer;

export type DecisionsExplainAnswer = {
    decisionExplanations: ReadonlyArray<DecisionExplanation>;
}

export type ConstraintsExplainAnswer = {
    constraintExplanations: ReadonlyArray<ConstraintExplanation>;
}

export type FullExplainAnswer = DecisionsExplainAnswer & ConstraintsExplainAnswer;

export type DecisionExplanation = {
    causedByDecisions: ReadonlyArray<CausedByDecision>;
    solution?: ExplainSolution | null;
}

export type ConstraintExplanation = {
    causedByCardinalities: ReadonlyArray<GlobalAttributeId>;
    causedByRules: ReadonlyArray<GlobalConstraintId>;
}

export type ExplainSolution = {
    readonly decisions: ReadonlyArray<ExplicitDecision>;
    readonly mode: SetManyMode
}

export enum ConstraintType {
    Rule = "Rule",
    Cardinality = "Cardinality",
    Component = "Component",
}

// ---------------------------------------------------------------------------------------------------------------------
export type Configuration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyArray<Attribute>;
}

export type DecisionsToRespect = {
    readonly attributeId: GlobalAttributeId;
    readonly decisions: ReadonlyArray<GlobalAttributeId>;
}

export type AttributeRelations = ReadonlyArray<DecisionsToRespect>;

export type SessionContext = {
    readonly configurationModelSource: ConfigurationModelSource;
    readonly attributeRelations?: AttributeRelations | null;
    readonly usageRuleParameters?: Record<string, string> | null;
    readonly allowedInExplain?: AllowedInExplain | null;
}

export type AllowedInExplain = {
    rules?: AllowedRulesInExplain | null
};

export enum AllowedRulesInExplainType {
    all = "all",
    none = "none",
    specific = "specific"
}

export type AllowedRulesInExplain = AllowedRulesInExplainNone
    | AllowedRulesInExplainAll
    | AllowedRulesInExplainSpecific;

export type AllowedRulesInExplainNone = {
    type: AllowedRulesInExplainType.none
};

export type AllowedRulesInExplainAll = {
    type: AllowedRulesInExplainType.all
};

export type AllowedRulesInExplainSpecific = {
    type: AllowedRulesInExplainType.specific,
    rules: ReadonlyArray<GlobalConstraintId>
};

export enum ConfigurationModelSourceType {
    Channel = "Channel",
    Package = "Package"
}

type ConfigurationModelSourceBase = {
    type: ConfigurationModelSourceType;
}

export type ConfigurationModelSource =
    ConfigurationModelSourceBase
    & (ConfigurationModelFromChannel | ConfigurationModelFromPackage);


export type ConfigurationModelFromChannel = ConfigurationModelSourceBase & {
    type: ConfigurationModelSourceType.Channel;
    channel: string;
    deploymentName: string;
}

export type ConfigurationModelFromPackage = ConfigurationModelSourceBase & {
    type: ConfigurationModelSourceType.Package;
    configurationModelPackage: ConfigurationModelPackage;
}

export type SessionCreated = {
    readonly sessionId: string;
    readonly timeout: SessionTimeout;
}

export type SessionTimeout = {
    absolute: string;
    slidingInSeconds: number;
}

export type Attribute = BooleanAttribute | NumericAttribute | ChoiceAttribute | ComponentAttribute;

export enum AttributeType {
    Boolean = "Boolean",
    Numeric = "Numeric",
    Choice = "Choice",
    Component = "Component"
}

export type BaseAttribute = {
    readonly type: AttributeType;

    readonly id: GlobalAttributeId;
    readonly isSatisfied: boolean;
    readonly canContributeToConfigurationSatisfaction: boolean;
}

export type Decision<TState extends boolean | number | ComponentDecisionState | ChoiceValueDecisionState> = {
    readonly state: TState;
    readonly kind: DecisionKind;
}

export type BooleanAttribute = BaseAttribute & {
    readonly type: AttributeType.Boolean;

    readonly decision: Decision<boolean> | null;
    readonly possibleDecisionStates: ReadonlyArray<boolean>;
    readonly selection: Selection;
}

export type NumericAttribute = BaseAttribute & {
    readonly type: AttributeType.Numeric;

    readonly decision: Decision<number> | null;
    readonly range: Range;
    readonly decimalPlaces: number;
    readonly selection: Selection;
}

export type ComponentAttribute = BaseAttribute & {
    readonly type: AttributeType.Component;

    readonly decision: Decision<ComponentDecisionState> | null;
    readonly inclusion: Inclusion;
    readonly selection?: Selection;
    readonly possibleDecisionStates: ReadonlyArray<ComponentDecisionState>;
}

export type ChoiceAttribute = BaseAttribute & {
    readonly type: AttributeType.Choice;

    readonly values: ReadonlyArray<ChoiceValue>;
    readonly cardinality: Cardinality;
}

export type ChoiceValue = {
    readonly id: ChoiceValueId;
    readonly decision: Decision<ChoiceValueDecisionState> | null;
    readonly possibleDecisionStates: ReadonlyArray<ChoiceValueDecisionState>;
}

export enum ChoiceValueDecisionState {
    Included = "Included",
    Excluded = "Excluded"
}

export enum ComponentDecisionState {
    Included = "Included",
    Excluded = "Excluded"
}

export enum DecisionKind {
    Implicit = "Implicit",
    Explicit = "Explicit"
}

export enum Selection {
    Mandatory = "Mandatory",
    Optional = "Optional"
}

export enum Inclusion {
    Always = "Always",
    Optional = "Optional"
}

export type Cardinality = {
    readonly lowerBound: number
    readonly upperBound: number
}

export type Range = {
    readonly min: number
    readonly max: number
}

type SetManyModeBase = {
    type: string
}

export type SetManyMode =
    SetManyModeBase
    & (SetManyDefaultMode | SetManyKeepExistingDecisionsMode | SetManyDropExistingDecisionsMode);

export type SetManyDefaultMode = SetManyModeBase & {
    type: "Default"
}

export type SetManyDropExistingDecisionsMode = SetManyModeBase & {
    type: "DropExistingDecisions",
    conflictHandling: ConflictResolution
}

export type SetManyKeepExistingDecisionsMode = SetManyModeBase & {
    type: "KeepExistingDecisions"
}

export type ConflictResolutionBase = {
    type: string
}

export type ConflictResolution = ConflictResolutionBase & (ManualConflictResolution | AutomaticConflictResolution);

export type ManualConflictResolution = ConflictResolutionBase & {
    includeConstraintsInConflictExplanation: boolean;
    type: "Manual";
}

export type AutomaticConflictResolution = ConflictResolutionBase & {
    type: "Automatic";
}

export type ChangeSet = "TODO";