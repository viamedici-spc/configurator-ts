/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

type UtilRequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

/**
 * The Consequences are the result of an evaluation weather of a Configuration Model or of made
 * Decisions in conjunction with a Configuration Model.
 * The Consequences object consists of a boolean attribute representing the overall
 * Configuration Model Satisfaction State and 4 arrays for the different types of Consequences:
 * Choice, Numeric, Boolean and Component. It represents the Configuration State at the beginning
 * of a Configuration Dialogue. During a Configuration Dialogue the "Consequences" are an
 * important part of the Configuration State.
 */
export interface Consequences {
  /**
   * In this case, the meta attribute "IsConfigurationSatisfied" represents the "Configuration Model-Satisfaction State".
   * It indicates for the whole Configuration Model if Decisions are still required to be made.
   * If it is TRUE then the configuration can be concluded.
   */
  isConfigurationSatisfied: boolean;
  /** TODO: Documentation */
  canAttributeContributeToConfigurationSatisfaction: GlobalAttributeId[];
  /**
   * The Choice Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   * For each Choice Attribute, represented by a Global Attribute ID, the following is specified:
   * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
   *     (isSatisfied = true).
   * (2) In the object "Cardinality" is specified the assignment type of the Attribute Values that is
   *     determined during modeling (mandatory, optional, multiple).
   * (3) Furthermore, the currently still possible Decision States are indicated for every Value.
   *     These are represented in the form of a list of objects of type "ChoiceValueConsequence".
   */
  choiceConsequences: ChoiceConsequence[];
  /**
   * The Numeric Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   * For each Numeric Attribute, represented by a Global Attribute ID, the following is specified:
   * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
   *     (isSatisfied = true).
   * (2) The meta attribute "selection" indicates if a Value assignment is mandatory or not.
   * (3) The meta attribute "range" specifies a range of numbers by specifying a maximum (max) and a minimum value (min).
   * (4) The number of decimal places is specified by an integer value of the meta-attribute "decimalPlaces".
   */
  numericConsequences: NumericConsequence[];
  /**
   * The Boolean Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   * For each Boolean Attribute, represented by a Global Attribute ID, the following is specified:
   * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
   *     (isSatisfied = true).
   * (2) The meta attribute "selection" indicates if a Value assignment (the choice "true" or "false") is mandatory or not.
   * (3) Furthermore, the currently still possible boolean states are indicated.
   */
  booleanConsequences: BooleanConsequence[];
  /**
   * The Component Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   * For each Component Attribute, represented by a Global Attribute ID, the following is specified:
   * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
   *     (isSatisfied = true).
   * (2) The meta attribute "inclusion" specifies whether a referenced Component Configuration Model is always
   *     considered in finding a Solution (inclusion = "Always") or only under certain conditions (inclusion = "Optional").
   * (3) The meta attribute "selection" indicates if the referencing of a Component Configuration Model is mandatory or not.
   * (4) Furthermore, the currently still possible decision states are indicated.
   *     These are represented in the form of a list of objects of type "ChoiceValueConsequence".
   *     Examples can be found in the product documentation.
   */
  componentConsequences: ComponentConsequence[];
}

/**
 * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
 * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
 * the identifier components is used.
 * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
 * because it is the path to an Attribute.
 * shared component path localId
 * Details can be found in the API product documentation.
 */
export interface GlobalAttributeId {
  /**
   * The LocalId is the last part of the Attribute Path if there exists a set of referenced Configuration Models .
   * It identifies a local Attribute within a specific Configuration Model.
   * Example: In a Configuration Model "Automobile" could be declared an Attribute with the LocalId "Color".
   * Further examples can be found in the API product documentation.
   */
  localId: string;
  /**
   * The SharedConfigurationModelId is the first part of the Attribute Path (identifier of an Attribute) if it
   * is declared in a Shared Configuration Model which is included in the
   * Configuration Model under consideration.
   * Example path while modeling: "shared::TechnicalShared::AutomobileType". "shared" is a key word of the
   * modelling language, "TechnicalShared" is the name (identifier) of a Shared Configuration Model,
   * "AutomobileType" is the name (identifier) of an Attribute, which is declared in "TechnicalShared".
   * For example, the Attribute "AutomobileType" is used in a Configuration Model called "Automobile".
   * Further examples can be found in the API product documentation.
   */
  sharedConfigurationModelId?: string | null;
  /**
   * The ComponentPath is part of the Attribute Path (identifier of an Attribute) if it
   * is declared in a Component Configuration Model that is referenced in a Configuration Model under consideration.
   * Example path while modeling: "Engine::EngineType". "EngineType" is the name (identifier) of a
   * Component Configuration Model, "EngineType" is the name (identifier) of an Attribute, which
   * is declared in "Engine".
   * For example, the Attribute "EngineType" is used in a Configuration Model called "Automobile".
   * Further examples can be found in the API product documentation.
   */
  componentPath?: string[] | null;
}

/**
 * A Choice Consequence is the result of an evaluation weather of a Configuration Model or of made
 * Decisions in conjunction with a Configuration Model.
 * For a Choice Attribute, represented by a Global Attribute ID, the following is specified:
 * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
 *     (isSatisfied = true).
 * (2) In the object "Cardinality" is specified the assignment type of the Attribute Values that is
 *     determined during modeling (mandatory, optional, multiple).
 * (3) Furthermore, the currently still possible decision states are indicated for every Value.
 *     These are represented in the form of a list of objects of type "ChoiceValueConsequence".
 */
