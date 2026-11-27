import type {ExplainQuestionBuilder} from "./ExplainQuestionBuilder";
import type {StoredConfiguration} from "./storedConfiguration/StoredConfiguration";

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
    readonly localId: LocalAttributeId;
    readonly sharedConfigurationModelId?: ConfigurationModelId;
    readonly componentPath?: ReadonlyArray<LocalAttributeId>;
};

export type GlobalConstraintId = {
    readonly localId: LocalRuleId;
    readonly configurationModelId: ConfigurationModelId;
};

// ---------------------------------------------------------------------------------------------------------------------
export type BaseDecision = {
    readonly attributeId: GlobalAttributeId;
};

// A decision's shape only depends on the attribute type; Explicit and Fixed decisions differ solely in whether the
// state may be null/undefined. They are therefore instantiations of the same per-attribute-type base with the state
// type as parameter.
export type ChoiceDecisionOf<TState> = BaseDecision & {
    readonly type: AttributeType.Choice;
    readonly choiceValueId: ChoiceValueId;
    readonly state: TState;
};

export type NumericDecisionOf<TState> = BaseDecision & {
    readonly type: AttributeType.Numeric;
    readonly state: TState;
};

export type BooleanDecisionOf<TState> = BaseDecision & {
    readonly type: AttributeType.Boolean;
    readonly state: TState;
};

export type ComponentDecisionOf<TState> = BaseDecision & {
    readonly type: AttributeType.Component;
    readonly state: TState;
};

// Explicit decisions are made at runtime; a null/undefined state resets (clears) the decision.
export type ExplicitDecision =
    | ExplicitChoiceDecision
    | ExplicitNumericDecision
    | ExplicitBooleanDecision
    | ExplicitComponentDecision;

export type ExplicitNumericDecision = NumericDecisionOf<number | null | undefined>;

export type ExplicitBooleanDecision = BooleanDecisionOf<boolean | null | undefined>;

export type ExplicitChoiceDecision = ChoiceDecisionOf<ChoiceValueDecisionState | null | undefined>;

export type ExplicitComponentDecision = ComponentDecisionOf<ComponentDecisionState | null | undefined>;

// Fixed decisions are set once when the session is created and stay immutable for its lifetime. They share the shape
// of ExplicitDecision, but the state is strict — there is no null/undefined "reset".
export type FixedDecision = FixedChoiceDecision | FixedNumericDecision | FixedBooleanDecision | FixedComponentDecision;

export type FixedNumericDecision = NumericDecisionOf<number>;

export type FixedBooleanDecision = BooleanDecisionOf<boolean>;

export type FixedChoiceDecision = ChoiceDecisionOf<ChoiceValueDecisionState>;

export type FixedComponentDecision = ComponentDecisionOf<ComponentDecisionState>;

// ---------------------------------------------------------------------------------------------------------------------
type BaseCausedByDecision = {
    readonly type: AttributeType;
    readonly attributeId: GlobalAttributeId;
};

export type CausedByDecision = BaseCausedByDecision &
    (CausedByChoiceValueDecision | CausedByNumericDecision | CausedByBooleanDecision | CausedByComponentDecision);

export type CausedByNumericDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Numeric;
    readonly state: number;
};

export type CausedByBooleanDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Boolean;
    readonly state: boolean;
};

export type CausedByChoiceValueDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Choice;
    readonly choiceValueId: ChoiceValueId;
    readonly state: ChoiceValueDecisionState;
};

export type CausedByComponentDecision = BaseCausedByDecision & {
    readonly type: AttributeType.Component;
    readonly state: ComponentDecisionState;
};

// ---------------------------------------------------------------------------------------------------------------------
export type ExplainQuestion = WhyIsNotSatisfied | WhyIsStateNotPossible;

export enum ExplainQuestionType {
    whyIsNotSatisfied = "why-is-not-satisfied",
    whyIsStateNotPossible = "why-is-state-not-possible",
}

export enum ExplainQuestionSubject {
    choiceValue = "choice-value",
    component = "component",
    boolean = "boolean",
    numeric = "numeric",
    configuration = "configuration",
    attribute = "attribute",
}

export type WhyIsNotSatisfied = WhyIsConfigurationNotSatisfied | WhyIsAttributeNotSatisfied;

export type WhyIsConfigurationNotSatisfied = {
    readonly question: ExplainQuestionType.whyIsNotSatisfied;
    readonly subject: ExplainQuestionSubject.configuration;
};

