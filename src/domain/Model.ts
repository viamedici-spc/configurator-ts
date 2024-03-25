import {Bool, Eq, Num, O, Option, RA, RR, Str, TaskEither} from "@viamedici-spc/fp-ts-extensions";
import {ReadonlyRecord} from "@viamedici-spc/fp-ts-extensions/ReadonlyRecord";
import {match} from "ts-pattern";
import {deepEqual} from "fast-equals";
import {getNullableEq, getNullTolerantReadOnlyArrayEq} from "../crossCutting/Eq";
import * as Engine from "../apiClient/engine/models/generated/Engine";
import {eqGlobalConstraintId} from "../contract/Types";

export type TaskEitherResult<T> = TaskEither<FailureResult, T>;

export type SessionId = string;

export type AttributeId = string;
export type ConstraintId = string;
export type ChoiceValueId = string;
export type ConfigurationModelId = string;

// ---------------------------------------------------------------------------------------------------------------------
export type ExplainQuestionBase = {
    answerType: ExplainAnswerType;
}

export type ExplainQuestion =
    | ExplainQuestionBase
    & (WhyIsNotSatisfied | WhyIsStateNotPossible);

export enum ExplainQuestionType {
    whyIsNotSatisfied = "why-is-not-satisfied",
    whyIsStateNotPossible = "why-is-state-not-possible"
}

export enum ExplainAnswerType {
    decisions = "decisions",
    constraints = "constraints",
    all = "all"
}

export enum ExplainQuestionSubject {
    choiceValue = "choice-value",
    component = "component",
    boolean = "boolean",
    numeric = "numeric",
    configuration = "configuration",
    attribute = "attribute"
}

export type WhyIsNotSatisfied = ExplainQuestionBase & (
    WhyIsConfigurationNotSatisfied
    | WhyIsAttributeNotSatisfied);

export type WhyIsConfigurationNotSatisfied = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsNotSatisfied
    subject: ExplainQuestionSubject.configuration
}

export type WhyIsAttributeNotSatisfied = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsNotSatisfied
    subject: ExplainQuestionSubject.attribute,
    attributeId: GlobalAttributeId
}

export type WhyIsStateNotPossible = ExplainQuestionBase & (
    WhyIsChoiceValueStateNotPossible
    | WhyIsNumericStateNotPossible
    | WhyIsBooleanStateNotPossible
    | WhyIsComponentStateNotPossible);

export type WhyIsChoiceValueStateNotPossible = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsStateNotPossible,
    subject: ExplainQuestionSubject.choiceValue,
    attributeId: GlobalAttributeId,
    choiceValueId: ChoiceValueId,
    state: DecisionState
}

export type WhyIsNumericStateNotPossible = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.numeric,
    attributeId: GlobalAttributeId,
    state: number
}

export type WhyIsBooleanStateNotPossible = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.boolean,
    attributeId: GlobalAttributeId,
    state: boolean
}

export type WhyIsComponentStateNotPossible = ExplainQuestionBase & {
    question: ExplainQuestionType.whyIsStateNotPossible
    subject: ExplainQuestionSubject.component,
    attributeId: GlobalAttributeId,
    state: DecisionState
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

type AttributeDecisionBase = {
    readonly attributeId: GlobalAttributeId
    readonly type: DecisionType
};

export type AttributeDecision =
    AttributeDecisionBase
    & (ChoiceValueAttributeDecision | NumericAttributeDecision | BooleanAttributeDecision | ComponentAttributeDecision);

export type NumericAttributeDecision = AttributeDecisionBase & {
    readonly type: DecisionType.Numeric;
    readonly value: Option<number>;
};

export type BooleanAttributeDecision = AttributeDecisionBase & {
    readonly type: DecisionType.Boolean;
    readonly value: Option<boolean>;
};

export type ChoiceValueAttributeDecision = AttributeDecisionBase & {
    readonly type: DecisionType.ChoiceValue;
    readonly choiceValueId: string;
    readonly state: Option<DecisionState>;
};

export type ComponentAttributeDecision = AttributeDecisionBase & {
    readonly type: DecisionType.Component;
    readonly state: Option<DecisionState>;
};

export type ConfigurationSessionState = {
    readonly sessionId: Option<SessionId>;
    readonly configuration: Configuration;
    readonly context: ConfigurationSessionContext;
    readonly solutions: ReadonlyArray<ExplainSolution>;
};

export type Configuration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyArray<Attribute>;
};