export interface ChoiceConsequence {
  /**
   * The ability to nest Configuration Models in different ways requires an Attribute identifier
   * that is unique across all Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In this case, the meta attribute "isSatisfied" represents the "Value Satisfaction State".
   * The "Value" is the value of a Choice Attribute, which is always a string.
   * It indicates for the Attribute under consideration whether Decisions still need to be made.
   */
  isSatisfied: boolean;
  /**
   * The value assignment for Attributes can be different: one or more mandatory Values respectively one or more optional Values.
   * The allowed possibilities are specified by giving an upper as well as a lower limit value.
   * Those limit values are contained in the object Cardinality.
   */
  cardinality: Cardinality;
  /** "Values" represents a list of Choice Value Consequences. */
  values: ChoiceValueConsequence[];
}

/** Controls how many Values can respectively must be selected. */
export interface Cardinality {
  /**
   * Controls how many Values must be selected.
   * - 0 means that the selection of a Value is optional.
   * - N means that a least N Values must be selected. For example: 1 means that mandatory 1 Value must be selected.
   */
  lowerBound: number;
  /**
   * Controls how many Values can be selected.
   * - 1 means that only one Value can be selected.
   * - N means that optional N Values can be selected.
   */
  upperBound: number;
}

/**
 * A Choice Value Consequence specifies the possible Decision States for a certain Value of a Choice Attribute.
 * It is represented by an object of the type "ChoiceValueConsequence".
 */
export interface ChoiceValueConsequence {
  /** Every item in an enumeration of Values of a Choice Attribute is identified by a string. */
  choiceValueId: string;
  /**
   * There are zwo possible Decision States for a Value of a Choice Attribute: "Included" and "Excluded".
   * The object "PossibleDecisionStates" specifies the currently still possible Decision States
   * for a Choice Value.
   */
  possibleDecisionStates: PossibleDecisionState[];
}

/**
 * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
 * whether it should be included in the search for a Solution by the Configuration Engine.
 * Before a Decision is made, there are two possible "Decision States": "Included" and "Excluded".
 * In case of a Choice Attribute, these are "Value-Decision States", i. e. Decision States regarding a Choice Value.
 * In case of a Component Attribute, these are "Model-Decision States", i. e. Decision States regarding a
 * Component Configuration Model.
 * ### Included
 * "Included" means that a Value of a Choice Attribute or a referenced Component Configuration Model
 * can be taken into account when the Configuration Engine searches for a Solution.
 * ### Excluded
 * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
 * cannot be taken into account when the Configuration Engine searches for a Solution.
 */
export enum PossibleDecisionState {
  Included = "Included",
  Excluded = "Excluded",
}

/**
 * A Numeric Consequence is the result of an evaluation weather of a Configuration Model or of made
 * Decisions in conjunction with a Configuration Model.
 * For a Numeric Attribute, represented by a Global Attribute ID, the following is specified:
 * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
 *     (isSatisfied = true).
 * (2) The meta attribute "selection" indicates if a Value assignment is mandatory or not.
 * (3) The meta attribute "range" specifies a range of numbers by specifying a maximum (max) and a minimum value (min).
 * (4) The number of decimal places is specified by an integer value of the meta-attribute "decimalPlaces".
 */
export interface NumericConsequence {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In this case, the meta attribute "isSatisfied" represents the "Value Satisfaction State".
   * The "Value" is the value  of a Numeric Attribute, which is always a decimal number.
   * It indicates for the Attribute under consideration whether Decisions still need to be made.
   */
  isSatisfied: boolean;
  /**
   * A Configurator must be able to realize different use cases. The API must support this, of course.
   * Therefore, there are two possibilities regarding the value assignment of a Numeric Attribute:
   * "Mandatory" means that a Value must be assigned to the considered Numeric Attribute,
   * for example by an user input.
   * "Optional" means that an assignment can be made - but is not required.
   * The meta attribute represents the design decision of the modeler. It can be used, for example,
   * for the state display of a control.
   */
  selection: Selection;
  /**
   * Declaring the numeric range for a Numeric Attribute can significantly affect the response time
   * of some routes. The numeric range should therefore be chosen as small as possible.
   */
  range: NumericValueRange;
  /**
   * The number of decimal places for the Values of a Numeric Attribute can significantly affect
   * the response time of some routes. Therefore it should be chosen as small as possible.
   */
  decimalPlaces: number;
}

/**
 * There are two possibilities regarding the value assignment of Attributes of the type
 * Boolean, Numeric or Component:
 *
 * ### Mandatory
 * "Mandatory" means that an assignment of a Value must be done. The Value can be
 * - depending on the type of the Attribute - a numeric, a boolean or a reference
 * to a Component Configuration Model.
 *
 * ### Optional
 * "Optional" means that such an assignment can - but not must - be done.
 *
 * The value of the meta attribute "selection" represents the design decision of the modeler.
 * It can be used, for example, for the state display of a control.
 * Examples can be found in the product documentation.
 */
export enum Selection {
  Mandatory = "Mandatory",
  Optional = "Optional",
}

/**
 * Declaring the numeric range for a Numeric Attribute can significantly affect the response time
 * of some routes. The numerical range should therefore be chosen as small as possible.
 */
export interface NumericValueRange {
  /**
   * The minimum value of a numerical range should be chosen as small as possible.
   * @format decimal
   */
  min: number;
  /**
   * The maximum value of a numerical range should be chosen as small as possible.
   * @format decimal
   */
  max: number;
}

/**
 * A Boolean Consequence is the result of an evaluation weather of a Configuration Model or of made
 * Decisions in conjunction with a Configuration Model.
 * For a Boolean Attribute, represented by a Global Attribute ID, the following is specified:
 * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
 *     (isSatisfied = true).
 * (2) The meta attribute "selection" indicates if a Value assignment (the choice "true" or "false") is mandatory or not.
 * (3) Furthermore, the currently still possible boolean states are indicated.
 */
