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
    /**
     * The access token used for authenticating with the Headless Configuration Engine (HCE) API.
     */
    readonly accessToken: string;
};

export type ServerSideSessionInitialisationOptions = {
    /**
     * The API endpoint of your backend, which will be contacted to create the session.
     * @remarks You can modify and enrich the session context during the server-side session creation process.
     */
    readonly sessionCreateUrl: string;
};

export type SessionContext = {
    /**
     * The base URL for the Headless Configuration Engine (HCE) API.
     * @default SPC production environment
     */
    readonly apiBaseUrl?: string;

    /**
     * Defines whether the session should be created client-side or server-side.
     * Use {@link ClientSideSessionInitialisationOptions} for client-side session creation with all parameters.
     * Use {@link ServerSideSessionInitialisationOptions} for server-side session creation, especially when dealing with security-sensitive parameters (e.g. access token).
     */
    readonly sessionInitialisationOptions: ClientSideSessionInitialisationOptions | ServerSideSessionInitialisationOptions;

    /**
     * Specifies the source of the configuration model.
     * Use {@link ConfigurationModelFromChannel} if you want to use a deployed configuration model.
     * Use {@link ConfigurationModelFromPackage} if you want to side-load a configuration model from the client.
     */
    readonly configurationModelSource: ConfigurationModelSource;

    /**
     * Defines which attributes should be respected when making a decision.
     */
    readonly attributeRelations?: AttributeRelations | null;

    /**
     * The parameter values used for the configuration model's usage rules.
     */
    readonly usageRuleParameters?: Record<string, string> | null;

    /**
     * Specifies which elements are allowed to be included in the result when explaining a circumstance.
     * This is usually a security-sensitive option, so it is recommended to use server-side session creation for this.
     */
    readonly allowedInExplain?: AllowedInExplain | null;

    /**
     * Defines which methods the optimistic decisions feature should be enabled for.
     * @default Optimistic decisions are enabled for `makeDecision`, `setMany`, and `applySolution` by default.
     */
    readonly optimisticDecisionOptions?: OptimisticDecisionOptions | null;

    /**
     * Determines whether the source IDs of attributes should be provided.
     * @default false
     * @remarks When true, an additional API request will be made during session initialization to retrieve the source IDs.
     */
    readonly provideSourceId?: boolean | null;
};

export type OptimisticDecisionOptions = {
    /**
     * Enables the optimistic decisions feature for `makeDecision`.
     * @default true
     */
    readonly makeDecision?: boolean | null;

    /**
     * Enables the optimistic decisions feature for `setMany`.
     * @default true
     */
    readonly setMany?: boolean | null;

    /**
     * Enables the optimistic decisions feature for `applySolution`.
     * @default true
     */
    readonly applySolution?: boolean | null;

    /**
     * Enables the optimistic decisions feature for `restoreConfiguration`.
     * @default false
     */
    readonly restoreConfiguration?: boolean | null;

    /**
     * Enables the optimistic decisions feature for `resetConfiguration`.
     * @default false
     */
    readonly resetConfiguration?: boolean | null;
};

export type AllowedInExplain = {
    /**
     * Specifies whether all, none, or specific rules are allowed in the explanation result.
     */
    rules?: AllowedRulesInExplain | null;
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

    /**
     * Channel name specified for the configuration model deployment.
     */
    channel: ChannelId;

    /**
     * Name of the configuration model deployment.
     */
    deploymentName: string;
}

export type ConfigurationModelFromPackage = {
    type: ConfigurationModelSourceType.Package;

    /**
     * A self-contained package that describes the configuration model.
     */
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
    readonly nonOptimisticDecision: Decision<boolean> | null;
    readonly possibleDecisionStates: ReadonlyArray<boolean>;
    readonly selection: Selection;
}

export type NumericAttribute = BaseAttribute & {
    readonly type: AttributeType.Numeric;

    readonly decision: Decision<number> | null;
    readonly nonOptimisticDecision: Decision<number> | null;
    readonly range: Range;
    readonly decimalPlaces: number;
    readonly selection: Selection;
}

export type ComponentAttribute = BaseAttribute & {
    readonly type: AttributeType.Component;

    readonly decision: Decision<ComponentDecisionState> | null;
    readonly nonOptimisticDecision: Decision<ComponentDecisionState> | null;
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
    readonly nonOptimisticDecision: Decision<ChoiceValueDecisionState> | null;
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

export type ScheduleTaskResult = {
    /**
     * The amount of tasks still waiting for execution.
     */
    readonly pendingTasks: number;
};