export type WhyIsAttributeNotSatisfied = {
    readonly question: ExplainQuestionType.whyIsNotSatisfied;
    readonly subject: ExplainQuestionSubject.attribute;
    readonly attributeId: GlobalAttributeId;
};

export type WhyIsStateNotPossible =
    | WhyIsChoiceValueStateNotPossible
    | WhyIsNumericStateNotPossible
    | WhyIsBooleanStateNotPossible
    | WhyIsComponentStateNotPossible;

export type WhyIsChoiceValueStateNotPossible = {
    readonly question: ExplainQuestionType.whyIsStateNotPossible;
    readonly subject: ExplainQuestionSubject.choiceValue;
    readonly attributeId: GlobalAttributeId;
    readonly choiceValueId: ChoiceValueId;
    readonly state: ChoiceValueDecisionState;
};

export type WhyIsNumericStateNotPossible = {
    readonly question: ExplainQuestionType.whyIsStateNotPossible;
    readonly subject: ExplainQuestionSubject.numeric;
    readonly attributeId: GlobalAttributeId;
    readonly state: number;
};

export type WhyIsBooleanStateNotPossible = {
    readonly question: ExplainQuestionType.whyIsStateNotPossible;
    readonly subject: ExplainQuestionSubject.boolean;
    readonly attributeId: GlobalAttributeId;
    readonly state: boolean;
};

export type WhyIsComponentStateNotPossible = {
    readonly question: ExplainQuestionType.whyIsStateNotPossible;
    readonly subject: ExplainQuestionSubject.component;
    readonly attributeId: GlobalAttributeId;
    readonly state: ComponentDecisionState;
};

export type ExplainAnswer = DecisionsExplainAnswer | ConstraintsExplainAnswer | FullExplainAnswer;

export type DecisionsExplainAnswer = {
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>;
};

export type ConstraintsExplainAnswer = {
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type FullExplainAnswer = DecisionsExplainAnswer & ConstraintsExplainAnswer;

export type DecisionExplanation = {
    readonly causedByDecisions: ReadonlyArray<CausedByDecision>;
    readonly solution: ExplainSolution;
};

export type ConstraintExplanation = {
    readonly causedByCardinalities: ReadonlyArray<GlobalAttributeId>;
    readonly causedByRules: ReadonlyArray<GlobalConstraintId>;
};

export type ExplainSolution = {
    readonly decisions: ReadonlyArray<ExplicitDecision>;
    readonly mode: MakeManyDecisionsMode;
};

// ---------------------------------------------------------------------------------------------------------------------
export type Configuration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyMap<GlobalAttributeIdKey, Attribute>;
};

export type DecisionsToRespect = {
    readonly attributeId: GlobalAttributeId;
    readonly decisions: ReadonlyArray<GlobalAttributeId>;
};

export type AttributeRelations = ReadonlyArray<DecisionsToRespect>;

export type WizardStep = {
    readonly attributes: ReadonlyArray<GlobalAttributeId>;
};

export type WizardAttributeRelations = ReadonlyArray<WizardStep>;

export type ClientSideSessionInitialisationOptions = {
    /**
     * The access token used for authenticating with the Headless Configuration Engine (HCE) API.
     */
    readonly accessToken: string;

    /**
     * Additional HTTP headers to send on the CreateSession request only.
     *
     * Use this to forward deployment- or platform-specific context that the Configuration Engine needs when creating
     * the session — for example a tenant-selector header in a multi-tenant deployment where the access
     * token grants access to more than one tenant and the engine cannot infer a single one on its own.
     *
     * @remarks Applied to the CreateSession request only; subsequent session-scoped requests are
     * authenticated by the session id and are unaffected. The library's own `Authorization` header
     * always takes precedence and cannot be overridden here.
     */
    readonly additionalRequestHeaders?: Readonly<Record<string, string>>;
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
    readonly sessionInitialisationOptions:
        | ClientSideSessionInitialisationOptions
        | ServerSideSessionInitialisationOptions;

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
     * Defines the order of attributes in a wizard style configurator.
     */
    readonly wizardAttributeRelations?: WizardAttributeRelations | null;

    /**
     * Specifies which elements are allowed to be included in the result when explaining a circumstance.
     * This is usually a security-sensitive option, so it is recommended to use server-side session creation for this.
     */
    readonly allowedInExplain?: AllowedInExplain | null;

    /**
     * Defines which methods the optimistic decisions feature should be enabled for.
     * @default Optimistic decisions are enabled for `makeDecision`, `makeManyDecisions`, and `applySolution` by default.
     */
    readonly optimisticDecisionOptions?: OptimisticDecisionOptions | null;

    /**
     * Determines whether the source IDs of attributes should be provided.
     * @default false
     * @remarks When true, an additional API request will be made during session initialization to retrieve the source IDs.
     */
    readonly provideSourceId?: boolean | null;

    /**
     * Determines whether the Configuration Model should be trimmed by removing unattainable attributes and choice values from further
     * evaluation after session creation which results in a better overall performance.
     * @default false
     */
    readonly disableConfigurationModelTrimming?: boolean | null;

    /**
     * Decisions that are fixed when the session is created and cannot be changed afterwards — they are immutable
     * for the whole lifetime of the session. The Configuration Engine treats them like constraints and can trim the
     * Configuration Model accordingly (e.g. fixing a sales region removes unreachable attributes and choice values).
     *
     * @remarks Unlike {@link ExplicitDecision}, a {@link FixedDecision} requires a concrete state (there is no
     * null/undefined "reset"): choice and component decisions are `Included` or `Excluded`, numeric and boolean
     * decisions carry their respective value.
     */
    readonly fixedDecisions?: ReadonlyArray<FixedDecision> | null;
};

