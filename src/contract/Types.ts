import {ExplainQuestionBuilder} from "./ExplainQuestionBuilder";
import * as Engine from "../apiClient/engine/Engine";

export type LocalAttributeId = string;
export type LocalRuleId = string;
export type ChoiceValueId = string;
export type ConfigurationModelId = string;
export type ChannelId = string;

export type SourceAttributeId = {
    readonly configurationModel: ConfigurationModelId;
    readonly localId: LocalAttributeId;
};

export type GlobalAttributeIdKey = string;

export type GlobalAttributeId = {
    readonly localId: LocalAttributeId,
    readonly sharedConfigurationModelId?: ConfigurationModelId,
    readonly componentPath?: ReadonlyArray<LocalAttributeId>
};

export type GlobalConstraintId = {
    localId: LocalRuleId,
    configurationModelId: ConfigurationModelId
};

// ---------------------------------------------------------------------------------------------------------------------
type BaseExplicitDecision = {
    readonly type: AttributeType
    readonly attributeId: GlobalAttributeId
};

export type ExplicitDecision = BaseExplicitDecision
    & (ExplicitChoiceDecision | ExplicitNumericDecision | ExplicitBooleanDecision | ExplicitComponentDecision);

export type ExplicitNumericDecision = BaseExplicitDecision & {
    readonly type: AttributeType.Numeric,
    readonly state: number | null | undefined
};

export type ExplicitBooleanDecision = BaseExplicitDecision & {
    readonly type: AttributeType.Boolean,
    readonly state: boolean | null | undefined
};

export type ExplicitChoiceDecision = BaseExplicitDecision & {
    readonly type: AttributeType.Choice,
    readonly choiceValueId: ChoiceValueId,
    readonly state: ChoiceValueDecisionState | null | undefined
};

export type ExplicitComponentDecision = BaseExplicitDecision & {
    readonly type: AttributeType.Component,
    readonly state: ComponentDecisionState | null | undefined
};

// ---------------------------------------------------------------------------------------------------------------------
type BaseCausedByDecision = {
    readonly type: AttributeType
    readonly attributeId: GlobalAttributeId
};

export type CausedByDecision = BaseCausedByDecision
    & (CausedByChoiceValueDecision | CausedByNumericDecision | CausedByBooleanDecision | CausedByComponentDecision);

export type CausedByNumericDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Numeric,
    readonly state: number
};

export type CausedByBooleanDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Boolean,
    readonly state: boolean
};

export type CausedByChoiceValueDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Choice,
    readonly choiceValueId: ChoiceValueId,
    readonly state: ChoiceValueDecisionState
};

export type CausedByComponentDecision = BaseCausedByDecision & {
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
    solution: ExplainSolution;
}

export type ConstraintExplanation = {
    causedByCardinalities: ReadonlyArray<GlobalAttributeId>;
    causedByRules: ReadonlyArray<GlobalConstraintId>;
}

export type ExplainSolution = {
    readonly decisions: ReadonlyArray<ExplicitDecision>;
    readonly mode: SetManyMode
}

// ---------------------------------------------------------------------------------------------------------------------
export type Configuration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyMap<GlobalAttributeIdKey, Attribute>;
}

export type DecisionsToRespect = {
    readonly attributeId: GlobalAttributeId;
    readonly decisions: ReadonlyArray<GlobalAttributeId>;
}

export type AttributeRelations = ReadonlyArray<DecisionsToRespect>;

export type ClientSideSessionInitialisationOptions = {
    readonly accessToken: string;
};
export type ServerSideSessionInitialisationOptions = {
    readonly sessionCreateUrl: string;
};

export type SessionContext = {
    readonly apiBaseUrl?: string;
    readonly sessionInitialisationOptions: ClientSideSessionInitialisationOptions | ServerSideSessionInitialisationOptions;
    readonly configurationModelSource: ConfigurationModelSource;
    readonly attributeRelations?: AttributeRelations | null;
    readonly usageRuleParameters?: Record<string, string> | null;
    readonly allowedInExplain?: AllowedInExplain | null;
    readonly optimisticDecisionOptions?: OptimisticDecisionOptions | null;
    readonly provideSourceId?: boolean | null;
}

