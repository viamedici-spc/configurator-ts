// noinspection SpellCheckingInspection
import {DomainUpdater} from "../../../src/domain/services/Updater";
import {createEngineApiClient} from "../../setup/Engine";
import {ConfigurationModelPackageBuilder} from "../../setup/ConfigurationModelPackageBuilder";
import {expectToBeRight} from "../../setup/EitherExtensions";
import {TestSessionLifetimeHandler} from "../../setup/TestSessionLifetimeHandler";
import {O, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {describe, expect, it} from "vitest";
import RestToDomainMapper from "../../../src/mappers/RestToDomainMapper";
import DomainToRestMapper from "../../../src/mappers/DomainToRestMapper";
import {ConfigurationSessionHandler} from "../../../src/domain/handler/ConfigurationSessionHandler";
import DomainToContractMapper from "../../../src/mappers/DomainToContractMapper";
import * as Domain from "../../../src/domain/Model";


const testSessionHandler = new TestSessionLifetimeHandler();
const engineApiClient = createEngineApiClient();

const restToDomainMapper = new RestToDomainMapper();
const domainToRestMapper = new DomainToRestMapper();
const domainUpdater = new DomainUpdater(restToDomainMapper);
const domainToContractMapper = new DomainToContractMapper();

describe("ConfigurationSessionInitializer", () => {
    describe("Success Cases", () => {
        it("Initial Flow", async () => {

            const configurationModelPackage = new ConfigurationModelPackageBuilder()
                .rootConfigurationModel(b => b
                    .mandatoryChoiceAttribute("Color", ["Grey", "Olive", "RAL7013", "TAN"])
                    .mandatoryChoiceAttribute("Fabric", ["Cordura0500D", "Cordura0700D", "Nylon0050D", "Nylon0300D", "Nylon0500D"])
                    .choiceAttribute("Rating", 0, 2, ["TL", "WR200"])
                )
                .build();

            const sessionContext: Domain.ConfigurationSessionContext = {
                configurationModelSource: {
                    type: Domain.ConfigurationModelSourceType.Package,
                    configurationModelPackage: configurationModelPackage
                },
                decisionsToRespect: O.none,
                usageRuleParameters: {},
                allowedInExplain: O.none
            };

            const sessionHandler = new ConfigurationSessionHandler(testSessionHandler, engineApiClient, restToDomainMapper, domainToRestMapper, domainToContractMapper, domainUpdater);

            const result = await pipe(
                sessionHandler.recreate({
                    context: sessionContext,
                    sessionId: O.none,
                    configuration: {
                        isSatisfied: false,
                        attributes: []
                    },
                    solutions: []
                }),
                TE.chain(r => {
                    return sessionHandler.makeDecision({
                        type: Domain.DecisionType.ChoiceValue,
                        attributeId: {localId: "Rating"},
                        choiceValueId: "TL",
                        state: O.some(Domain.DecisionState.Included)
                    }, r);
                }),
                TE.doIfRight(r => () => {
                    const tlAttribute = r.configuration.attributes.find(a => Domain.eqGlobalAttributeId.equals(a.attributeId, {localId: "Rating"})) as Domain.ChoiceAttribute;

                    const tlRatingValue = tlAttribute.values.find(v => v.choiceValueId === "TL");

                    expect(tlRatingValue?.possibleDecisionStates).toEqual([Domain.DecisionState.Included].sort());
                })
            )();

            expectToBeRight(result);
        });
    });
});