export interface BooleanConsequence {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In this case, the meta attribute "isSatisfied" represents the "Value Satisfaction State".
   * The "Value" is one of the two Values of a Boolean Attribute.
   * It indicates for the Attribute under consideration whether Decisions still need to be made.
   */
  isSatisfied: boolean;
  /**
   * A Configurator must be able to realize different use cases. The API must support this, of course.
   * Therefore, there are two possibilities regarding the value assignment of a Boolean Attribute:
   * "Mandatory" means that an assignment TRUE respectively FALSE must be done.
   * "Optional" means that an assignment TRUE respectively FALSE can be done -
   * especially also by the Configuration Engine.
   * The meta attribute represents the design decision of the modeler. It can be used, for example,
   * for the state display of a control.
   */
  selection: Selection;
  /**
   * In case of a Boolean Attribute the two possible Decision States are "True" and "False".
   * The object "PossibleDecisionStates" encapsulates the currently still
   * possible boolean states.
   */
  possibleDecisionStates: boolean[];
}

/**
 * A Component Consequence is the result of an evaluation weather of a Configuration Model or of made
 * Decisions in conjunction with a Configuration Model.
 * For a Component Attribute, represented by a Global Attribute ID, the following is specified:
 * (1) By a boolean is specified whether a Decision is still necessary (isSatisfied = false) or not
 *     (isSatisfied = true).
 * (2) The meta attribute "inclusion" specifies whether a referenced Component Configuration Model is always
 *     considered in finding a Solution (inclusion = "Always") or only under certain conditions (inclusion = "Optional").
 * (3) The meta attribute "selection" indicates if the referencing of a Component Configuration Model is mandatory or not.
 * (4) Furthermore, the currently still possible Decision States are indicated.
 *     These are represented in the form of a list of objects of type "ChoiceValueConsequence".
 *     Examples can be found in the product documentation.
 */
export interface ComponentConsequence {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In this case, the meta attribute "isSatisfied" represents the "Value Satisfaction State".
   * The "Value" in this case is the name (identifier) of a Component Configuration Model.
   * It indicates for the Component Attribute under consideration whether Decisions still need to be made.
   * For details and examples see the product documentation.
   */
  isSatisfied: boolean;
  /**
   * The meta attribute "inclusion" maps a design decision when modeling a real-world product. A certain component of a
   * product or system of the real world is either mandatory or it is not required in every case.
   * Accordingly, the reference to a Component Configuration Model is set fixed (inclusion = Always) or
   * it is optional and can be set when necessary (inclusion = Optional).
   * Examples can be found in the product documentation.
   */
  inclusion: Inclusion;
  /**
   * The meta attribute "selection" is only relevant if the value assignment for a Component Attribute is optional,
   * i.e. a Component Configuration Model is referenced optionally (inclusion = Optional).
   * There are two possibilities regarding an optionally referenced Component Configuration Model:
   * "Mandatory" means that a decision whether or not to reference a Component Configuration Model is mandatory.
   * "Optional" means that a decision whether or not to reference a Component Configuration Model is optionally.
   * Such a reference can be also set by the Configuration Engine.
   * The meta attribute represents the design decision of the modeler. It can be used, for example,
   * for the state display of a control.
   */
  selection?: Selection | null;
  /**
   * There are two possible Decision States for a Value of a Component Attribute which is a reference to a
   * Component Configuration Model: "Included" and "Excluded".
   * A referenced Component Configuration Model may be part of finding a Solution (Decision State = "Included")
   * or it may be excluded from finding a Solution Decision State = "Excluded"). In other words,
   * the Attributes of the referenced Component Configuration Model and their Values are part of the
   * configuration result or not. Examples can be found in the product documentation.
   * The object "PossibleDecisionStates" encapsulates the currently still possible Decision States for the
   * referenced Component Configuration Model.
   */
  possibleDecisionStates: PossibleDecisionState[];
}

/**
 * The value of the meta attribute "inclusion" maps a design decision when modeling a real product world. A certain component of a
 * product or system of the real world is either mandatory or it is not required in every case.
 * Accordingly, the reference to a Component Configuration Model is set fixed (inclusion = Always) or
 * it is optional and can be set when necessary (inclusion = Optional).
 * Examples can be found in the product documentation.
 */
export enum Inclusion {
  Always = "Always",
  Optional = "Optional",
}

/** Contains the resulting changes of the configuration session. */
export interface PutDecisionResponse {
  /**
   * The Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   */
  consequences: Consequences;
  /**
   * Affected Decisions are those that were influenced by the Decision(s) given with the request.
   * The influence is a result of the Rule evaluation by the Configuration Engine.
   * The Decisions contained in the request are also returned.
   */
  affectedDecisions: Decisions;
}

/**
 * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
 * whether it should be included in the search for a Solution by the Configuration Engine.
 * The object "Decisions" covers lists of Decisions of the 4 various possible kinds.
 * See also the corresponding schemas.
 */
export interface Decisions {
  /** The object "BooleanDecisions" encapsulates  a list of Boolean Decisions. */
  booleanDecisions: BooleanDecision[];
  /** The object "NumericDecisions" encapsulates  a list of Numeric Decisions. */
  numericDecisions: NumericDecision[];
  /** The object "ComponentDecisions" encapsulates  a list of Component Decisions. */
  componentDecisions: ComponentDecision[];
  /** The object "ChoiceDecisions" encapsulates  a list of Choice Decisions. */
  choiceValueDecisions: ChoiceValueDecision[];
}

