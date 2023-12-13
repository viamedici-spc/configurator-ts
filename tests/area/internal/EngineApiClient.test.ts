import {createEngineApiClient, getEngineToken} from "../../setup/Engine";
import {ConfigurationModelPackageBuilder} from "../../setup/ConfigurationModelPackageBuilder";
import {expectToBeRight} from "../../setup/EitherExtensions";
import {E, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {describe, it} from "vitest";
import {ConfigurationModelFromPackage, ProblemDetails} from "../../../src/apiClient/engine/models/generated/Engine";

describe("ApiClient", () => {
    it("CreateSession", async () => {

        const engineApiClient = createEngineApiClient();
        const configurationModelPackage = new ConfigurationModelPackageBuilder()
            .rootConfigurationModel(b => b.mandatoryChoiceAttribute("Color", ["Red", "Green", "Blue"]))
            .build();

        const response = await engineApiClient.createSessionUsingJwtBearer({
            configurationModelSource: {
                type: "Package",
                configurationModelPackage: configurationModelPackage
            } as ConfigurationModelFromPackage
        }, getEngineToken())();

        expectToBeRight(response);

        E.doIfLeftOrRight(lr => () => {
            console.log(lr);
        })(response);
    });
});