export type OptimisticDecisionOptions = {
    /**
     * Enables the optimistic decisions feature for `makeDecision`.
     * @default true
     */
    readonly makeDecision?: boolean | null;

    /**
     * Enables the optimistic decisions feature for `makeManyDecisions`.
     * @default true
     */
    readonly makeManyDecisions?: boolean | null;

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
    readonly rules?: AllowedRulesInExplain | null;
};

export enum AllowedRulesInExplainType {
    all = "all",
    none = "none",
    specific = "specific",
}

export type AllowedRulesInExplain =
    | AllowedRulesInExplainNone
    | AllowedRulesInExplainAll
    | AllowedRulesInExplainSpecific;

export type AllowedRulesInExplainNone = {
    readonly type: AllowedRulesInExplainType.none;
};

export type AllowedRulesInExplainAll = {
    readonly type: AllowedRulesInExplainType.all;
};

export type AllowedRulesInExplainSpecific = {
    readonly type: AllowedRulesInExplainType.specific;
    readonly rules: ReadonlyArray<GlobalConstraintId>;
};

export enum ConfigurationModelSourceType {
    Channel = "Channel",
    Package = "Package",
}

export type ConfigurationModelFromChannel = {
    readonly type: ConfigurationModelSourceType.Channel;

    /**
     * Channel name specified for the configuration model deployment.
     */
    readonly channel: ChannelId;

    /**
     * Name of the configuration model deployment.
     */
    readonly deploymentName: string;
};

/**
 * A self-contained description of a configuration model and the models it references, sent with the session request
 * instead of loading a deployed model from a channel.
 */
export type ConfigurationModelPackage = {
    /** ID of the model in {@link ConfigurationModelPackage.configurationModels} the session configures. */
    readonly root: string;
    /** The root model and every model it uses, as components or shared models. */
    readonly configurationModels: ReadonlyArray<PackageConfigurationModel>;
};

/** One configuration model within a {@link ConfigurationModelPackage}. */
export type PackageConfigurationModel = {
    /** The model's ID, which the root, components and shared models refer to. */
    readonly configurationModelId: string;
    /** The attributes the model declares. */
    readonly attributes: PackageAttributes;
    /** IDs of the shared configuration models whose attributes this model uses. */
    readonly sharedFromConfigurationModels?: ReadonlyArray<string> | null;
    /** The model's rules. */
    readonly constraints?: ReadonlyArray<PackageConstraint> | null;
};

/** The attributes a {@link PackageConfigurationModel} declares, grouped by kind. */
export type PackageAttributes = {
    readonly choiceAttributes?: ReadonlyArray<PackageChoiceAttribute> | null;
    readonly numericAttributes?: ReadonlyArray<PackageNumericAttribute> | null;
    readonly booleanAttributes?: ReadonlyArray<PackageBooleanAttribute> | null;
    readonly componentAttributes?: ReadonlyArray<PackageComponentAttribute> | null;
};

