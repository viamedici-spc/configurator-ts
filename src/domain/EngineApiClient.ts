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

/** Requests send no `Referer`, so the application's page URL does not reach the engine. */
const referrerPolicy: ReferrerPolicy = "no-referrer";

/**
 * The fetch call itself rejected: the request did not reach the engine or no response arrived (network, CORS,
 * aborted). A response that arrived but cannot be read is not this error.
 */
export class FetchRejected extends Error {
    constructor(cause: unknown) {
        super("The fetch call rejected.", {cause});
        this.name = "FetchRejected";
    }
}

// The global fetch is looked up on every request, not once when the client is created, so that a fetch replaced later
// (by a test or an application) takes effect for the cached clients too.
function currentFetch(input: Request | string, init?: RequestInit): Promise<Response> {
    return globalThis.fetch(input, init).catch((cause: unknown) => {
        throw new FetchRejected(cause);
    });
}

export function getApiClient(apiBaseUrl: string | undefined): EngineApi {
    const baseUrl = apiBaseUrl ?? defaultEngineBaseUrl;

    let apiClient = apiClients.get(baseUrl);
    if (!apiClient) {
        apiClient = createEngineApi(
            createClient<Paths>({baseUrl, fetch: request => currentFetch(request), referrerPolicy}),
        );
        apiClients.set(baseUrl, apiClient);
    }

    return apiClient;
}

export function getServerSideSessionCreationApiClient(sessionCreateUrl: string): EngineApi["session"]["sessionPost"] {
    let apiClient = serverSideSessionCreationApiClients.get(sessionCreateUrl);
    if (!apiClient) {
        // Every request of this client goes to the sessionCreateUrl, keeping method, headers and body.
        // ⚠️ The body is forwarded as bytes. A `Request` passed as the `init` of a new request hands over its body as a
        // stream: Chrome then rejects the request over HTTP/1.1, and Firefox sends it with an empty body.
        const redirectingFetch = async (request: Request): Promise<Response> =>
            currentFetch(sessionCreateUrl, {
                method: request.method,
                headers: request.headers,
                body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
                signal: request.signal,
                credentials: request.credentials,
                referrerPolicy,
            });
        apiClient = createEngineApi(createClient<Paths>({baseUrl: defaultEngineBaseUrl, fetch: redirectingFetch}));
        serverSideSessionCreationApiClients.set(sessionCreateUrl, apiClient);
    }

    return apiClient.session.sessionPost;
}