export type ConfigurationSessionContext = {
    readonly usageRuleParameters: ReadonlyRecord<string, string>;
    readonly configurationModelSource: ConfigurationModelSource;
    readonly decisionsToRespect: Option<AttributeRelations>;
    readonly allowedInExplain: Option<AllowedInExplain>;
};

export type AllowedInExplain = {
    readonly rules: Option<AllowedRulesInExplain>;
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

export type DecisionsToRespect = {
    readonly attributeId: GlobalAttributeId;
    readonly decisions: ReadonlyArray<GlobalAttributeId>;
}

export type GlobalAttributeId = {
    readonly localId: AttributeId,
    readonly sharedConfigurationModel?: ConfigurationModelId | null,
    readonly componentPath?: ReadonlyArray<ConfigurationModelId>
};

export type GlobalConstraintId = {
    readonly localId: ConstraintId,
    readonly configurationModelId: ConfigurationModelId
};

export type AttributeRelations = ReadonlyArray<DecisionsToRespect>;


export const eqGlobalAttributeId = Eq.struct<GlobalAttributeId>({
    localId: Str.Eq,
    componentPath: getNullTolerantReadOnlyArrayEq(Str.Eq),
    sharedConfigurationModel: getNullableEq(Str.Eq)
});

const eqDecisionsToRespect = O.getEq(RA.getEq(Eq.struct<DecisionsToRespect>({
    attributeId: eqGlobalAttributeId,
    decisions: getNullTolerantReadOnlyArrayEq(eqGlobalAttributeId)
})));

const eqAllowedRulesInExplain = O.getEq(Eq.fromEquals<AllowedRulesInExplain>((x, y) =>
    match({x, y})
        .returnType<boolean>()
        .with({x: {type: AllowedRulesInExplainType.all}, y: {type: AllowedRulesInExplainType.all}}, () => true)
        .with({x: {type: AllowedRulesInExplainType.none}, y: {type: AllowedRulesInExplainType.none}}, () => true)
        .with({x: {type: AllowedRulesInExplainType.specific}, y: {type: AllowedRulesInExplainType.specific}},
            ({x, y}) => RA.getEq(eqGlobalConstraintId).equals(x.rules, y.rules))
        .otherwise(() => false)));

const eqAllowedInExplain = O.getEq(Eq.struct<AllowedInExplain>({
    rules: eqAllowedRulesInExplain
}));


export const eqSessionContext = Eq.struct<ConfigurationSessionContext>({
    configurationModelSource: Eq.fromEquals<ConfigurationModelSource>((x, y) => deepEqual(x, y)),
    decisionsToRespect: eqDecisionsToRespect,
    usageRuleParameters: RR.getEq(Str.Eq),
    allowedInExplain: eqAllowedInExplain
});

export enum ConfigurationModelSourceType {
    Channel = "Channel",
    Package = "Package"
}

type ConfigurationModelSourceBase = {
    readonly type: ConfigurationModelSourceType;
}

export type ConfigurationModelSource =
    ConfigurationModelSourceBase
    & (ConfigurationModelFromChannel | ConfigurationModelFromPackage);


export type ConfigurationModelFromChannel = ConfigurationModelSourceBase & {
    readonly type: ConfigurationModelSourceType.Channel;
    readonly channel: string;
    readonly deploymentName: string;
}

export type ConfigurationModelFromPackage = ConfigurationModelSourceBase & {
    readonly type: ConfigurationModelSourceType.Package;
    readonly configurationModelPackage: Engine.ConfigurationModelPackage;
}

export type Decision<TState extends boolean | number | DecisionState> = {
    readonly state: TState;
    readonly kind: DecisionKind;
}

export type Attribute = BaseAttribute & (BooleanAttribute | NumericAttribute | ChoiceAttribute | ComponentAttribute);

export enum AttributeType {
    Boolean = "Boolean",
    Numeric = "Numeric",
    Choice = "Choice",
    Component = "Component"
}

export enum DecisionType {
    Boolean = "Boolean",
    Numeric = "Numeric",
    ChoiceValue = "ChoiceValue",
    Component = "Component"
}

export type BaseAttribute = {
    readonly attributeId: GlobalAttributeId;
    readonly isSatisfied: boolean;
    readonly type: AttributeType;
    readonly canContributeToConfigurationSatisfaction: boolean;
};

export type BooleanAttribute = BaseAttribute & {
    readonly type: AttributeType.Boolean;
    readonly decision: Option<Decision<boolean>>;
    readonly selection: Selection;
    readonly possibleDecisionStates: ReadonlyArray<boolean>
}

export type NumericAttribute = BaseAttribute & {
    readonly type: AttributeType.Numeric;

    readonly decision: Option<Decision<number>>;
    readonly range: Range;
    readonly decimalPlaces: number;
    readonly selection: Selection;
}

export type ChoiceAttribute = BaseAttribute & {
    readonly type: AttributeType.Choice;

    readonly values: ReadonlyArray<ChoiceValue>;
    readonly cardinality: Cardinality;
}

export type ChoiceValue = {
    readonly choiceValueId: ChoiceValueId
    readonly possibleDecisionStates: ReadonlyArray<DecisionState>
    readonly decision: Option<Decision<DecisionState>>
}

export type ComponentAttribute = BaseAttribute & {
    readonly type: AttributeType.Component;

    readonly possibleDecisionStates: ReadonlyArray<DecisionState>
    readonly decision: Option<Decision<DecisionState>>
    readonly inclusion: Inclusion;
    readonly selection?: Selection;
}

export enum DecisionState {
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

export type ExplainSolution = {
    readonly decisions: ReadonlyArray<AttributeDecision>;
    readonly mode: SetManyMode;
}

const eqChoiceAttributeDecision: Eq.Eq<ChoiceValueAttributeDecision> = {
    equals: (x, y) => {
        if (x.choiceValueId !== y.choiceValueId) {
            return false;
        }

        return O.getEq<DecisionState>(Str.Eq).equals(x.state, y.state);
    }
};

const eqNumericAttributeDecision: Eq.Eq<NumericAttributeDecision> = {
    equals(x, y) {
        return O.getEq<number>(Num.Eq).equals(x.value, y.value);
    }
};

const eqBooleanAttributeDecision: Eq.Eq<BooleanAttributeDecision> = {
    equals(x, y) {
        return O.getEq<boolean>(Bool.Eq).equals(x.value, y.value);
    }
};

const eqComponentAttributeDecision: Eq.Eq<ComponentAttributeDecision> = {
    equals(x, y) {
        return O.getEq<DecisionState>(Str.Eq).equals(x.state, y.state);
    }
};

const eqAttributeDecision: Eq.Eq<AttributeDecision> = {
    equals(x, y) {
        if (!eqGlobalAttributeId.equals(x.attributeId, y.attributeId)) {
            return false;
        }

        return match({x, y})
            .with({
                x: {type: DecisionType.Boolean},
                y: {type: DecisionType.Boolean}
            }, (_, v: {
                x: BooleanAttributeDecision,
                y: BooleanAttributeDecision
            }) => eqBooleanAttributeDecision.equals(v.x, v.y))
            .with({
                x: {type: DecisionType.Numeric},
                y: {type: DecisionType.Numeric}
            }, (_, v: {
                x: NumericAttributeDecision,
                y: NumericAttributeDecision
            }) => eqNumericAttributeDecision.equals(v.x, v.y))
            .with({
                x: {type: DecisionType.Component},
                y: {type: DecisionType.Component}
            }, (_, v: {
                x: ComponentAttributeDecision,
                y: ComponentAttributeDecision
            }) => eqComponentAttributeDecision.equals(v.x, v.y))
            .with({
                x: {type: DecisionType.ChoiceValue},
                y: {type: DecisionType.ChoiceValue}
            }, (_, v: {
                x: ChoiceValueAttributeDecision,
                y: ChoiceValueAttributeDecision
            }) => eqChoiceAttributeDecision.equals(v.x, v.y))
            .otherwise(() => false);
    }
};

const eqAttributeDecisions = RA.getEq(eqAttributeDecision);

export const eqSolution: Eq.Eq<ExplainSolution> = {
    equals: (x, y) => {
        return eqAttributeDecisions.equals(x.decisions, y.decisions) && eqSetManyMode.equals(x.mode, y.mode);
    }
};

const eqSetManyMode: Eq.Eq<SetManyMode> = {
    equals: (x: SetManyMode, y) => {
        return match({x, y})
            .with({
                x: {type: "Default"}, y: {type: "Default"}
            }, v => true)
            .with({
                x: {type: "DropExistingDecisions"}, y: {type: "DropExistingDecisions"}
            }, v => true)
            .otherwise(() => false);
    }
};

type SetManyModeBase = {
    type: string
};

export type SetManyMode =
    SetManyModeBase & (SetManyDefaultMode
    | SetManyKeepExistingDecisionsMode
    | SetManyDropExistingDecisionsMode);

export type SetManyDefaultMode = SetManyModeBase & {
    type: "Default"
};

export type SetManyDropExistingDecisionsMode = SetManyModeBase & {
    type: "DropExistingDecisions",
    conflictHandling: ConflictResolution
};

export type SetManyKeepExistingDecisionsMode = SetManyModeBase & {
    type: "KeepExistingDecisions"
};

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

// ---------------------------------------------------------------------------------------------------------------------

export enum Reason {
    NotAvailable = "NotAvailable",
    StateNotPossible = "StateNotPossible",
}

export type DecisionExplanation = {
    readonly causedByChoiceDecisions: ReadonlyArray<CausedByChoiceValueDecision>;
    readonly causedByNumericDecisions: ReadonlyArray<CausedByNumericDecision>;
    readonly causedByBooleanDecisions: ReadonlyArray<CausedByBooleanDecision>;
    readonly causedByComponentDecisions: ReadonlyArray<CausedByComponentDecision>;
    readonly solution: ExplainSolution;
}

export type CausedByDecisionBase = {
    readonly type: DecisionType;
    readonly attributeId: GlobalAttributeId;
}

export type CausedByDecision = CausedByDecisionBase & (
    | CausedByBooleanDecision
    | CausedByNumericDecision
    | CausedByComponentDecision
    | CausedByChoiceValueDecision);

export interface CausedByBooleanDecision {
    readonly type: DecisionType.Boolean;
    readonly attributeId: GlobalAttributeId;
    readonly reason: Reason;
    readonly state: boolean;
}

export type CausedByNumericDecision = {
    readonly type: DecisionType.Numeric;
    readonly attributeId: GlobalAttributeId;
    readonly reason: Reason;
    readonly state: number;
}

export type CausedByComponentDecision = {
    readonly type: DecisionType.Component;
    readonly attributeId: GlobalAttributeId;
    readonly reason: Reason;
    readonly state: DecisionState;
}

export type CausedByChoiceValueDecision = {
    readonly type: DecisionType.ChoiceValue;
    readonly attributeId: GlobalAttributeId;
    readonly choiceValueId: string;
    readonly reason: Reason;
    readonly state: DecisionState;
}

// ---------------------------------------------------------------------------------------------------------------------

export enum ConstraintType {
    Rule = "Rule",
    Cardinality = "Cardinality",
    Component = "Component",
}

export type ConstraintExplanation = {
    readonly causedByCardinalities: ReadonlyArray<CardinalityConstraint>;
    readonly causedByRules: ReadonlyArray<RuleConstraint>;
}

export type CardinalityConstraint = {
    readonly type: ConstraintType;
    readonly attributeId: GlobalAttributeId;
}

export type RuleConstraint = {
    readonly type: ConstraintType;
    readonly ruleId: GlobalConstraintId;
}

// ---------------------------------------------------------------------------------------------------------------------

/*
    All possible error types.
 */
export type FailureResult = ConfigurationModelNotFound
    | CommunicationError
    | ConfigurationApplicationError
    | ConfigurationAttributeNotFound
    | ConfigurationChoiceValueNotFound
    | ConfigurationConflict
    | ConfigurationInitializationFailure
    | ConfigurationModelInvalid
    | ConfigurationModelNotFeasible
    | ConfigurationRejectedDecisionsConflict
    | ConfigurationSetManyConflict
    | ConfigurationSolutionNotAvailable
    | ConfigurationTimeout
    | ConfigurationUnauthenticated
    | DecisionsToRespectInvalid
    | SpecifiedDeploymentForbidden
    | ServiceError
    | ExplainConflict
    | ExplainFailure
    | Unknown
    ;

export type BaseFailure = {
    readonly type: FailureType;
};

export enum FailureType {
    ServiceError = "ServiceError",
    Unknown = "Unknown",
    CommunicationError = "CommunicationError",
    ConfigurationConflict = "ConfigurationConflict",
    ConfigurationSolutionNotAvailable = "ConfigurationSolutionNotAvailable",
    ConfigurationAttributeNotFound = "ConfigurationAttributeNotFound",
    ConfigurationChoiceValueNotFound = "ConfigurationChoiceValueNotFound",
    ConfigurationUnauthenticated = "ConfigurationUnauthenticated",
    ConfigurationApplicationError = "ConfigurationApplicationError",
    ConfigurationTimeout = "ConfigurationTimeout",
    ConfigurationModelNotFound = "ConfigurationModelNotFound",

    ConfigurationRejectedDecisionsConflict = "ConfigurationRejectedDecisionsConflict",
    ConfigurationSetManyConflict = "ConfigurationSetManyConflict",

    DecisionsToRespectInvalid = "DecisionsToRespectInvalid",
    ConfigurationModelInvalid = "ConfigurationModelInvalid",
    ConfigurationInitializationFailure = "ConfigurationInitializationFailure",
    ConfigurationModelNotFeasible = "ConfigurationModelNotFeasible",
    SpecifiedDeploymentForbidden = "SpecifiedDeploymentForbidden",
    ExplainConflict = "ExplainConflict",
    ExplainFailure = "ExplainFailure"
}

export type ServiceError = BaseFailure & {
    readonly type: FailureType.ServiceError;
};

export type Unknown = BaseFailure & {
    readonly type: FailureType.Unknown;
};

export type CommunicationError = BaseFailure & {
    readonly type: FailureType.CommunicationError;
};

export type ConfigurationModelNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationModelNotFound;
};

export type ConfigurationModelInvalid = BaseFailure & {
    readonly type: FailureType.ConfigurationModelInvalid;
};

export type ConfigurationInitializationFailure = BaseFailure & {
    readonly type: FailureType.ConfigurationInitializationFailure;
};

export type ConfigurationModelNotFeasible = BaseFailure & {
    readonly type: FailureType.ConfigurationModelNotFeasible;
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>;
};

export type DecisionsToRespectInvalid = BaseFailure & {
    readonly type: FailureType.DecisionsToRespectInvalid;
};

export type ConfigurationAttributeNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationAttributeNotFound;
};