/** A choice attribute with its values and how many of them may be selected. */
export type PackageChoiceAttribute = {
    /** The attribute's ID within its model. */
    readonly attributeId: string;
    /** The fewest values that must be selected; 0 makes the attribute optional. */
    readonly lowerBound: number;
    /** The most values that may be selected; 1 makes it a single choice. */
    readonly upperBound: number;
    /** The values that can be selected. */
    readonly choiceValues: ReadonlyArray<PackageChoiceValue>;
};

/** A value of a {@link PackageChoiceAttribute}. */
export type PackageChoiceValue = {
    /** The value's ID within its choice attribute. */
    readonly choiceValueId: string;
};

/** A numeric attribute with its range and precision. */
export type PackageNumericAttribute = {
    /** The attribute's ID within its model. */
    readonly attributeId: string;
    /** Whether the configuration is satisfied only once the attribute has a value. */
    readonly isDecisionRequired: boolean;
    /** The smallest allowed value. */
    readonly min: number;
    /** The largest allowed value. */
    readonly max: number;
    /** How many decimal places a value may have. */
    readonly decimalPlaces: number;
};

/** A boolean attribute. */
export type PackageBooleanAttribute = {
    /** The attribute's ID within its model. */
    readonly attributeId: string;
    /** Whether the configuration is satisfied only once the attribute is decided. */
    readonly isDecisionRequired: boolean;
};

/** A component attribute that references another configuration model of the package. */
export type PackageComponentAttribute = {
    /** The attribute's ID within its model. */
    readonly attributeId: string;
    /** The model of the package that the component instantiates. */
    readonly configurationModelId: string;
    /** Whether the component is always part of the configuration or can be included optionally. */
    readonly inclusion: PackageComponentInclusion;
};

/** Whether a component is always part of the configuration or can be included optionally. */
export type PackageComponentInclusion = PackageOptionallyIncluded | PackageAlwaysIncluded;

/** The component can be included or excluded by a decision. */
export type PackageOptionallyIncluded = {
    readonly type: "OptionallyIncluded";
    /** Whether the configuration is satisfied only once the component is included or excluded. */
    readonly isDecisionRequired: boolean;
};

/** The component is always part of the configuration. */
export type PackageAlwaysIncluded = {
    readonly type: "AlwaysIncluded";
};

/** A rule of a {@link PackageConfigurationModel}, written in the modeling language. */
export type PackageConstraint = PackageTextualConstraint | PackageTextualConstraintCollection;

/** A single rule. */
export type PackageTextualConstraint = {
    /** The rule's ID within its model. */
    readonly constraintId: string;
    /** The rule, in the modeling language. */
    readonly textualConstraint: string;
    readonly type: "TextualConstraint";
};

/** Several rules combined into one constraint by {@link PackageTextualConstraintCollection.operator}. */
export type PackageTextualConstraintCollection = {
    /** The rule's ID within its model. */
    readonly constraintId: string;
    /** Whether all rules must hold, or at least one. */
    readonly operator: PackageTextualConstraintCollectionOperator;
    /** The rules, in the modeling language. */
    readonly textualConstraints: ReadonlyArray<string>;
    readonly type: "TextualConstraintCollection";
};

/** How the rules of a {@link PackageTextualConstraintCollection} are combined: all of them, or at least one. */
export type PackageTextualConstraintCollectionOperator = "And" | "Or";

export type ConfigurationModelFromPackage = {
    readonly type: ConfigurationModelSourceType.Package;

    /**
     * A self-contained package that describes the configuration model.
     */
    readonly configurationModelPackage: ConfigurationModelPackage;
};

export type ConfigurationModelSource = ConfigurationModelFromChannel | ConfigurationModelFromPackage;

export type Attribute = BooleanAttribute | NumericAttribute | ChoiceAttribute | ComponentAttribute;

export enum AttributeType {
    Boolean = "Boolean",
    Numeric = "Numeric",
    Choice = "Choice",
    Component = "Component",
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
};

export type Decision<TState extends boolean | number | ComponentDecisionState | ChoiceValueDecisionState> = {
    readonly state: TState;
    readonly kind: DecisionKind;
};

export type BooleanAttribute = BaseAttribute & {
    readonly type: AttributeType.Boolean;

    readonly decision: Decision<boolean> | null;
    readonly nonOptimisticDecision: Decision<boolean> | null;
    readonly possibleDecisionStates: ReadonlyArray<boolean>;
    readonly isPossibleDecisionStatesImmutable: boolean;
    readonly selection: Selection;
};

