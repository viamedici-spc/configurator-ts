import {createDefaultClient} from "../../setup/clientFactory";
import {canContributeToDemo, externalFrameBackpack} from "../../setup/ConfigurationModelPackageDefinitions";
import {
    expectBoolean, expectCanContributeToConfigurationSatisfaction,
    expectChoice,
    expectIsSatisfied,
    expectPossibleChoiceDecisionStates
} from "../../setup/Expectations";
import {describe, expect, it} from "vitest";
import {AttributeType, ChoiceValueDecisionState, ConfigurationModelSourceType, DecisionKind,} from "../../../src";

describe("ConfiguratorClient-SetMany", () => {

    const sut = createDefaultClient();

    describe("Success Cases", () => {

        it("Mode Default", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", null, "No decision was made yet");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);

            await session.setMany([{
                type: AttributeType.Boolean,
                attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                state: true
            }], {
                type: "Default"
            });

            expectBoolean(session.getConfiguration(), {localId: "TL", sharedConfigurationModelId: "requirement"}, {
                kind: DecisionKind.Explicit,
                state: true
            });
        });

        it("Mode KeepExisting", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: externalFrameBackpack
                },
            });

            expectChoice(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", null, "No decision was made yet");
            expectPossibleChoiceDecisionStates(session.getConfiguration(), {localId: "Fabric"}, "Cordura0500D", [ChoiceValueDecisionState.Included, ChoiceValueDecisionState.Excluded]);

            await session.setMany([{
                type: AttributeType.Boolean,
                attributeId: {localId: "TL", sharedConfigurationModelId: "requirement"},
                state: true
            }], {
                type: "KeepExistingDecisions"
            });

            expectBoolean(session.getConfiguration(), {localId: "TL", sharedConfigurationModelId: "requirement"}, {
                kind: DecisionKind.Explicit,
                state: true
            });
        });

        it("Updates according to response", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: canContributeToDemo
                },
            });


            const attributeX = {localId: "X"};
            const attributeY = {localId: "Y"};

            let configuration = session.getConfiguration();
            expect(configuration.isSatisfied).toBe(false);
            expectIsSatisfied(configuration, attributeX, true);
            expectIsSatisfied(configuration, attributeY, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeX, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeY, true);

            // DO
            await session.setMany([{
                type: AttributeType.Choice,
                attributeId: {localId: "X"},
                choiceValueId: "X1",
                state: ChoiceValueDecisionState.Included
            }], {
                type: "KeepExistingDecisions"
            });

            configuration = session.getConfiguration();
            expect(configuration.isSatisfied).toBe(true);
            expectIsSatisfied(configuration, attributeX, true);
            expectIsSatisfied(configuration, attributeY, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeX, false);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeY, false);
        });
    });
});