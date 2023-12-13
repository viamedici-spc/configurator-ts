import config from "../config";
import {EngineApiClient} from "../../src/apiClient/engine/EngineApiClient";

export const createEngineApiClient = (baseUrl: string = config.endpoints.engine): EngineApiClient => {
    return new EngineApiClient(baseUrl);
};

export const getEngineToken = () => config.credentials.engine.accessToken;