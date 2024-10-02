import {StoredConfiguration, StoredConfiguration_} from "../../contract/storedConfiguration/StoredConfiguration";
import {E, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {match} from "ts-pattern";
import {
    AttributeType,
    ChoiceValueDecisionState,
    ComponentDecisionState,
    ExplicitBooleanDecision,
    ExplicitChoiceDecision,
    ExplicitComponentDecision,
    ExplicitDecision,
    ExplicitNumericDecision,
    GlobalAttributeId
} from "../../contract/Types";
import * as V1 from "../../contract/storedConfiguration/StoredConfigurationV1";
import {Either} from "fp-ts/Either";
import {
    ConfiguratorError, ConfiguratorErrorType,
    StoredConfigurationInvalid,
} from "../../contract/ConfiguratorError";
import ConfigurationRawData from "../model/ConfigurationRawData";
import {getCollectedDecisions} from "./ConfigurationRawData";
import {collectedExplicitDecisionRefinement} from "../../contract/refinements/CollectedDecisionRefinements";

export function storeConfiguration(rawData: ConfigurationRawData): StoredConfiguration {
    const explicitDecisions = pipe(
        rawData,
        getCollectedDecisions,
        RA.filter(collectedExplicitDecisionRefinement),
        RA.map(d => {
            const id: V1.GlobalAttributeId = {
                localId: d.attributeId.localId,
                componentPath: d.attributeId.componentPath != null && RA.isNonEmpty(d.attributeId.componentPath) ? d.attributeId.componentPath : undefined,
                sharedConfigurationModelId: d.attributeId.sharedConfigurationModelId ?? undefined,
            };

            return match(d)
                .returnType<V1.Decision>()
                .with({attributeType: AttributeType.Numeric}, n => ({
                    type: "Numeric",
                    attributeId: id,
                    state: n.state
                } satisfies V1.NumericDecision))
                .with({attributeType: AttributeType.Boolean}, b => ({
                    type: "Boolean",
                    attributeId: id,
                    state: b.state
                } satisfies V1.BooleanDecision))
                .with({attributeType: AttributeType.Component}, c => ({
                    type: "Component",
                    attributeId: id,
                    state: match(c.state)
                        .returnType<V1.ComponentDecision["state"]>()
                        .with(ComponentDecisionState.Included, () => "Included")
                        .with(ComponentDecisionState.Excluded, () => "Excluded")
                        .exhaustive()
                } satisfies V1.ComponentDecision))
                .with({attributeType: AttributeType.Choice}, c => ({
                    type: "Choice",
                    attributeId: id,
                    choiceValueId: c.choiceValueId,
                    state: match(c.state)
                        .returnType<V1.ChoiceDecision["state"]>()
                        .with(ChoiceValueDecisionState.Included, () => "Included")
                        .with(ChoiceValueDecisionState.Excluded, () => "Excluded")
                        .exhaustive()
                } satisfies V1.ChoiceDecision))
                .exhaustive();
        })
    );

    return {
        schemaVersion: 1,
        explicitDecisions: explicitDecisions
    };
}

export function loadConfiguration(storedConfiguration: StoredConfiguration): Either<ConfiguratorError, ReadonlyArray<ExplicitDecision>> {
    if (E.isLeft(StoredConfiguration_.create(storedConfiguration))) {
        return E.left({type: ConfiguratorErrorType.StoredConfigurationInvalid} satisfies StoredConfigurationInvalid);
    }

    return pipe(
        storedConfiguration.explicitDecisions,
        RA.map(d => {
            const id: GlobalAttributeId = {
                localId: d.attributeId.localId,
                componentPath: d.attributeId.componentPath != null && RA.isNonEmpty(d.attributeId.componentPath) ? d.attributeId.componentPath : undefined,
                sharedConfigurationModelId: d.attributeId.sharedConfigurationModelId ?? undefined,
            };

            return match(d)
                .returnType<ExplicitDecision>()
                .with({type: "Numeric"}, n => ({
                    type: AttributeType.Numeric,
                    attributeId: id,
                    state: n.state
                } satisfies ExplicitNumericDecision))
                .with({type: "Boolean"}, n => ({
                    type: AttributeType.Boolean,
                    attributeId: id,
                    state: n.state
                } satisfies ExplicitBooleanDecision))
                .with({type: "Component"}, n => ({
                    type: AttributeType.Component,
                    attributeId: id,
                    state: match(n.state)
                        .with("Included", () => ComponentDecisionState.Included)
                        .with("Excluded", () => ComponentDecisionState.Excluded)
                        .exhaustive()
                } satisfies ExplicitComponentDecision))
                .with({type: "Choice"}, n => ({
                    type: AttributeType.Choice,
                    attributeId: id,
                    choiceValueId: n.choiceValueId,
                    state: match(n.state)
                        .with("Included", () => ChoiceValueDecisionState.Included)
                        .with("Excluded", () => ChoiceValueDecisionState.Excluded)
                        .exhaustive()
                } satisfies ExplicitChoiceDecision))
                .exhaustive();
        }),
        E.right
    );
}