export type OptimisticDecisionOptions = {
    readonly makeDecision?: boolean | null;
    readonly setMany?: boolean | null;
    readonly applySolution?: boolean | null;
    readonly restoreConfiguration?: boolean | null;
};

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

export type ConfigurationModelFromChannel = {
    type: ConfigurationModelSourceType.Channel;
    channel: ChannelId;
    deploymentName: string;
}

export type ConfigurationModelFromPackage = {
    type: ConfigurationModelSourceType.Package;
    configurationModelPackage: Engine.ConfigurationModelPackage;
}

export type ConfigurationModelSource = ConfigurationModelFromChannel | ConfigurationModelFromPackage;

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
    readonly key: GlobalAttributeIdKey;

    /**
     * @remarks To enable the sourceId, set provideSourceId to true in SessionContext. Otherwise, it stays undefined.
     */
    readonly sourceId?: SourceAttributeId;
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
    readonly selection: Selection | null;
    readonly possibleDecisionStates: ReadonlyArray<ComponentDecisionState>;
}

export type ChoiceAttribute = BaseAttribute & {
    readonly type: AttributeType.Choice;

    readonly values: ReadonlyMap<ChoiceValueId, ChoiceValue>;
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

export type BaseCollectedDecision<T extends number | boolean | ChoiceValueDecisionState | ComponentDecisionState> =
    Decision<T>
    & {
    readonly attributeType: AttributeType;

    readonly attributeId: GlobalAttributeId;
    readonly attributeKey: GlobalAttributeIdKey;
};

export type CollectedBooleanDecision = BaseCollectedDecision<boolean> & {
    readonly attributeType: AttributeType.Boolean;
};

export type CollectedNumericDecision = BaseCollectedDecision<number> & {
    readonly attributeType: AttributeType.Numeric;
};

export type CollectedComponentDecision = BaseCollectedDecision<ComponentDecisionState> & {
    readonly attributeType: AttributeType.Component;
};

export type CollectedChoiceDecision = BaseCollectedDecision<ChoiceValueDecisionState> & {
    readonly attributeType: AttributeType.Choice;
    readonly choiceValueId: ChoiceValueId;
}

export type CollectedDecision =
    CollectedBooleanDecision
    | CollectedNumericDecision
    | CollectedComponentDecision
    | CollectedChoiceDecision;

export type CollectedImplicitDecision = CollectedDecision & { kind: DecisionKind.Implicit };
export type CollectedExplicitDecision = CollectedDecision & { kind: DecisionKind.Explicit };

export type SetManyMode = SetManyKeepExistingDecisionsMode | SetManyDropExistingDecisionsMode;

export type SetManyDropExistingDecisionsMode = {
    type: "DropExistingDecisions",
    conflictHandling: ConflictResolution
}

export type SetManyKeepExistingDecisionsMode = {
    type: "KeepExistingDecisions"
}

export type ConflictResolution = ManualConflictResolution | AutomaticConflictResolution;

export type ManualConflictResolution = {
    type: "Manual";
    includeConstraintsInConflictExplanation: boolean;
}

export type AutomaticConflictResolution = {
    type: "Automatic";
}

export type ConfigurationChanges = {
    readonly isSatisfied: boolean | null,
    readonly attributes: {
        readonly added: ReadonlyArray<Attribute>,
        readonly changed: ReadonlyArray<Attribute>,
        readonly removed: ReadonlyArray<GlobalAttributeId>
    }
}

export type OnConfigurationChangedHandler = (configuration: Configuration, configurationChanges: ConfigurationChanges) => void;

export type OnCanResetConfigurationChangedHandler = (canResetConfiguration: boolean) => void;

export type ExplainQuestionParam = ExplainQuestion | ((b: ExplainQuestionBuilder) => ExplainQuestion);

export type SetManyResult = {
    readonly rejectedDecisions: ReadonlyArray<ExplicitDecision>
};

export type Subscription = {
    readonly unsubscribe: () => void
};