export interface BooleanDecision {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In the case of a Boolean Decision, the meta attribute "state" represents one of the two Values of the
   * considered Boolean Attribute.
   * The specified Value is always included when the Configuration Engine searches a solution.
   * The other Value is automatically excluded.
   */
  state?: boolean | null;
  /**
   * The meta-attribute "kind" represents the so-called Value Decision Kind.
   * It indicates the responsibility for the selected Value Decision State.
   *
   * ### Implicit
   *             "Implicit" means that the inclusion or exclusion of a Value has been made
   * by the Configuration Engine when there is no other decision left.
   *
   * ### Explicit
   * "Explicit" means that the inclusion or exclusion of a Value has been made
   * by the consumer of the API.
   */
  kind: DecisionKind;
}

/**
 * ### Implicit
 * "Implicit" means that the inclusion or exclusion of a Value has been made
 * by the Configuration Engine when there is no other decision left.
 *
 * ### Explicit
 * "Explicit" means that the inclusion or exclusion of a Value has been made
 * by the consumer.
 */
export enum DecisionKind {
  Implicit = "Implicit",
  Explicit = "Explicit",
}

export interface NumericDecision {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * In the case of a Numeric Decision, the meta attribute "state" represents the Value of the considered
   * Numeric Attribute (a decimal number).
   * This Value is always included when the Configuration Engine searches a solution.
   * @format decimal
   */
  state?: number | null;
  /**
   * The meta-attribute "kind" represents the so-called Value Decision Kind.
   * It indicates the responsibility for the selected Value Decision State.
   *
   * ### Implicit
   *             "Implicit" means that the inclusion or exclusion of a Value has been made
   * by the Configuration Engine when there is no other decision left.
   *
   * ### Explicit
   * "Explicit" means that the inclusion or exclusion of a Value has been made
   * by the consumer of the API.
   */
  kind: DecisionKind;
}

export interface ComponentDecision {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /**
   * The meta-attribute "state" represents the so-called Value Decision State. In case of a
   * Component Attribute means "Value" the reference to a Component Configuration Model.
   *
   * ### state = “Included”
   * "Included" means that the referenced Component Configuration Model
   * is taken into account when the Configuration Engine searches for a Solution.
   *
   * ### state = “Excluded”
   * "Excluded" means that he referenced Component Configuration Model is not taken into account
   * when the Configuration Engine searches for a Solution.
   *
   * ### state = "Undefined"
   * "Undefined" states that it is not yet decided if the referenced
   * Component Configuration Model is taken into account or not.
   * - A referenced Component Configuration Model that has the Decision State "undefined"
   *   can still become the subject of an Implicit Decision.
   */
  state: DecisionState;
  /**
   * The meta-attribute "kind" represents the so-called Value Decision Kind.
   * It indicates the responsibility for the selected Value Decision State.
   *
   * ### Implicit
   *             "Implicit" means that the inclusion or exclusion of a Value has been made
   * by the Configuration Engine when there is no other decision left.
   *
   * ### Explicit
   * "Explicit" means that the inclusion or exclusion of a Value has been made
   * by the consumer of the API.
   */
  kind: DecisionKind;
}

/**
 * The "Decision State" refers to a Value of a Choice Attribute or a referenced
 * Component Configuration Model. It is transmitted to the Configuration Engine with a request.
 * ### Included
 * "Included" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
 * are taken into account when the Configuration Engine searches for a Solution.
 * - In case of a Choice Attribute this is analogous to selecting a Value.
 *
 * ### Excluded
 * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
 * are not taken into account when the Configuration Engine searches for a Solution.
 * - In case of a Choice Attribute an excluded Value can not become the subject of an Implicit Decision.
 *
 * ### Undefined
 * "Undefined" states that it is not yet decided if a considered Choice Value or a referenced
 * Component Configuration Model are taken into account or not.
 * - In case of a Choice Attribute this is analogous to not having selected a Value.
 * - An undefined Choice Value can still become the subject of an Implicit Decision.
 * - A referenced Component Configuration Model that has the Decision State "undefined"
 *   can also become the subject of an Implicit Decision.
 */
export enum DecisionState {
  Included = "Included",
  Excluded = "Excluded",
  Undefined = "Undefined",
}

/**
 * A Choice Value Decision is a decision regarding a Value of a Choice Attribute.
 * Such a decision can be made explicitly by a user of the API, e.g. a Configurator or implicitly
 * by the Configuration Engine.
 * It concerns the question of whether a Value is included in finding a Solution
 * (Value-Decision State = “Included”) or not (Value-Decision State = “Excluded”).
 * It also specifies for the considered Value who is responsible for including or excluding:
 * the API consumer or the Configuration Engine.
 */
export interface ChoiceValueDecision {
  /**
   * The ability to nest Configuration Models and reuse them in Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used. Details can be found in the scheme "GlobalAttributeId".
   */
  attributeId: GlobalAttributeId;
  /** A Choice Value is identified by a string. */
  choiceValueId: string;
  /**
   * The meta-attribute "state" represents the so-called Value Decision State.
   *
   * ### state = “Included”
   * "Included" means that the considered Choice Value is taken into account
   * when the Configuration Engine searches for a Solution.
   * - This is analogous to selecting a Value.
   *
   * ### state = “Excluded”
   * "Excluded" means that the considered Choice Value is not taken into account
   * when the Configuration Engine searches for a Solution.
   * - An excluded Value can not become the subject of an Implicit Decision.
   *
   * ### state = "Undefined"
   * "Undefined" states that it is not yet decided if the considered Choice Value is
   * taken into account or not.
   * - This is analogous to not having selected a Value.
   * - An undefined Choice Value can still become the subject of an Implicit Decision.
   */
  state: DecisionState;
  /**
   * The meta-attribute "kind" represents the so-called Value Decision Kind.
   * It indicates the responsibility for the selected Value Decision State.
   *
   * ### Implicit
   *             "Implicit" means that the inclusion or exclusion of a Value has been made
   * by the Configuration Engine when there is no other decision left.
   *
   * ### Explicit
   * "Explicit" means that the inclusion or exclusion of a Value has been made
   * by the consumer of the API.
   */
  kind: DecisionKind;
}

