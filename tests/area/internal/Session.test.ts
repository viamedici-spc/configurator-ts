import {createEngineApiClient, getEngineToken} from "../../setup/Engine";
import {ConfigurationModelPackageBuilder} from "../../setup/ConfigurationModelPackageBuilder";
import {pipe} from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";
import * as Engine from "../../../src/apiClient/engine/models/generated/Engine";
import {ProblemDetails} from "../../../src/apiClient/engine/models/generated/Engine";
import {describe, expect, it} from "vitest";
import {ConfigurationModelSourceType} from "../../../src";
import {E} from "@viamedici-spc/fp-ts-extensions";

const engineApiClient = createEngineApiClient();
const configurationModelPackage = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b.mandatoryChoiceAttribute("Color", ["Red", "Green", "Blue"]))
    .build();

describe("Session", () => {


    it("Create session with JwtBearer success", async () => {
        const response = await engineApiClient.createSessionUsingJwtBearer({
            configurationModelSource: {
                type: ConfigurationModelSourceType.Package,
                configurationModelPackage: configurationModelPackage
            } as Engine.ConfigurationModelFromPackage
        }, getEngineToken())();

        expectToBeRight(response);
    });

    it("Create session with invalid JwtBearer should result in problem", async () => {
        const response = await engineApiClient.createSessionUsingJwtBearer({
            configurationModelSource: {
                type: ConfigurationModelSourceType.Package,
                configurationModelPackage: configurationModelPackage
            } as Engine.ConfigurationModelFromPackage
        }, "Invalid API key")();
        const errorResponse: Engine.ProblemDetails = expectToBeLeft(response);
        expect(errorResponse.status).toBe(401);
    });
});