export type NumericAttribute = BaseAttribute & {
    readonly type: AttributeType.Numeric;

    readonly decision: Decision<number> | null;
    readonly nonOptimisticDecision: Decision<number> | null;
    readonly range: Range;
    readonly decimalPlaces: number;
    readonly selection: Selection;
    readonly isPossibleDecisionStatesImmutable: boolean;
};

export type ComponentAttribute = BaseAttribute & {
    readonly type: AttributeType.Component;

    readonly decision: Decision<ComponentDecisionState> | null;
    readonly nonOptimisticDecision: Decision<ComponentDecisionState> | null;
    readonly inclusion: Inclusion;
    readonly selection: Selection | null;
    readonly possibleDecisionStates: ReadonlyArray<ComponentDecisionState>;
    readonly isPossibleDecisionStatesImmutable: boolean;
};

export type ChoiceAttribute = BaseAttribute & {
    readonly type: AttributeType.Choice;

    readonly values: ReadonlyMap<ChoiceValueId, ChoiceValue>;
    readonly cardinality: Cardinality;
};

export type ChoiceValue = {
    readonly id: ChoiceValueId;
    readonly decision: Decision<ChoiceValueDecisionState> | null;
    readonly nonOptimisticDecision: Decision<ChoiceValueDecisionState> | null;
    readonly possibleDecisionStates: ReadonlyArray<ChoiceValueDecisionState>;
    readonly isPossibleDecisionStatesImmutable: boolean;
};

export enum ChoiceValueDecisionState {
    Included = "Included",
    Excluded = "Excluded",
}

export enum ComponentDecisionState {
    Included = "Included",
    Excluded = "Excluded",
}

export enum DecisionKind {
    Implicit = "Implicit",
    Explicit = "Explicit",
}

export enum Selection {
    Mandatory = "Mandatory",
    Optional = "Optional",
}

export enum Inclusion {
    Always = "Always",
    Optional = "Optional",
}

export type Cardinality = {
    readonly lowerBound: number;
    readonly upperBound: number;
};

export type Range = {
    readonly min: number;
    readonly max: number;
};

export type BaseCollectedDecision<T extends number | boolean | ChoiceValueDecisionState | ComponentDecisionState> =
    Decision<T> & {
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
};

export type CollectedDecision =
    | CollectedBooleanDecision
    | CollectedNumericDecision
    | CollectedComponentDecision
    | CollectedChoiceDecision;

export type CollectedImplicitDecision = CollectedDecision & {readonly kind: DecisionKind.Implicit};
export type CollectedExplicitDecision = CollectedDecision & {readonly kind: DecisionKind.Explicit};

export type MakeManyDecisionsMode = DropExistingDecisionsMode | KeepExistingDecisionsMode;

export type DropExistingDecisionsMode = {
    readonly type: "DropExistingDecisions";
    readonly conflictHandling: ConflictResolution;
};

export type KeepExistingDecisionsMode = {
    readonly type: "KeepExistingDecisions";
};

export type ConflictResolution = ManualConflictResolution | AutomaticConflictResolution;

export type ManualConflictResolution = {
    readonly type: "Manual";
    readonly includeConstraintsInConflictExplanation: boolean;
};

export type AutomaticConflictResolution = {
    readonly type: "Automatic";
};

export type ConfigurationChanges = {
    readonly isSatisfied: boolean | null;
    readonly attributes: {
        readonly added: ReadonlyArray<Attribute>;
        readonly changed: ReadonlyArray<Attribute>;
        readonly removed: ReadonlyArray<GlobalAttributeId>;
    };
};

export type OnConfigurationChangedHandler = (
    configuration: Configuration,
    configurationChanges: ConfigurationChanges,
) => void;

export type OnCanResetConfigurationChangedHandler = (canResetConfiguration: boolean) => void;

export type OnStoredConfigurationChangedHandler = (storedConfiguration: StoredConfiguration) => void;

export type OnDecisionsChangedHandler<T extends CollectedDecision> = (decisions: ReadonlyArray<T>) => void;

export type ExplainQuestionParam = ExplainQuestion | ((b: ExplainQuestionBuilder) => ExplainQuestion);

export type SetManyResult = MakeManyDecisionsResult;

export type MakeManyDecisionsResult = {
    readonly rejectedDecisions: ReadonlyArray<ExplicitDecision>;
};

export type Subscription = {
    readonly unsubscribe: () => void;
};

export type ScheduleTaskResult = {
    /**
     * The amount of tasks still waiting for execution.
     */
    readonly pendingTasks: number;
};