export type ExplicitDecision = (
  | UtilRequiredKeys<ExplicitChoiceValueDecision, "attributeId">
  | UtilRequiredKeys<ExplicitNumericDecision, "attributeId">
  | UtilRequiredKeys<ExplicitBooleanDecision, "attributeId">
  | UtilRequiredKeys<ExplicitComponentDecision, "attributeId">
) & {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
};

/** The object "ExplicitChoiceDecision" encapsulates  a list of Choice Values with the associated current Decision State. */
export interface ExplicitChoiceValueDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Choice";
  choiceValueId: string;
  /**
   * The "Decision State" refers to a Value of a Choice Attribute or a referenced
   * Component Configuration Model. It is transmitted to the Configuration Engine with a request.
   * ### Included
   * "Included" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * are taken into account when the Configuration Engine searches for a Solution.
   * - In case of a Choice Attribute this is analogous to selecting a Value.
   *
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * are not taken into account when the Configuration Engine searches for a Solution.
   * - In case of a Choice Attribute an excluded Value can not become the subject of an Implicit Decision.
   *
   * ### Undefined
   * "Undefined" states that it is not yet decided if a considered Choice Value or a referenced
   * Component Configuration Model are taken into account or not.
   * - In case of a Choice Attribute this is analogous to not having selected a Value.
   * - An undefined Choice Value can still become the subject of an Implicit Decision.
   * - A referenced Component Configuration Model that has the Decision State "undefined"
   *   can also become the subject of an Implicit Decision.
   */
  state: DecisionState;
}

export enum AttributeType {
  Choice = "Choice",
  Numeric = "Numeric",
  Boolean = "Boolean",
  Component = "Component",
}

/** The object "ExplicitNumericDecision" encapsulates a Numeric Value with the associated current Decision State. */
export interface ExplicitNumericDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Numeric";
  /** @format decimal */
  state?: number | null;
}

/** The object "ExplicitBooleanDecision" encapsulates a Boolean Value with the associated current Decision State. */
export interface ExplicitBooleanDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Boolean";
  state?: boolean | null;
}

/**
 * The object "ExplicitComponentDecision" specifies weather a referenced Component Configuration Model is taken into account
 * if the Configuration Engine searches a Solution.
 */
export interface ExplicitComponentDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Component";
  /**
   * The "Decision State" refers to a Value of a Choice Attribute or a referenced
   * Component Configuration Model. It is transmitted to the Configuration Engine with a request.
   * ### Included
   * "Included" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * are taken into account when the Configuration Engine searches for a Solution.
   * - In case of a Choice Attribute this is analogous to selecting a Value.
   *
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * are not taken into account when the Configuration Engine searches for a Solution.
   * - In case of a Choice Attribute an excluded Value can not become the subject of an Implicit Decision.
   *
   * ### Undefined
   * "Undefined" states that it is not yet decided if a considered Choice Value or a referenced
   * Component Configuration Model are taken into account or not.
   * - In case of a Choice Attribute this is analogous to not having selected a Value.
   * - An undefined Choice Value can still become the subject of an Implicit Decision.
   * - A referenced Component Configuration Model that has the Decision State "undefined"
   *   can also become the subject of an Implicit Decision.
   */
  state: DecisionState;
}

/** Contains the resulting changes of the configuration session. */
export interface PutManyDecisionsSuccessResponse {
  /**
   * The Consequences are the result of an evaluation weather of a Configuration Model or of made
   * Decisions in conjunction with a Configuration Model.
   */
  consequences: Consequences;
  /**
   * Affected Decisions are those that were influenced by the Decision(s) given with the request.
   * The influence is a result of the Rule evaluation by the Configuration Engine.
   * The Decisions contained in the request are also returned.
   */
  affectedDecisions: Decisions;
  /** Rejected Decisions are those from the request that could not be applied and were therefore rejected. */
  rejectedDecisions: Decisions;
}

export interface PutManyDecisionsConflictResponse {
  constraintExplanations: ConstraintExplanation[];
  decisionExplanations: DecisionExplanation[];
}

export interface ConstraintExplanation {
  causedByCardinalities: CardinalityConstraint[];
  causedByRules: RuleConstraint[];
}

export interface CardinalityConstraint {
  /**
   * A Constraint of the type "UserDefined" is created by a user with the help of the
   * Configuration Model Developer (CMD).
   * A Constraint of the type "Cardinality" is derived by the Configuration Engine
   * from the cardinality of a choice attribute.
   * The cardinality definition specifies a lower and an upper bound.
   * The lower bound controls how many Values MUST be selected.
   * - 0 means that the selection of a Value is optional.
   * - N means that a least N Values must be selected. For example: 1 means that mandatory 1 Value must be selected.
   * The upper bound controls how many Values CAN be selected.
   * - 1 means that only one Value can be selected.
   * - N means that optional N Values can be selected.
   */
  type: ConstraintType;
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
}

