import createClient, {type Client} from "openapi-fetch";
import type * as Engine from "../apiClient/engine/Engine";

const defaultEngineBaseUrl = "https://spc.viamedici.io/hca/api/engine";

type Paths = Engine.paths;

/** Options of a single request: the headers the engine needs (session id, authorization). */
export type RequestParams = {headers?: HeadersInit};

/** What a request resolves with: the body of a success or of an error, and the response itself. */
export type EngineResponse<T> = {data?: T; error?: unknown; response?: Response};

type JsonBody<P extends keyof Paths, M extends keyof Paths[P]> = Paths[P][M] extends {
    requestBody?: {content: {"application/json": infer B}};
}
    ? B
    : never;

function createEngineApi(client: Client<Paths>) {
    return {
        session: {
            sessionPost: (body: JsonBody<"/v2/session", "post">, params?: RequestParams) =>
                client.POST("/v2/session", {body, ...params}),
            sessionDelete: (sessionId: string, params?: RequestParams) =>
                client.DELETE("/v2/session/{sessionId}", {params: {path: {sessionId}}, ...params}),
        },
        decision: {
            decisionGetAllDecisions: (params?: RequestParams) =>
                client.GET("/v2/session/configuration/decision", {...params}),
            decisionPutDecision: (
                body: JsonBody<"/v2/session/configuration/decision", "put">,
                params?: RequestParams,
            ) => client.PUT("/v2/session/configuration/decision", {body, ...params}),
            decisionPutMany: (
                body: JsonBody<"/v2/session/configuration/decision/many", "put">,
                params?: RequestParams,
            ) => client.PUT("/v2/session/configuration/decision/many", {body, ...params}),
        },
        consequence: {
            consequenceGet: (params?: RequestParams) =>
                client.GET("/v2/session/configuration/consequence", {...params}),
        },
        meta: {
            metaGet: (params?: RequestParams) => client.GET("/v2/session/configuration/meta", {...params}),
        },
        explain: {
            explainWhyNotSatisfied: (
                body: JsonBody<"/v2/session/configuration/consequence/explain/why-not-satisfied", "post">,
                params?: RequestParams,
            ) => client.POST("/v2/session/configuration/consequence/explain/why-not-satisfied", {body, ...params}),
            explainWhyNotSatisfiedDecisions: (
                body: JsonBody<
                    "/v2/session/configuration/consequence/explain/why-not-satisfied/answer/decisions",
                    "post"
                >,
                params?: RequestParams,
            ) =>
                client.POST("/v2/session/configuration/consequence/explain/why-not-satisfied/answer/decisions", {
                    body,
                    ...params,
                }),
            explainWhyNotSatisfiedRules: (
                body: JsonBody<
                    "/v2/session/configuration/consequence/explain/why-not-satisfied/answer/constraints",
                    "post"
                >,
                params?: RequestParams,
            ) =>
                client.POST("/v2/session/configuration/consequence/explain/why-not-satisfied/answer/constraints", {
                    body,
                    ...params,
                }),
            explainWhyStateNotPossible: (
                body: JsonBody<"/v2/session/configuration/consequence/explain/why-state-not-possible", "post">,
                params?: RequestParams,
            ) => client.POST("/v2/session/configuration/consequence/explain/why-state-not-possible", {body, ...params}),
            explainWhyStateNotPossibleDecisions: (
                body: JsonBody<
                    "/v2/session/configuration/consequence/explain/why-state-not-possible/answer/decisions",
                    "post"
                >,
                params?: RequestParams,
            ) =>
                client.POST("/v2/session/configuration/consequence/explain/why-state-not-possible/answer/decisions", {
                    body,
                    ...params,
                }),
            explainWhyStateNotPossibleRules: (
                body: JsonBody<
                    "/v2/session/configuration/consequence/explain/why-state-not-possible/answer/constraints",
                    "post"
                >,
                params?: RequestParams,
            ) =>
                client.POST("/v2/session/configuration/consequence/explain/why-state-not-possible/answer/constraints", {
                    body,
                    ...params,
                }),
        },
    };
}

/** The engine's REST API, one function per operation the library uses. */
export type EngineApi = ReturnType<typeof createEngineApi>;

const apiClients = new Map<string, EngineApi>();
const serverSideSessionCreationApiClients = new Map<string, EngineApi>();

// The global fetch is looked up on every request, not once when the client is created, so that a fetch replaced later
// (by a test or an application) takes effect for the cached clients too.
const currentFetch = (request: Request): Promise<Response> => globalThis.fetch(request);

export function getApiClient(apiBaseUrl: string | undefined): EngineApi {
    const baseUrl = apiBaseUrl ?? defaultEngineBaseUrl;

    let apiClient = apiClients.get(baseUrl);
    if (!apiClient) {
        apiClient = createEngineApi(createClient<Paths>({baseUrl, fetch: currentFetch}));
        apiClients.set(baseUrl, apiClient);
    }

    return apiClient;
}

export function getServerSideSessionCreationApiClient(sessionCreateUrl: string): EngineApi["session"]["sessionPost"] {
    let apiClient = serverSideSessionCreationApiClients.get(sessionCreateUrl);
    if (!apiClient) {
        // Every request of this client goes to the sessionCreateUrl, keeping method, headers and body.
        const redirectingFetch = (request: Request): Promise<Response> =>
            globalThis.fetch(new Request(sessionCreateUrl, request));
        apiClient = createEngineApi(createClient<Paths>({baseUrl: defaultEngineBaseUrl, fetch: redirectingFetch}));
        serverSideSessionCreationApiClients.set(sessionCreateUrl, apiClient);
    }

    return apiClient.session.sessionPost;
}