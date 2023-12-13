import {createDefaultClient} from "../../setup/clientFactory";
import {canContributeToDemo, invalidConstraint, notSolvable} from "../../setup/ConfigurationModelPackageDefinitions";
import {describe, expect, it} from "vitest";
import {
    AllowedRulesInExplainType,
    ConfigurationModelNotFeasible,
    ConfigurationModelSourceType,
    FailureType
} from "../../../src";
import {
    expectCanContributeToConfigurationSatisfaction,
    expectContractFailureResult,
    expectIsSatisfied
} from "../../setup/Expectations";

describe("Create-Session", () => {

    const sut = createDefaultClient();

    describe("Success Cases - CanContributeTo", async () => {
        it("Initial After Session Create", async () => {
            const session = await sut.createSession({
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Package,
                    configurationModelPackage: canContributeToDemo
                },
            });

            const configuration = session.getConfiguration();

            const attributeX = {localId: "X"};
            const attributeY = {localId: "Y"};

            expect(configuration.isSatisfied).toBe(false);
            expectIsSatisfied(configuration, attributeX, true);
            expectIsSatisfied(configuration, attributeY, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeX, true);
            expectCanContributeToConfigurationSatisfaction(configuration, attributeY, true);
        });
    });

    describe("Failure Cases", () => {

        it("Configuration Model invalid", async () => {
            await expectContractFailureResult(
                sut.createSession({
                    configurationModelSource: {
                        type: ConfigurationModelSourceType.Package,
                        configurationModelPackage: {
                            root: "fancyCar?",
                            configurationModels: []
                        }
                    }
                }), FailureType.ConfigurationModelInvalid);
        });

        it("Configuration Model with invalid constraint", async () => {
            await expectContractFailureResult(
                sut.createSession({
                    configurationModelSource: {
                        type: ConfigurationModelSourceType.Package,
                        configurationModelPackage: invalidConstraint
                    }
                }), FailureType.ConfigurationModelInvalid);
        });

        it("Configuration Model is not solvable with 1 explanation", async () => {
            const failure = await expectContractFailureResult(
                sut.createSession({
                    configurationModelSource: {
                        type: ConfigurationModelSourceType.Package,
                        configurationModelPackage: notSolvable
                    },
                    allowedInExplain: {
                        rules: {
                            type: AllowedRulesInExplainType.all
                        }
                    }
                }), FailureType.ConfigurationModelNotFeasible) as ConfigurationModelNotFeasible;

            expect(failure.constraintExplanations.length).toBe(1);
        });

        it("Configuration Model is not solvable with no explanation allowed", async () => {
            const failure = await expectContractFailureResult(
                sut.createSession({
                    configurationModelSource: {
                        type: ConfigurationModelSourceType.Package,
                        configurationModelPackage: notSolvable
                    },
                    allowedInExplain: {
                        rules: {
                            type: AllowedRulesInExplainType.none
                        }
                    }
                }), FailureType.ConfigurationModelNotFeasible) as ConfigurationModelNotFeasible;

            // Should still be one, because session creation is a special case
            expect(failure.constraintExplanations.length).toBe(1);
        });
    });
});