/**
 * A Constraint of the type "UserDefined" is created by a user with the help of the
 * Configuration Model Developer (CMD).
 * A Constraint of the type "Cardinality" is derived by the Configuration Engine
 * from the cardinality of a choice attribute.
 * The cardinality definition specifies a lower and an upper bound.
 * The lower bound controls how many Values MUST be selected.
 * - 0 means that the selection of a Value is optional.
 * - N means that a least N Values must be selected. For example: 1 means that mandatory 1 Value must be selected.
 * The upper bound controls how many Values CAN be selected.
 * - 1 means that only one Value can be selected.
 * - N means that optional N Values can be selected.
 */
export enum ConstraintType {
  Rule = "Rule",
  Cardinality = "Cardinality",
  Component = "Component",
}

export interface RuleConstraint {
  /**
   * A Constraint of the type "UserDefined" is created by a user with the help of the
   * Configuration Model Developer (CMD).
   * A Constraint of the type "Cardinality" is derived by the Configuration Engine
   * from the cardinality of a choice attribute.
   * The cardinality definition specifies a lower and an upper bound.
   * The lower bound controls how many Values MUST be selected.
   * - 0 means that the selection of a Value is optional.
   * - N means that a least N Values must be selected. For example: 1 means that mandatory 1 Value must be selected.
   * The upper bound controls how many Values CAN be selected.
   * - 1 means that only one Value can be selected.
   * - N means that optional N Values can be selected.
   */
  type: ConstraintType;
  constraintId: GlobalConstraintId;
}

export interface GlobalConstraintId {
  localId: string;
  configurationModelId: string;
}

/**
 * In an Explanation are specified the Explicit Decisions (Choice, Numeric, Boolean and Component)
 * which lead to the current Value-Decision State respectively Model-Decision State (Excluded, Included).
 */
export interface DecisionExplanation {
  causedByChoiceDecisions: CausedByChoiceValueDecision[];
  causedByNumericDecisions: CausedByNumericDecision[];
  causedByBooleanDecisions: CausedByBooleanDecision[];
  causedByComponentDecisions: CausedByComponentDecision[];
}

/** The object "CausedByChoiceDecision" encapsulates  a list of Choice Values with the associated current Decision State. */
export interface CausedByChoiceValueDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  reason: Reason;
  type: AttributeType;
  choiceValueId: string;
  /**
   * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
   * whether it should be included in the search for a Solution by the Configuration Engine.
   * Before a Decision is made, there are two possible "Decision States": "Included" and "Excluded".
   * In case of a Choice Attribute, these are "Value-Decision States", i. e. Decision States regarding a Choice Value.
   * In case of a Component Attribute, these are "Model-Decision States", i. e. Decision States regarding a
   * Component Configuration Model.
   * ### Included
   * "Included" means that a Value of a Choice Attribute or a referenced Component Configuration Model
   * can be taken into account when the Configuration Engine searches for a Solution.
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * cannot be taken into account when the Configuration Engine searches for a Solution.
   */
  state: PossibleDecisionState;
}

export enum Reason {
  NotAvailable = "NotAvailable",
  StateNotPossible = "StateNotPossible",
}

/** The object "CausedByNumericDecision" encapsulates a Numeric Value with the associated current Decision State. */
export interface CausedByNumericDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  reason: Reason;
  type: AttributeType;
  /** @format decimal */
  state?: number | null;
}

/** The object "CausedByBooleanDecision" encapsulates a Boolean Value with the associated current Decision State. */
export interface CausedByBooleanDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  reason: Reason;
  type: AttributeType;
  state?: boolean | null;
}

/**
 * The object "CausedByComponentDecision" specifies weather a referenced Component Configuration Model is taken into account
 * if the Configuration Engine searches a Solution.
 */
export interface CausedByComponentDecision {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  reason: Reason;
  type: AttributeType;
  /**
   * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
   * whether it should be included in the search for a Solution by the Configuration Engine.
   * Before a Decision is made, there are two possible "Decision States": "Included" and "Excluded".
   * In case of a Choice Attribute, these are "Value-Decision States", i. e. Decision States regarding a Choice Value.
   * In case of a Component Attribute, these are "Model-Decision States", i. e. Decision States regarding a
   * Component Configuration Model.
   * ### Included
   * "Included" means that a Value of a Choice Attribute or a referenced Component Configuration Model
   * can be taken into account when the Configuration Engine searches for a Solution.
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * cannot be taken into account when the Configuration Engine searches for a Solution.
   */
  state: PossibleDecisionState;
}

/**
 * An Explicit Decision is a Decision which is made by an API consumer, for instance a Configurator.
 * In contrast, an Implicit Decision is made by the Configuration Engine.
 * The object "ExplicitDecisions" encapsulates the Explicit Decisions for every Value of every
 * Attribute of the 4 different types.
 */
export interface ExplicitDecisions {
  mode?: Mode | null;
  /** The object "ChoiceDecisions" encapsulates  a list of Explicit Choice Decisions. */
  choiceDecisions?: ExplicitChoiceValueDecision[] | null;
  /** The object "NumericDecisions" encapsulates  a list of Explicit Numeric Decisions. */
  numericDecisions?: ExplicitNumericDecision[] | null;
  /** The object "BooleanDecisions" encapsulates  a list of Explicit Boolean Decisions. */
  booleanDecisions?: ExplicitBooleanDecision[] | null;
  /** The object "ComponentDecisions" encapsulates  a list of Explicit Component Decisions. */
  componentDecisions?: ExplicitComponentDecision[] | null;
}

export type Mode = DefaultMode | DropExistingDecisionsMode | KeepExistingDecisionsMode;

