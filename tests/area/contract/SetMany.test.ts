import {createDefaultClient} from "../../setup/clientFactory";
import {externalFrameBackpack} from "../../setup/ConfigurationModelPackageDefinitions";
import {expectBoolean, expectChoice, expectPossibleChoiceDecisionStates} from "../../setup/Expectations";
import {describe, it} from "vitest";
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
    });
});