export type ConfigurationChoiceValueNotFound = BaseFailure & {
    readonly type: FailureType.ConfigurationChoiceValueNotFound;
};

export enum ConfigurationConflictReason {
    NumericDecisionOutOfRange
}

export type ConfigurationConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationConflict;
    readonly reason?: ConfigurationConflictReason;
};

export type ConfigurationUnauthenticated = BaseFailure & {
    readonly type: FailureType.ConfigurationUnauthenticated;
};

export type ConfigurationApplicationError = BaseFailure & {
    readonly type: FailureType.ConfigurationApplicationError;
};

export type ConfigurationTimeout = BaseFailure & {
    readonly type: FailureType.ConfigurationTimeout;
};

export type ConfigurationSolutionNotAvailable = BaseFailure & {
    readonly type: FailureType.ConfigurationSolutionNotAvailable;
};

export type ConfigurationRejectedDecisionsConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationRejectedDecisionsConflict;
    readonly rejectedDecisions: ReadonlyArray<AttributeDecision>
};

export type ConfigurationSetManyConflict = BaseFailure & {
    readonly type: FailureType.ConfigurationSetManyConflict;
    readonly decisionExplanations: ReadonlyArray<DecisionExplanation>
    readonly constraintExplanations: ReadonlyArray<ConstraintExplanation>
};

export type SpecifiedDeploymentForbidden = BaseFailure & {
    readonly type: FailureType.SpecifiedDeploymentForbidden;
    readonly detail: string;
    readonly deploymentName: string;
    readonly channel: string;
};

export type ExplainFailure = BaseFailure & {
    readonly type: FailureType.ExplainFailure;
};

export type ExplainConflict = BaseFailure & {
    readonly type: FailureType.ExplainConflict;
};

export const FailureResultFactory = {
    createConfigurationRejectedDecisionsConflict(rejectedDecisions: ReadonlyArray<AttributeDecision>): FailureResult {
        return {
            type: FailureType.ConfigurationRejectedDecisionsConflict,
            rejectedDecisions: rejectedDecisions
        };
    }
};

// ---------------------------------------------------------------------------------------------------------------------