/** Alias for KeepExistingDecisionsMode. */
export interface DefaultMode {
  type: "Default";
}

export interface DropExistingDecisionsMode {
  type: "DropExistingDecisions";
  conflictResolution: ConflictResolution;
}

export type ConflictResolution = ManualConflictResolution | AutomaticConflictResolution;

export interface ManualConflictResolution {
  includeConstraintsInConflictExplanation: boolean;
  type: "Manual";
}

export interface AutomaticConflictResolution {
  type: "Automatic";
}

export interface KeepExistingDecisionsMode {
  type: "KeepExistingDecisions";
}

export interface ExplainResult {
  constraintExplanations: ConstraintExplanation[];
  decisionExplanations: DecisionExplanation[];
}

export type WhyNotSatisfiedRequest = WhyAttributeNotSatisfiedRequest | WhyConfigurationNotSatisfiedRequest;

export interface WhyAttributeNotSatisfiedRequest {
  type: "Attribute";
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
}

export enum WhyNotSatisfiedType {
  Attribute = "Attribute",
  Configuration = "Configuration",
}

export interface WhyConfigurationNotSatisfiedRequest {
  type: "Configuration";
}

export type WhyStateNotPossibleRequest = (
  | UtilRequiredKeys<WhyBooleanStateNotPossibleRequest, "attributeId">
  | UtilRequiredKeys<WhyNumericStateNotPossibleRequest, "attributeId">
  | UtilRequiredKeys<WhyChoiceValueStateNotPossibleRequest, "attributeId">
  | UtilRequiredKeys<WhyComponentStateNotPossibleRequest, "attributeId">
) & {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
};

export interface WhyBooleanStateNotPossibleRequest {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Boolean";
  state: boolean;
}

export enum WhyStateNotPossibleType {
  Boolean = "Boolean",
  Numeric = "Numeric",
  ChoiceValue = "ChoiceValue",
  Component = "Component",
}

export interface WhyNumericStateNotPossibleRequest {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Numeric";
  /** @format decimal */
  state: number;
}

export interface WhyChoiceValueStateNotPossibleRequest {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "ChoiceValue";
  choiceValueId: string;
  /**
   * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
   * whether it should be included in the search for a Solution by the Configuration Engine.
   * Before a Decision is made, there are two possible "Decision States": "Included" and "Excluded".
   * In case of a Choice Attribute, these are "Value-Decision States", i. e. Decision States regarding a Choice Value.
   * In case of a Component Attribute, these are "Model-Decision States", i. e. Decision States regarding a
   * Component Configuration Model.
   * ### Included
   * "Included" means that a Value of a Choice Attribute or a referenced Component Configuration Model
   * can be taken into account when the Configuration Engine searches for a Solution.
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * cannot be taken into account when the Configuration Engine searches for a Solution.
   */
  state: PossibleDecisionState;
}

export interface WhyComponentStateNotPossibleRequest {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  type: "Component";
  /**
   * A Decision is a decision about an Attribute. For each Value, it is stated explicitly or implicitly
   * whether it should be included in the search for a Solution by the Configuration Engine.
   * Before a Decision is made, there are two possible "Decision States": "Included" and "Excluded".
   * In case of a Choice Attribute, these are "Value-Decision States", i. e. Decision States regarding a Choice Value.
   * In case of a Component Attribute, these are "Model-Decision States", i. e. Decision States regarding a
   * Component Configuration Model.
   * ### Included
   * "Included" means that a Value of a Choice Attribute or a referenced Component Configuration Model
   * can be taken into account when the Configuration Engine searches for a Solution.
   * ### Excluded
   * "Excluded" means that a considered Value of a Choice Attribute or a referenced Component Configuration Model
   * cannot be taken into account when the Configuration Engine searches for a Solution.
   */
  state: PossibleDecisionState;
}

/** Contains the sessionId and other related data for the successfully created session. */
export type CreateSessionSuccessResponse = CreateSessionResponse & {
  /** Identifies a Session. */
  sessionId?: string;
  /** Describes the automatic expiration of a session. */
  timeout?: SessionTimeout;
};

/** Describes the automatic expiration of a session. */
export interface SessionTimeout {
  /**
   * Indicates the absolute expiration of the session - when the session will expire at latest.
   * @format date-time
   */
  absolute: string;
  /**
   * Indicates what the sliding expiration of the session is in seconds. Meaning the session will expire if left untouched for the indicated amount of time.
   * @format int32
   */
  slidingInSeconds: number;
}

export type CreateSessionResponse = object;

export type CreateSessionConflictResponse =
  | CreateSessionConfigurationModelNotFeasibleConflict
  | CreateSessionConfigurationModelInvalidConflict;

export type CreateSessionConfigurationModelNotFeasibleConflict = (CreateSessionResponse & {
  title: string;
  /** @format int32 */
  status: number;
  detail?: string | null;
}) & {
  title: string;
  /** @format int32 */
  status: number;
  detail?: string | null;
  type: "ConfigurationModelNotFeasible";
  constraintExplanations: ConstraintExplanation[];
};

export type CreateSessionConfigurationModelInvalidConflict = (CreateSessionResponse & {
  title: string;
  /** @format int32 */
  status: number;
  detail?: string | null;
}) & {
  title: string;
  /** @format int32 */
  status: number;
  detail?: string | null;
  type: "ConfigurationModelInvalid";
};

