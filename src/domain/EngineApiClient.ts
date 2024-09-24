import * as Engine from "../apiClient/engine/Engine";

const defaultEngineBaseUrl = "https://spc.cloud.ceventis.de/hca/api/engine";

const apiClients = new Map<string, Engine.Api<unknown>>();
const serverSideSessionCreationApiClients = new Map<string, Engine.Api<unknown>>();

export function getApiClient(apiBaseUrl: string | undefined): Engine.Api<unknown> {
    const baseUrl = apiBaseUrl ?? defaultEngineBaseUrl;

    let apiClient = apiClients.get(baseUrl);
    if (!apiClient) {
        apiClient = new Engine.Api({baseUrl: baseUrl});
        apiClients.set(baseUrl, apiClient);
    }

    return apiClient;
}

export function getServerSideSessionCreationApiClient(sessionCreateUrl: string) {
    // Redirect any request of the api client to the sessionCreateUrl.
    const customFetch = (...fetchParams: Parameters<typeof fetch>) => {
        if (typeof fetchParams[0] === "string") {
            return fetch(sessionCreateUrl, fetchParams[1]);
        }

        return fetch(...fetchParams);
    };

    let apiClient = serverSideSessionCreationApiClients.get(sessionCreateUrl);
    if (!apiClient) {
        apiClient = new Engine.Api({customFetch: customFetch});
        serverSideSessionCreationApiClients.set(sessionCreateUrl, apiClient);
    }

    return apiClient.session.sessionPost;
}