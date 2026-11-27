// Generated from https://spc.viamedici.io/hca/api/engine/api-docs/v2/openapi.json by scripts/generate-engine-types.ts. Do not edit; regenerate instead.

export interface paths {
    "/v2/session/configuration/active-attributes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Active Attributes
         * @description Lists the attributes currently set as active.
         */
        get: operations["ActiveAttributes_Get"];
        put?: never;
        /**
         * Set Active Attributes
         * @description Submits multiple attributes to be set as active.
         *     The response contains the resulting [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence) and
         *     [Affected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#affected-decision).
         */
        post: operations["ActiveAttributes_Post"];
        /**
         * Delete Active Attributes
         * @description Deletes the active attributes.
         *     The response contains the resulting [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence) and
         *     [Affected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#affected-decision).
         */
        delete: operations["ActiveAttributes_Delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/active-attributes/evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Evaluate Active Attributes
         * @description Submits multiple attributes to be evaluated.
         *     Works similarily to set active attributes, however it only use the provided set of active attributes for this evaluation and does not change the original set of active attributes.
         *     The response contains the resulting [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence) and
         *     [Affected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#affected-decision).
         */
        post: operations["ActiveAttributes_Evaluate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get consequences
         * @description Returns the evaluated [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence) for all Attributes
         *     in the current [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session).
         *     This route evaluates the current [Configuration State](https://viamedici-spc.github.io/docs/glossary/terms-state/#configuration-state)
         *     based on the [Configuration Model](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#configuration-model)
         *     and the [Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#decision)
         *     made so far, including the underlying [Constraints](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#constraint)
         *     and [Rules](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#configuration-rule).
         *     The response contains:
         *     The overall [Configuration Model-Satisfaction State](https://viamedici-spc.github.io/docs/glossary/terms-state/#configuration-model-satisfaction-state).
         *     Attribute-specific Consequence information for all relevant [Attributes](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#attribute).
         *     For each Attribute, the Consequence includes at least the [Attribute Satisfaction State](https://viamedici-spc.github.io/docs/glossary/terms-state/#attribute-satisfaction-state) (true or false).
         */
        get: operations["Consequence_Get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get all decisions
         * @description Returns all [Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#decision)
         *     currently associated with the [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session).
         *     Decisions include [Explicit Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#explicit-decision) made by the client and
         *     [Implicit Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#implicit-decision) derived by the engine.
         */
        get: operations["Decision_GetAllDecisions"];
        /**
         * Apply single decision
         * @description Submits a [Single Decision](https://viamedici-spc.github.io/docs/glossary/terms-state/#single-decision).
         *     The response contains the resulting [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence) and
         *     [Affected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#affected-decision).
         */
        put: operations["Decision_PutDecision"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/decision/many": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Apply multiple decisions
         * @description Submits [Multiple Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#multiple-decision).
         *     The response contains the resulting [Consequences](https://viamedici-spc.github.io/docs/glossary/terms-state/#consequence),
         *     [Affected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#affected-decision), and
         *     [Rejected Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#rejected-decision).
         */
        put: operations["Decision_PutMany"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-not-satisfied": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Explain why not satisfied
         * @description Returns [Explanations](https://viamedici-spc.github.io/docs/glossary/terms-state/#explanation) for why an
         *     [Attribute](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#attribute) is not satisfied.
         */
        post: operations["Explain_WhyNotSatisfied"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-not-satisfied/answer/decisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get decisions responsible for not-satisfied state
         * @description Returns the [Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#decision) responsible for
         *     the not-satisfied state of an [Attribute](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#attribute).
         */
        post: operations["Explain_WhyNotSatisfiedDecisions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-not-satisfied/answer/constraints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get constraints responsible for not-satisfied state
         * @description Returns the [Constraints](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#constraint) and
         *     [Rules](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#configuration-rule) responsible for
         *     the not-satisfied state of an [Attribute](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#attribute).
         */
        post: operations["Explain_WhyNotSatisfiedRules"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-state-not-possible": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Explain why state is not possible
         * @description Returns [Explanations](https://viamedici-spc.github.io/docs/glossary/terms-state/#explanation) for why a specific
         *     [Value Decision State](https://viamedici-spc.github.io/docs/glossary/terms-state/#value-decision-state) is not possible.
         */
        post: operations["Explain_WhyStateNotPossible"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-state-not-possible/answer/decisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get decisions responsible for not-possible state
         * @description Returns the [Decisions](https://viamedici-spc.github.io/docs/glossary/terms-state/#decision) responsible for
         *     a specific [Value Decision State](https://viamedici-spc.github.io/docs/glossary/terms-state/#value-decision-state) being impossible.
         */
        post: operations["Explain_WhyStateNotPossibleDecisions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/consequence/explain/why-state-not-possible/answer/constraints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get constraints responsible for not-possible state
         * @description Returns the [Constraints](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#constraint) and
         *     [Rules](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#configuration-rule) responsible for
         *     a specific [Value Decision State](https://viamedici-spc.github.io/docs/glossary/terms-state/#value-decision-state) being impossible.
         */
        post: operations["Explain_WhyStateNotPossibleRules"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/meta/configuration-model": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get model metadata
         * @description Returns structural metadata for the [Configuration Model](https://viamedici-spc.github.io/docs/glossary/terms-modelling/#configuration-model)
         *     associated with the current [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session).
         */
        get: operations["Meta_GetConfigurationModel"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/configuration/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get complete metadata
         * @description Returns the complete metadata for the current [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session).
         */
        get: operations["Meta_Get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/obsoletion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Obsoletion Meta
         * @description Provides obsoletion status for the requested API-Version.
         *     Additionally, obsolete routes can have an end-of-life sheduled.
         */
        get: operations["Obsoletion_GetObsoletion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create session
         * @description Creates a new [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session)
         *     for the current tenant. The returned session ID is required for subsequent session-scoped operations.
         *     The request is validated against configured session restrictions (e.g., side-loading restrictions
         *     and deployment/channel allowlists) before it is processed.
         *     This endpoint requires API credentials (Bearer authentication).
         */
        post: operations["Session_Post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete session
         * @description Terminates the [Configuration Session](https://viamedici-spc.github.io/docs/glossary/terms-infrastructure/#configuration-session)
         *     identified by the sessionId.
         *     All server-side state associated with the session is discarded.
         */
        delete: operations["Session_Delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/session/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Close session
         * @description This route has the same functional effect as Delete Session, but uses POST
         *     to support scenarios where sending DELETE requests is not feasible (e.g., using the Beacon API during page/tab unload).
         *     All server-side state associated with the session is discarded.
         */
        post: operations["Session_Close"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ActiveAttributesRequest: {
            activeAttributes: components["schemas"]["GlobalAttributeId"][];
        };
        ActiveAttributesResponse: {
            consequences: components["schemas"]["Consequences"];
            affectedDecisions: components["schemas"]["Decisions"];
        };
        AllowedInExplain: {
            rules?: components["schemas"]["AllowedRules"] | null;
        };
        AllowedRules: {
            type: string;
        } & (components["schemas"]["AllowedRulesNone"] | components["schemas"]["AllowedRulesSpecific"] | components["schemas"]["AllowedRulesAll"]);
        AllowedRulesAll: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AllowedRulesAll";
        };
        AllowedRulesNone: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AllowedRulesNone";
        };
        AllowedRulesSpecific: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AllowedRulesSpecific";
            rules: components["schemas"]["GlobalConstraintId"][];
        };
        AlwaysIncluded: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AlwaysIncluded";
        };
        AssignedChannelNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AssignedChannelNotFound";
            /** Format: int32 */
            status: number;
            globalChannelId: components["schemas"]["GlobalChannelId"];
            title: string;
            detail: string;
        };
        AttributeNotActive: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AttributeNotActive";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        AttributeNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AttributeNotFound";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        Attributes: {
            choiceAttributes?: components["schemas"]["ChoiceAttribute"][] | null;
            numericAttributes?: components["schemas"]["NumericAttribute"][] | null;
            booleanAttributes?: components["schemas"]["BooleanAttribute"][] | null;
            componentAttributes?: components["schemas"]["ComponentAttribute"][] | null;
        };
        AuthenticationFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "AuthenticationFailure";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        AutomaticConflictResolution: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Automatic";
        };
        BooleanAttribute: {
            attributeId: string;
            isDecisionRequired: boolean;
        };
        BooleanAttributeNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "BooleanAttributeNotFound";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        BooleanConsequence: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            isSatisfied: boolean;
            selection: components["schemas"]["Selection"];
            possibleDecisionStates: boolean[];
            isPossibleDecisionStatesImmutable: boolean;
        };
        BooleanDecision: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            state: boolean | null;
            kind: components["schemas"]["DecisionKind"];
        };
        Cardinality: {
            lowerBound: number;
            upperBound: number;
        };
        CardinalityConstraint: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Cardinality";
        };
        CausedByBooleanDecision: {
            state?: boolean | null;
            attributeId: components["schemas"]["GlobalAttributeId"];
            reason: components["schemas"]["Reason"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Boolean";
        };
        CausedByChoiceValueDecision: {
            choiceValueId: string;
            state: components["schemas"]["PossibleDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
            reason: components["schemas"]["Reason"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Choice";
        };
        CausedByComponentDecision: {
            state: components["schemas"]["PossibleDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
            reason: components["schemas"]["Reason"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Component";
        };
        CausedByDecision: {
            type: string;
            attributeId: components["schemas"]["GlobalAttributeId"];
            reason: components["schemas"]["Reason"];
        } & (components["schemas"]["CausedByChoiceValueDecision"] | components["schemas"]["CausedByNumericDecision"] | components["schemas"]["CausedByBooleanDecision"] | components["schemas"]["CausedByComponentDecision"]);
        CausedByNumericDecision: {
            /** Format: decimal */
            state?: number | null;
            attributeId: components["schemas"]["GlobalAttributeId"];
            reason: components["schemas"]["Reason"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Numeric";
        };
        ChoiceAttribute: {
            attributeId: string;
            lowerBound: number;
            upperBound: number;
            choiceValues: components["schemas"]["ChoiceValue"][];
        };
        ChoiceAttributeNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChoiceAttributeNotFound";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        ChoiceConsequence: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            isSatisfied: boolean;
            cardinality: components["schemas"]["Cardinality"];
            values: components["schemas"]["ChoiceValueConsequence"][];
        };
        ChoiceValue: {
            choiceValueId: string;
        };
        ChoiceValueConsequence: {
            choiceValueId: string;
            possibleDecisionStates: components["schemas"]["PossibleDecisionState"][];
            isPossibleDecisionStatesImmutable: boolean;
        };
        ChoiceValueDecision: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            choiceValueId: string;
            state: components["schemas"]["DecisionState"];
            kind: components["schemas"]["DecisionKind"];
        };
        ChoiceValueNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChoiceValueNotFound";
            /** Format: int32 */
            status: number;
            globalChoiceValueId: components["schemas"]["GlobalChoiceValueId"];
            title: string;
            detail: string;
        };
        CloseSessionRequest: {
            sessionId: string;
        };
        CompleteMeta: {
            configurationModels: components["schemas"]["ConfigurationModelMeta"][];
        };
        ComponentAttribute: {
            attributeId: string;
            configurationModelId: string;
            inclusion: components["schemas"]["ComponentInclusionType"];
        };
        ComponentAttributeNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ComponentAttributeNotFound";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        ComponentConsequence: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            isSatisfied: boolean;
            inclusion: components["schemas"]["Inclusion"];
            selection: components["schemas"]["Selection"] | null;
            possibleDecisionStates: components["schemas"]["PossibleDecisionState"][];
            isPossibleDecisionStatesImmutable: boolean;
        };
        ComponentDecision: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            state: components["schemas"]["DecisionState"];
            kind: components["schemas"]["DecisionKind"];
        };
        ComponentInclusionType: {
            type: string;
        } & (components["schemas"]["OptionallyIncluded"] | components["schemas"]["AlwaysIncluded"]);
        ConfigurationInitializationFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConfigurationInitializationFailure";
            /** Format: int32 */
            status: number;
            deploymentId: string | null;
            title: string;
            detail: string;
        };
        ConfigurationModel: {
            configurationModelId: string;
            attributes: components["schemas"]["Attributes"];
            sharedFromConfigurationModels?: string[] | null;
            constraints?: components["schemas"]["Constraint"][] | null;
        };
        ConfigurationModelFromChannel: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Channel";
            channel: string;
            deploymentName: string;
        };
        ConfigurationModelFromPackage: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Package";
            configurationModelPackage: components["schemas"]["ConfigurationModelPackage"];
        };
        ConfigurationModelInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConfigurationModelInvalid";
            /** Format: int32 */
            status: number;
            validationMessage: string | null;
            title: string;
            detail: string;
        };
        ConfigurationModelLoadFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConfigurationModelLoadFailure";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        ConfigurationModelMeta: {
            globalAttributeIds: components["schemas"]["GlobalAttributeId"][];
            configurationModelId: string;
        };
        ConfigurationModelNotFeasible: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConfigurationModelNotFeasible";
            /** Format: int32 */
            status: number;
            constraintExplanations: components["schemas"]["ConstraintExplanation"][] | null;
            title: string;
            detail: string;
        };
        ConfigurationModelNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConfigurationModelNotFound";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        ConfigurationModelPackage: {
            root: string;
            configurationModels: components["schemas"]["ConfigurationModel"][];
        };
        ConfigurationModelSource: {
            type: string;
        } & (components["schemas"]["ConfigurationModelFromChannel"] | components["schemas"]["ConfigurationModelFromPackage"]);
        ConflictResolution: {
            type: string;
        } & (components["schemas"]["ManualConflictResolution"] | components["schemas"]["AutomaticConflictResolution"]);
        ConflictWithConsequence: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ConflictWithConsequence";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            choiceValueId: string | null;
            title: string;
            detail: string;
        };
        Consequences: {
            isConfigurationSatisfied: boolean | null;
            canAttributeContributeToConfigurationSatisfaction: components["schemas"]["GlobalAttributeId"][];
            choiceConsequences: components["schemas"]["ChoiceConsequence"][];
            numericConsequences: components["schemas"]["NumericConsequence"][];
            booleanConsequences: components["schemas"]["BooleanConsequence"][];
            componentConsequences: components["schemas"]["ComponentConsequence"][];
        };
        Constraint: components["schemas"]["TextualConstraint"] | components["schemas"]["TextualConstraintCollection"];
        ConstraintDescription: {
            type: string;
        } & (components["schemas"]["RuleConstraint"] | components["schemas"]["CardinalityConstraint"]);
        ConstraintExplanation: {
            causedByCardinalities: components["schemas"]["CardinalityConstraint"][];
            causedByRules: components["schemas"]["RuleConstraint"][];
        };
        CreateSessionRequest: {
            configurationModelSource: components["schemas"]["ConfigurationModelSource"];
            attributeRelations?: components["schemas"]["DecisionsToRespect"][] | null;
            fixedDecisions?: components["schemas"]["FixedDecision"][] | null;
            wizardAttributeRelations?: components["schemas"]["WizardStep"][] | null;
            allowedInExplain?: components["schemas"]["AllowedInExplain"] | null;
            disableConfigurationModelTrimming?: boolean | null;
        };
        CreateSessionSuccessResponse: {
            sessionId: string;
            timeout: components["schemas"]["SessionTimeout"];
        };
        DecisionExplanation: {
            causedByChoiceDecisions: components["schemas"]["CausedByChoiceValueDecision"][];
            causedByNumericDecisions: components["schemas"]["CausedByNumericDecision"][];
            causedByBooleanDecisions: components["schemas"]["CausedByBooleanDecision"][];
            causedByComponentDecisions: components["schemas"]["CausedByComponentDecision"][];
        };
        /** @enum {string} */
        DecisionKind: "Implicit" | "Explicit";
        Decisions: {
            booleanDecisions: components["schemas"]["BooleanDecision"][];
            numericDecisions: components["schemas"]["NumericDecision"][];
            componentDecisions: components["schemas"]["ComponentDecision"][];
            choiceValueDecisions: components["schemas"]["ChoiceValueDecision"][];
        };
        /** @enum {string} */
        DecisionState: "Included" | "Excluded" | "Undefined";
        DecisionsToRespect: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            decisions: components["schemas"]["GlobalAttributeId"][];
        };
        DecisionsToRespectInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DecisionsToRespectInvalid";
            /** Format: int32 */
            status: number;
            validationMessage: string;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        DefaultMode: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Default";
        };
        DefinitiveConsequences: {
            isConfigurationSatisfied: boolean;
            canAttributeContributeToConfigurationSatisfaction: components["schemas"]["GlobalAttributeId"][];
            choiceConsequences: components["schemas"]["ChoiceConsequence"][];
            numericConsequences: components["schemas"]["NumericConsequence"][];
            booleanConsequences: components["schemas"]["BooleanConsequence"][];
            componentConsequences: components["schemas"]["ComponentConsequence"][];
        };
        DropExistingDecisionsMode: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DropExistingDecisions";
            conflictResolution: components["schemas"]["ConflictResolution"];
        };
        ExplainConflict: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ExplainConflict";
            /** Format: int32 */
            status: number;
            source: string;
            title: string;
            detail: string;
        };
        ExplainFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ExplainFailure";
            /** Format: int32 */
            status: number;
            source: string;
            title: string;
            detail: string;
        };
        ExplainResult: {
            constraintExplanations: components["schemas"]["ConstraintExplanation"][];
            decisionExplanations: components["schemas"]["DecisionExplanation"][];
        };
        ExplicitBooleanDecision: {
            state?: boolean | null;
            attributeId: components["schemas"]["GlobalAttributeId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Boolean";
        };
        ExplicitChoiceValueDecision: {
            choiceValueId: string;
            state: components["schemas"]["DecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Choice";
        };
        ExplicitComponentDecision: {
            state: components["schemas"]["DecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Component";
        };
        ExplicitDecision: {
            type: string;
            attributeId: components["schemas"]["GlobalAttributeId"];
        } & (components["schemas"]["ExplicitChoiceValueDecision"] | components["schemas"]["ExplicitNumericDecision"] | components["schemas"]["ExplicitBooleanDecision"] | components["schemas"]["ExplicitComponentDecision"]);
        ExplicitDecisions: {
            mode?: components["schemas"]["Mode"] | null;
            choiceDecisions?: components["schemas"]["ExplicitChoiceValueDecision"][] | null;
            numericDecisions?: components["schemas"]["ExplicitNumericDecision"][] | null;
            booleanDecisions?: components["schemas"]["ExplicitBooleanDecision"][] | null;
            componentDecisions?: components["schemas"]["ExplicitComponentDecision"][] | null;
        };
        ExplicitNumericDecision: {
            /** Format: decimal */
            state?: number | null;
            attributeId: components["schemas"]["GlobalAttributeId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Numeric";
        };
        FixedBooleanDecision: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Boolean";
            state: boolean;
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        FixedChoiceValueDecision: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Choice";
            choiceValueId: string;
            state: components["schemas"]["FixedDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        FixedComponentDecision: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Component";
            state: components["schemas"]["FixedDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        FixedDecision: {
            type: string;
            attributeId: components["schemas"]["GlobalAttributeId"];
        } & (components["schemas"]["FixedChoiceValueDecision"] | components["schemas"]["FixedNumericDecision"] | components["schemas"]["FixedBooleanDecision"] | components["schemas"]["FixedComponentDecision"]);
        FixedDecisionsInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "FixedDecisionsInvalid";
            /** Format: int32 */
            status: number;
            rejectedDecisions: components["schemas"]["FixedDecision"][];
            validationMessage: string;
            title: string;
            detail: string;
        };
        /** @enum {string} */
        FixedDecisionState: "Included" | "Excluded";
        FixedNumericDecision: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Numeric";
            /** Format: decimal */
            state: number;
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        GetActiveAttributesNoneResponse: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ActiveAttributesNone";
        };
        GetActiveAttributesResponse: {
            type: string;
        } & (components["schemas"]["GetActiveAttributesNoneResponse"] | components["schemas"]["GetActiveAttributesSomeResponse"]);
        GetActiveAttributesSomeResponse: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ActiveAttributesSome";
            activeAttributes: components["schemas"]["GlobalAttributeId"][];
        };
        GlobalAttributeId: {
            localId: string;
            sharedConfigurationModelId?: string | null;
            componentPath?: string[] | null;
        };
        GlobalChannelId: {
            deploymentId: components["schemas"]["GlobalDeploymentId"];
            channel: string;
        };
        GlobalChoiceValueId: {
            choiceValueId: string;
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        GlobalConstraintId: {
            localId: string;
            configurationModelId: string;
        };
        GlobalDeploymentId: {
            localId: string;
            tenantId: string;
        };
        GlobalSessionId: {
            sessionId: string;
            tenantId: string;
        };
        /** @enum {string} */
        HttpStatusCode: "Continue" | "SwitchingProtocols" | "Processing" | "EarlyHints" | "OK" | "Created" | "Accepted" | "NonAuthoritativeInformation" | "NoContent" | "ResetContent" | "PartialContent" | "MultiStatus" | "AlreadyReported" | "IMUsed" | "MultipleChoices" | "MultipleChoices" | "MovedPermanently" | "MovedPermanently" | "Found" | "Found" | "SeeOther" | "SeeOther" | "NotModified" | "UseProxy" | "Unused" | "TemporaryRedirect" | "TemporaryRedirect" | "PermanentRedirect" | "BadRequest" | "Unauthorized" | "PaymentRequired" | "Forbidden" | "NotFound" | "MethodNotAllowed" | "NotAcceptable" | "ProxyAuthenticationRequired" | "RequestTimeout" | "Conflict" | "Gone" | "LengthRequired" | "PreconditionFailed" | "RequestEntityTooLarge" | "RequestUriTooLong" | "UnsupportedMediaType" | "RequestedRangeNotSatisfiable" | "ExpectationFailed" | "MisdirectedRequest" | "UnprocessableEntity" | "UnprocessableEntity" | "Locked" | "FailedDependency" | "UpgradeRequired" | "PreconditionRequired" | "TooManyRequests" | "RequestHeaderFieldsTooLarge" | "UnavailableForLegalReasons" | "InternalServerError" | "NotImplemented" | "BadGateway" | "ServiceUnavailable" | "GatewayTimeout" | "HttpVersionNotSupported" | "VariantAlsoNegotiates" | "InsufficientStorage" | "LoopDetected" | "NotExtended" | "NetworkAuthenticationRequired";
        /** @enum {string} */
        Inclusion: "Always" | "Optional";
        InternalServerError: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "InternalServerError";
            /** Format: int32 */
            status: number;
            originalProblemType: string;
            title: string;
            detail: string;
        };
        KeepExistingDecisionsMode: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "KeepExistingDecisions";
        };
        ManualConflictResolution: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Manual";
            includeConstraintsInConflictExplanation: boolean;
        };
        MissingSessionIdClaim: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MissingSessionIdClaim";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        MissingTenantIdClaim: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MissingTenantIdClaim";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        Mode: {
            type: string;
        } & (components["schemas"]["DefaultMode"] | components["schemas"]["DropExistingDecisionsMode"] | components["schemas"]["KeepExistingDecisionsMode"]);
        NumericAttribute: {
            attributeId: string;
            isDecisionRequired: boolean;
            /** Format: decimal */
            min: number;
            /** Format: decimal */
            max: number;
            decimalPlaces: number;
        };
        NumericAttributeNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "NumericAttributeNotFound";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            title: string;
            detail: string;
        };
        NumericConsequence: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            isSatisfied: boolean;
            selection: components["schemas"]["Selection"];
            range: components["schemas"]["NumericValueRange"];
            decimalPlaces: number;
            isPossibleDecisionStatesImmutable: boolean;
        };
        NumericDecision: {
            attributeId: components["schemas"]["GlobalAttributeId"];
            /** Format: decimal */
            state: number | null;
            kind: components["schemas"]["DecisionKind"];
        };
        NumericDecisionOutOfRange: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "NumericDecisionOutOfRange";
            /** Format: int32 */
            status: number;
            globalAttributeId: components["schemas"]["GlobalAttributeId"];
            range: string;
            /** Format: decimal */
            decision: number;
            title: string;
            detail: string;
        };
        NumericValueRange: {
            /** Format: decimal */
            min: number;
            /** Format: decimal */
            max: number;
        };
        ObsoletionMeta: {
            status: components["schemas"]["ObsoletionStatus"];
            /** Format: date */
            endOfLife?: string | null;
        };
        /** @enum {string} */
        ObsoletionStatus: "Current" | "Obsolete";
        OptionallyIncluded: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "OptionallyIncluded";
            isDecisionRequired: boolean;
        };
        /** @enum {string} */
        PossibleDecisionState: "Included" | "Excluded";
        ProblemDetails: {
            type: string;
            title: string;
            detail: string;
            /** Format: int32 */
            status: number;
        } & (components["schemas"]["RequestTimeout"] | components["schemas"]["RequestFailure"] | components["schemas"]["SerializationError"] | components["schemas"]["InternalServerError"] | components["schemas"]["MissingTenantIdClaim"] | components["schemas"]["MissingSessionIdClaim"] | components["schemas"]["TenantAccessForbidden"] | components["schemas"]["SessionIdInvalid"] | components["schemas"]["AuthenticationFailure"] | components["schemas"]["SideLoadingForbidden"] | components["schemas"]["SpecifiedDeploymentForbidden"] | components["schemas"]["AttributeNotFound"] | components["schemas"]["AttributeNotActive"] | components["schemas"]["ChoiceAttributeNotFound"] | components["schemas"]["ChoiceValueNotFound"] | components["schemas"]["NumericAttributeNotFound"] | components["schemas"]["BooleanAttributeNotFound"] | components["schemas"]["ComponentAttributeNotFound"] | components["schemas"]["NumericDecisionOutOfRange"] | components["schemas"]["ConflictWithConsequence"] | components["schemas"]["ConfigurationModelInvalid"] | components["schemas"]["DecisionsToRespectInvalid"] | components["schemas"]["FixedDecisionsInvalid"] | components["schemas"]["SessionParametersInvalid"] | components["schemas"]["ConfigurationModelNotFeasible"] | components["schemas"]["SolutionNotFeasible"] | components["schemas"]["PutManyDecisionsConflict"] | components["schemas"]["SetDecisionConflict"] | components["schemas"]["SessionNotFound"] | components["schemas"]["ConfigurationModelNotFound"] | components["schemas"]["SolverInitializationFailure"] | components["schemas"]["ConfigurationModelLoadFailure"] | components["schemas"]["ConfigurationInitializationFailure"] | components["schemas"]["SolverPoolInitializationFailure"] | components["schemas"]["SolveOperationTimeout"] | components["schemas"]["ExplainConflict"] | components["schemas"]["ExplainFailure"] | components["schemas"]["SnapshotInvalid"] | components["schemas"]["SnapshotNotFound"] | components["schemas"]["AssignedChannelNotFound"] | (components["schemas"]["Unspecified"] & {
            type?: unknown;
        }));
        PutDecisionResponse: {
            consequences: components["schemas"]["Consequences"];
            affectedDecisions: components["schemas"]["Decisions"];
        };
        PutManyDecisionsConflict: {
            /** Format: int32 */
            status: number;
            constraintExplanations: components["schemas"]["ConstraintExplanation"][];
            decisionExplanations: components["schemas"]["DecisionExplanation"][];
            title: string;
            detail: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PutManyDecisionsConflict";
        };
        PutManyDecisionsResponse: {
            consequences: components["schemas"]["Consequences"];
            affectedDecisions: components["schemas"]["Decisions"];
            rejectedDecisions: components["schemas"]["Decisions"];
        };
        /** @enum {string} */
        Reason: "NotAvailable" | "StateNotPossible";
        RequestFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "RequestFailure";
            /** Format: int32 */
            status: number;
            exception: string;
            title: string;
            detail: string;
        };
        RequestTimeout: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "RequestTimeout";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        RuleConstraint: {
            constraintId: components["schemas"]["GlobalConstraintId"];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Rule";
        };
        /** @enum {string} */
        Selection: "Mandatory" | "Optional";
        SerializationError: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SerializationError";
            /** Format: int32 */
            status: number;
            jsonException: string;
            title: string;
            detail: string;
        };
        SessionIdInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SessionIdInvalid";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SessionNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SessionNotFound";
            /** Format: int32 */
            status: number;
            sessionId: components["schemas"]["GlobalSessionId"];
            title: string;
            detail: string;
        };
        SessionParametersInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SessionParametersInvalid";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        /** @description Describes the automatic expiration of a session. */
        SessionTimeout: {
            /**
             * Format: date-time
             * @description Indicates the absolute expiration of the session - when the session will expire at latest.
             */
            absolute: string;
            /**
             * Format: int32
             * @description Indicates what the sliding expiration of the session is in seconds. Meaning the session will expire if left untouched for the indicated amount of time.
             */
            slidingInSeconds: number;
        };
        SetDecisionConflict: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SetDecisionConflict";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SideLoadingForbidden: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SideLoadingForbidden";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SnapshotInvalid: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SnapshotInvalid";
            /** Format: int32 */
            status: number;
            validationMessage: string;
            validationPath: string[];
            title: string;
            detail: string;
        };
        SnapshotNotFound: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SnapshotNotFound";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SolutionNotFeasible: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SolutionNotFeasible";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SolveOperationTimeout: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SolveOperationTimeout";
            /** Format: int32 */
            status: number;
            timeout: string;
            title: string;
            detail: string;
        };
        SolverInitializationFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SolverInitializationFailure";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SolverPoolInitializationFailure: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SolverPoolInitializationFailure";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        SpecifiedDeploymentForbidden: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SpecifiedDeploymentForbidden";
            /** Format: int32 */
            status: number;
            channel: string;
            deploymentName: string;
            title: string;
            detail: string;
        };
        TenantAccessForbidden: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "TenantAccessForbidden";
            /** Format: int32 */
            status: number;
            title: string;
            detail: string;
        };
        TextualConstraint: {
            constraintId: string;
            textualConstraint: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "TextualConstraint";
        };
        TextualConstraintCollection: {
            constraintId: string;
            operator: components["schemas"]["TextualConstraintCollectionOperator"];
            textualConstraints: string[];
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "TextualConstraintCollection";
        };
        /** @enum {string} */
        TextualConstraintCollectionOperator: "And" | "Or";
        Unspecified: {
            type?: string | null;
            title: string;
            /** Format: int32 */
            status?: number | null;
            detail: string;
            instance?: string | null;
        } & {
            [key: string]: unknown;
        };
        WhyAttributeNotSatisfiedRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Attribute";
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        WhyBooleanStateNotPossibleRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Boolean";
            state: boolean;
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        WhyChoiceValueStateNotPossibleRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChoiceValue";
            choiceValueId: string;
            state: components["schemas"]["PossibleDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        WhyComponentStateNotPossibleRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Component";
            state: components["schemas"]["PossibleDecisionState"];
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        WhyConfigurationNotSatisfiedRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Configuration";
        };
        WhyNotSatisfiedRequest: {
            type: string;
        } & (components["schemas"]["WhyAttributeNotSatisfiedRequest"] | components["schemas"]["WhyConfigurationNotSatisfiedRequest"]);
        WhyNumericStateNotPossibleRequest: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "Numeric";
            /** Format: decimal */
            state: number;
            attributeId: components["schemas"]["GlobalAttributeId"];
        };
        WhyStateNotPossibleRequest: {
            type: string;
            attributeId: components["schemas"]["GlobalAttributeId"];
        } & (components["schemas"]["WhyBooleanStateNotPossibleRequest"] | components["schemas"]["WhyNumericStateNotPossibleRequest"] | components["schemas"]["WhyChoiceValueStateNotPossibleRequest"] | components["schemas"]["WhyComponentStateNotPossibleRequest"]);
        WizardStep: {
            attributes: components["schemas"]["GlobalAttributeId"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type ActiveAttributesRequest = components['schemas']['ActiveAttributesRequest'];
export type ActiveAttributesResponse = components['schemas']['ActiveAttributesResponse'];
export type AllowedInExplain = components['schemas']['AllowedInExplain'];
export type AllowedRules = components['schemas']['AllowedRules'];
export type AllowedRulesAll = components['schemas']['AllowedRulesAll'];
export type AllowedRulesNone = components['schemas']['AllowedRulesNone'];
export type AllowedRulesSpecific = components['schemas']['AllowedRulesSpecific'];
export type AlwaysIncluded = components['schemas']['AlwaysIncluded'];
export type AssignedChannelNotFound = components['schemas']['AssignedChannelNotFound'];
export type AttributeNotActive = components['schemas']['AttributeNotActive'];
export type AttributeNotFound = components['schemas']['AttributeNotFound'];
export type Attributes = components['schemas']['Attributes'];
export type AuthenticationFailure = components['schemas']['AuthenticationFailure'];
export type AutomaticConflictResolution = components['schemas']['AutomaticConflictResolution'];
export type BooleanAttribute = components['schemas']['BooleanAttribute'];
export type BooleanAttributeNotFound = components['schemas']['BooleanAttributeNotFound'];
export type BooleanConsequence = components['schemas']['BooleanConsequence'];
export type BooleanDecision = components['schemas']['BooleanDecision'];
export type Cardinality = components['schemas']['Cardinality'];
export type CardinalityConstraint = components['schemas']['CardinalityConstraint'];
export type CausedByBooleanDecision = components['schemas']['CausedByBooleanDecision'];
export type CausedByChoiceValueDecision = components['schemas']['CausedByChoiceValueDecision'];
export type CausedByComponentDecision = components['schemas']['CausedByComponentDecision'];
export type CausedByDecision = components['schemas']['CausedByDecision'];
export type CausedByNumericDecision = components['schemas']['CausedByNumericDecision'];
export type ChoiceAttribute = components['schemas']['ChoiceAttribute'];
export type ChoiceAttributeNotFound = components['schemas']['ChoiceAttributeNotFound'];
export type ChoiceConsequence = components['schemas']['ChoiceConsequence'];
export type ChoiceValue = components['schemas']['ChoiceValue'];
export type ChoiceValueConsequence = components['schemas']['ChoiceValueConsequence'];
export type ChoiceValueDecision = components['schemas']['ChoiceValueDecision'];
export type ChoiceValueNotFound = components['schemas']['ChoiceValueNotFound'];
export type CloseSessionRequest = components['schemas']['CloseSessionRequest'];
export type CompleteMeta = components['schemas']['CompleteMeta'];
export type ComponentAttribute = components['schemas']['ComponentAttribute'];
export type ComponentAttributeNotFound = components['schemas']['ComponentAttributeNotFound'];
export type ComponentConsequence = components['schemas']['ComponentConsequence'];
export type ComponentDecision = components['schemas']['ComponentDecision'];
export type ComponentInclusionType = components['schemas']['ComponentInclusionType'];
export type ConfigurationInitializationFailure = components['schemas']['ConfigurationInitializationFailure'];
export type ConfigurationModel = components['schemas']['ConfigurationModel'];
export type ConfigurationModelFromChannel = components['schemas']['ConfigurationModelFromChannel'];
export type ConfigurationModelFromPackage = components['schemas']['ConfigurationModelFromPackage'];
export type ConfigurationModelInvalid = components['schemas']['ConfigurationModelInvalid'];
export type ConfigurationModelLoadFailure = components['schemas']['ConfigurationModelLoadFailure'];
export type ConfigurationModelMeta = components['schemas']['ConfigurationModelMeta'];
export type ConfigurationModelNotFeasible = components['schemas']['ConfigurationModelNotFeasible'];
export type ConfigurationModelNotFound = components['schemas']['ConfigurationModelNotFound'];
export type ConfigurationModelPackage = components['schemas']['ConfigurationModelPackage'];
export type ConfigurationModelSource = components['schemas']['ConfigurationModelSource'];
export type ConflictResolution = components['schemas']['ConflictResolution'];
export type ConflictWithConsequence = components['schemas']['ConflictWithConsequence'];
export type Consequences = components['schemas']['Consequences'];
export type Constraint = components['schemas']['Constraint'];
export type ConstraintDescription = components['schemas']['ConstraintDescription'];
export type ConstraintExplanation = components['schemas']['ConstraintExplanation'];
export type CreateSessionRequest = components['schemas']['CreateSessionRequest'];
export type CreateSessionSuccessResponse = components['schemas']['CreateSessionSuccessResponse'];
export type DecisionExplanation = components['schemas']['DecisionExplanation'];
export type DecisionKind = components['schemas']['DecisionKind'];
export type Decisions = components['schemas']['Decisions'];
export type DecisionState = components['schemas']['DecisionState'];
export type DecisionsToRespect = components['schemas']['DecisionsToRespect'];
export type DecisionsToRespectInvalid = components['schemas']['DecisionsToRespectInvalid'];
export type DefaultMode = components['schemas']['DefaultMode'];
export type DefinitiveConsequences = components['schemas']['DefinitiveConsequences'];
export type DropExistingDecisionsMode = components['schemas']['DropExistingDecisionsMode'];
export type ExplainConflict = components['schemas']['ExplainConflict'];
export type ExplainFailure = components['schemas']['ExplainFailure'];
export type ExplainResult = components['schemas']['ExplainResult'];
export type ExplicitBooleanDecision = components['schemas']['ExplicitBooleanDecision'];
export type ExplicitChoiceValueDecision = components['schemas']['ExplicitChoiceValueDecision'];
export type ExplicitComponentDecision = components['schemas']['ExplicitComponentDecision'];
export type ExplicitDecision = components['schemas']['ExplicitDecision'];
export type ExplicitDecisions = components['schemas']['ExplicitDecisions'];
export type ExplicitNumericDecision = components['schemas']['ExplicitNumericDecision'];
export type FixedBooleanDecision = components['schemas']['FixedBooleanDecision'];
export type FixedChoiceValueDecision = components['schemas']['FixedChoiceValueDecision'];
export type FixedComponentDecision = components['schemas']['FixedComponentDecision'];
export type FixedDecision = components['schemas']['FixedDecision'];
export type FixedDecisionsInvalid = components['schemas']['FixedDecisionsInvalid'];
export type FixedDecisionState = components['schemas']['FixedDecisionState'];
export type FixedNumericDecision = components['schemas']['FixedNumericDecision'];
export type GetActiveAttributesNoneResponse = components['schemas']['GetActiveAttributesNoneResponse'];
export type GetActiveAttributesResponse = components['schemas']['GetActiveAttributesResponse'];
export type GetActiveAttributesSomeResponse = components['schemas']['GetActiveAttributesSomeResponse'];
export type GlobalAttributeId = components['schemas']['GlobalAttributeId'];
export type GlobalChannelId = components['schemas']['GlobalChannelId'];
export type GlobalChoiceValueId = components['schemas']['GlobalChoiceValueId'];
export type GlobalConstraintId = components['schemas']['GlobalConstraintId'];
export type GlobalDeploymentId = components['schemas']['GlobalDeploymentId'];
export type GlobalSessionId = components['schemas']['GlobalSessionId'];
export type HttpStatusCode = components['schemas']['HttpStatusCode'];
export type Inclusion = components['schemas']['Inclusion'];
export type InternalServerError = components['schemas']['InternalServerError'];
export type KeepExistingDecisionsMode = components['schemas']['KeepExistingDecisionsMode'];
export type ManualConflictResolution = components['schemas']['ManualConflictResolution'];
export type MissingSessionIdClaim = components['schemas']['MissingSessionIdClaim'];
export type MissingTenantIdClaim = components['schemas']['MissingTenantIdClaim'];
export type Mode = components['schemas']['Mode'];
export type NumericAttribute = components['schemas']['NumericAttribute'];
export type NumericAttributeNotFound = components['schemas']['NumericAttributeNotFound'];
export type NumericConsequence = components['schemas']['NumericConsequence'];
export type NumericDecision = components['schemas']['NumericDecision'];
export type NumericDecisionOutOfRange = components['schemas']['NumericDecisionOutOfRange'];
export type NumericValueRange = components['schemas']['NumericValueRange'];
export type ObsoletionMeta = components['schemas']['ObsoletionMeta'];
export type ObsoletionStatus = components['schemas']['ObsoletionStatus'];
export type OptionallyIncluded = components['schemas']['OptionallyIncluded'];
export type PossibleDecisionState = components['schemas']['PossibleDecisionState'];
export type ProblemDetails = components['schemas']['ProblemDetails'];
export type PutDecisionResponse = components['schemas']['PutDecisionResponse'];
export type PutManyDecisionsConflict = components['schemas']['PutManyDecisionsConflict'];
export type PutManyDecisionsResponse = components['schemas']['PutManyDecisionsResponse'];
export type Reason = components['schemas']['Reason'];
export type RequestFailure = components['schemas']['RequestFailure'];
export type RequestTimeout = components['schemas']['RequestTimeout'];
export type RuleConstraint = components['schemas']['RuleConstraint'];
export type Selection = components['schemas']['Selection'];
export type SerializationError = components['schemas']['SerializationError'];
export type SessionIdInvalid = components['schemas']['SessionIdInvalid'];
export type SessionNotFound = components['schemas']['SessionNotFound'];
export type SessionParametersInvalid = components['schemas']['SessionParametersInvalid'];
export type SessionTimeout = components['schemas']['SessionTimeout'];
export type SetDecisionConflict = components['schemas']['SetDecisionConflict'];
export type SideLoadingForbidden = components['schemas']['SideLoadingForbidden'];
export type SnapshotInvalid = components['schemas']['SnapshotInvalid'];
export type SnapshotNotFound = components['schemas']['SnapshotNotFound'];
export type SolutionNotFeasible = components['schemas']['SolutionNotFeasible'];
export type SolveOperationTimeout = components['schemas']['SolveOperationTimeout'];
export type SolverInitializationFailure = components['schemas']['SolverInitializationFailure'];
export type SolverPoolInitializationFailure = components['schemas']['SolverPoolInitializationFailure'];
export type SpecifiedDeploymentForbidden = components['schemas']['SpecifiedDeploymentForbidden'];
export type TenantAccessForbidden = components['schemas']['TenantAccessForbidden'];
export type TextualConstraint = components['schemas']['TextualConstraint'];
export type TextualConstraintCollection = components['schemas']['TextualConstraintCollection'];
export type TextualConstraintCollectionOperator = components['schemas']['TextualConstraintCollectionOperator'];
export type Unspecified = components['schemas']['Unspecified'];
export type WhyAttributeNotSatisfiedRequest = components['schemas']['WhyAttributeNotSatisfiedRequest'];
export type WhyBooleanStateNotPossibleRequest = components['schemas']['WhyBooleanStateNotPossibleRequest'];
export type WhyChoiceValueStateNotPossibleRequest = components['schemas']['WhyChoiceValueStateNotPossibleRequest'];
export type WhyComponentStateNotPossibleRequest = components['schemas']['WhyComponentStateNotPossibleRequest'];
export type WhyConfigurationNotSatisfiedRequest = components['schemas']['WhyConfigurationNotSatisfiedRequest'];
export type WhyNotSatisfiedRequest = components['schemas']['WhyNotSatisfiedRequest'];
export type WhyNumericStateNotPossibleRequest = components['schemas']['WhyNumericStateNotPossibleRequest'];
export type WhyStateNotPossibleRequest = components['schemas']['WhyStateNotPossibleRequest'];
export type WizardStep = components['schemas']['WizardStep'];
export type $defs = Record<string, never>;
export interface operations {
    ActiveAttributes_Get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request was processed successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetActiveAttributesResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    ActiveAttributes_Post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The collection of Attributes to set as active. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActiveAttributesRequest"];
            };
        };
        responses: {
            /** @description The request was processed successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActiveAttributesResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    ActiveAttributes_Delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request was processed successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActiveAttributesResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    ActiveAttributes_Evaluate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The collection of Attributes to set as active. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActiveAttributesRequest"];
            };
        };
        responses: {
            /** @description The request was processed successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActiveAttributesResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Consequence_Get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The Consequences were successfully evaluated and returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DefinitiveConsequences"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Decision_GetAllDecisions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The current Decisions for the Configuration Session were successfully returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Decisions"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Decision_PutDecision: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The Explicit Decision to apply. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExplicitDecision"];
            };
        };
        responses: {
            /** @description The request was processed successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PutDecisionResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            /** @description No Decision was applied because the submitted Decision was rejected and automatic conflict handling was disabled. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Decision_PutMany: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The collection of Explicit Decisions to apply. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExplicitDecisions"];
            };
        };
        responses: {
            /** @description The request was processed successfully. Depending on the applied mode, some submitted Decisions may still appear in the Rejected Decisions collection. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PutManyDecisionsResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            /** @description No Decisions were applied because one or more submitted Decisions were rejected and automatic conflict handling was disabled. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PutManyDecisionsConflict"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyNotSatisfied: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description An instance of WhyNotSatisfiedRequest that contains the fully qualified identifier of the Attribute
         *     for which the Explanations are requested.
         */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyNotSatisfiedRequest"];
            };
        };
        responses: {
            /**
             * @description Returns an IActionResult containing an ExplainResult object representing the Explanation
             *     if successful, or an appropriate HTTP error status.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExplainResult"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyNotSatisfiedDecisions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description An instance of WhyNotSatisfiedRequest that contains the fully qualified identifier of the Attribute
         *     for which the Decision Explanations are requested.
         */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyNotSatisfiedRequest"];
            };
        };
        responses: {
            /**
             * @description An IActionResult containing a response with an array of
             *     DecisionExplanation objects if successful, or an appropriate HTTP error status.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DecisionExplanation"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyNotSatisfiedRules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description An instance of WhyNotSatisfiedRequest that contains the fully qualified identifier of the Attribute
         *     for which the Constraint Explanations are requested.
         */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyNotSatisfiedRequest"];
            };
        };
        responses: {
            /**
             * @description An IActionResult representing the HTTP response containing an array of ConstraintExplanation objects
             *     if successful, or an appropriate HTTP error status.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConstraintExplanation"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyStateNotPossible: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The details for the Attribute for which the Explanation is needed. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyStateNotPossibleRequest"];
            };
        };
        responses: {
            /**
             * @description An IActionResult containing the Explanations of why the Value State is not possible.
             *     Returns an HTTP 200 OK response on success.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExplainResult"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyStateNotPossibleDecisions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The details for the Attribute for which the Explanations are needed. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyStateNotPossibleRequest"];
            };
        };
        responses: {
            /**
             * @description An IActionResult containing an array of DecisionExplanation objects
             *     that describe the Decisions leading to the Value State being impossible.
             *     Returns an HTTP 200 OK response on success.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DecisionExplanation"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Explain_WhyStateNotPossibleRules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The details for the Attribute for which the Explanations are needed. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhyStateNotPossibleRequest"];
            };
        };
        responses: {
            /**
             * @description An IActionResult containing an array of ConstraintExplanation objects
             *     that describe the Constraints leading to the Value State being impossible.
             *     Returns an HTTP 200 OK response on success.
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConstraintExplanation"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Meta_GetConfigurationModel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Configuration model metadata was successfully returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfigurationModelMeta"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Meta_Get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Complete metadata was successfully returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompleteMeta"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Obsoletion_GetObsoletion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ObsoletionMeta"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Session_Post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The payload containing all data required to create a Configuration Session. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSessionRequest"];
            };
        };
        responses: {
            /** @description The session was created successfully and the response contains the created session information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateSessionSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            /** @description The request could not be fulfilled due to licensing or quota restrictions. */
            402: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            /** @description The caller is authenticated but not allowed to create a session. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            /** @description The request is semantically invalid for session creation (for example invalid session parameters, invalid Configuration Model, non-feasible Configuration Model, or invalid Decisions to respect). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DecisionsToRespectInvalid"] | components["schemas"]["FixedDecisionsInvalid"] | components["schemas"]["SessionParametersInvalid"] | components["schemas"]["ConfigurationModelInvalid"] | components["schemas"]["ConfigurationModelNotFeasible"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Session_Delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The encoded session id of the Configuration Session to terminate. */
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The session was terminated successfully. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
    Session_Close: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The request payload containing the encoded session id to close. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloseSessionRequest"];
            };
        };
        responses: {
            /** @description The session was terminated successfully. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unspecified"];
                };
            };
        };
    };
}