/** This object contains the data required to create a new Configuration Session. */
export interface CreateSessionRequest {
  /**
   * There are two ways to make a Configuration Model, which generally consists of several
   * Sub Configuration Models, part of a Configuration Session.
   * (1) A specific deployed model version can be obtained from a specific Channel.
   *     This is the variant for the majority of cases.
   * (2) The nested structure of the sub models can be specified as a "Package" directly in the request body.
   */
  configurationModelSource: ConfigurationModelSource;
  /**
   * This object can be used to specify, which Decisions are to be respected for which Attribute.
   * Note: When using this object, all existing Attributes must be listed.
   * Examples can be found in the product documentation.
   */
  attributeRelations?: DecisionsToRespect[] | null;
  /**
   * Contextual information that will be processed in evaluating the Usage Rules.
   * Examples can be found in the product documentation.
   * @example {"principal.country":"de","applicationId":"webshop"}
   */
  usageRuleParameters?: Record<string, string>;
  allowedInExplain?: AllowedInExplain | null;
}

/**
 * There are two ways to make a Configuration Model, which generally consists of several
 * Sub Configuration Models, part of a Configuration Session.
 * (1) A specific deployed model version can be obtained from a specific Channel.
 *     This is the variant for the majority of cases.
 * (2) The nested structure of the sub models can be specified as a "Package" directly in the request body.
 */
export type ConfigurationModelSource = ConfigurationModelFromChannel | ConfigurationModelFromPackage;

export interface ConfigurationModelFromChannel {
  channel: string;
  deploymentName: string;
  type: "Channel";
}

export interface ConfigurationModelFromPackage {
  configurationModelPackage: ConfigurationModelPackage;
  type: "Package";
}

export interface ConfigurationModelPackage {
  root: string;
  configurationModels: ConfigurationModel[];
}

export interface ConfigurationModel {
  configurationModelId: string;
  sharedFromConfigurationModels?: string[] | null;
  attributes: Attributes;
  constraints?: Constraint[] | null;
  usageRules?: UsageRules | null;
}

export interface Attributes {
  choiceAttributes?: ChoiceAttribute[] | null;
  numericAttributes?: NumericAttribute[] | null;
  booleanAttributes?: BooleanAttribute[] | null;
  componentAttributes?: ComponentAttribute[] | null;
}

export interface ChoiceAttribute {
  attributeId: string;
  lowerBound: number;
  upperBound: number;
  choiceValues: ChoiceValue[];
}

export interface ChoiceValue {
  choiceValueId: string;
}

export interface NumericAttribute {
  attributeId: string;
  isDecisionRequired: boolean;
  /** @format decimal */
  min: number;
  /** @format decimal */
  max: number;
  decimalPlaces: number;
}

export interface BooleanAttribute {
  attributeId: string;
  isDecisionRequired: boolean;
}

export interface ComponentAttribute {
  attributeId: string;
  configurationModelId: string;
  inclusion: ComponentInclusionType;
}

export type ComponentInclusionType = OptionallyIncluded | AlwaysIncluded;

export interface OptionallyIncluded {
  isDecisionRequired: boolean;
  type: "OptionallyIncluded";
}

export interface AlwaysIncluded {
  type: "AlwaysIncluded";
}

export interface Constraint {
  constraintId: string;
  textualConstraint: string;
}

export interface UsageRules {
  modelUsageRule?: ModelUsageRule | null;
  attributeUsageRules?: AttributeUsageRule[] | null;
  choiceValueUsageRules?: ChoiceValueUsageRule[] | null;
  constraintUsageRules?: ConstraintUsageRule[] | null;
}

export type ModelUsageRule = UsageRule & object;

export interface UsageRule {
  usageRuleId: string;
  expressionGroups: ExpressionGroup[];
}

export interface ExpressionGroup {
  groupId: string;
  operatorExpressions?: OperatorExpression[] | null;
  regularExpressions?: RegularExpression[] | null;
}

export interface OperatorExpression {
  parameterKey: string;
  operator: UsageRuleOperator;
  valueType: UsageRuleValueType;
  value: string;
}

export enum UsageRuleOperator {
  Equal = "Equal",
  NotEqual = "NotEqual",
  Greater = "Greater",
  GreaterEqual = "GreaterEqual",
  Less = "Less",
  LessEqual = "LessEqual",
}

export enum UsageRuleValueType {
  Date = "Date",
  String = "String",
  Numeric = "Numeric",
}

export interface RegularExpression {
  parameterKey: string;
  regex: string;
}

export type AttributeUsageRule = UsageRule & {
  attributeId?: string;
};

export type ChoiceValueUsageRule = UsageRule & {
  attributeId?: string;
  choiceValueId?: string;
};

export type ConstraintUsageRule = UsageRule & {
  constraintId?: string;
};

export interface DecisionsToRespect {
  /**
   * The ability to nest Configuration Models and reuse them when modelling Components requires an Attribute identifier
   * that is unique across the Models. Therefore, an object with the corresponding properties for mapping
   * the identifier components is used.
   * The GlobalAttributeId is practically a resource path, which can also be called an "Attribute Path"
   * because it is the path to an Attribute.
   * shared component path localId
   * Details can be found in the API product documentation.
   */
  attributeId: GlobalAttributeId;
  decisions: GlobalAttributeId[];
}

export interface AllowedInExplain {
  rules?: AllowedRules | null;
}

export type AllowedRules = AllowedRulesNone | AllowedRulesSpecific | AllowedRulesAll;

export interface AllowedRulesNone {
  type: "AllowedRulesNone";
}

export interface AllowedRulesSpecific {
  rules: GlobalConstraintId[];
  type: "AllowedRulesSpecific";
}

export interface AllowedRulesAll {
  type: "AllowedRulesAll";
}

export interface CloseSessionRequest {
  sessionId: string;
}
