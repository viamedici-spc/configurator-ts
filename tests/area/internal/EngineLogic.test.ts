import {afterAll, afterEach, describe, expect, it, mock} from "bun:test";
import {describeFetchCall, type FetchFunction, jsonResponse, setFetch} from "../../setup/Fetch";
import * as Logic from "../../../src/domain/logic/EngineLogic";
import {SessionContextWithModelWithOneMandatoryChoice} from "../../data/SessionContexts";
import type {ConnectionError, ServerError, SourceAttributeId} from "../../../src";
import type * as Engine from "../../../src/apiClient/engine/Engine";
import GlobalAttributeIdKeyBuilder from "../../../src/crossCutting/GlobalAttributeIdKeyBuilder";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";

const globalFetch = global.fetch;

describe("EngineLogic", () => {
    const fetchMock = mock<FetchFunction>();
    setFetch(fetchMock);

    afterEach(async () => {
        mock.clearAllMocks();
    });
    afterAll(() => {
        setFetch(globalFetch);
    });

    it("createSession - ConnectionError when there is a local problem", async () => {
        fetchMock.mockImplementation(() => Promise.reject());
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult) as ConnectionError;
        expect<unknown>(problemDetail.type).toBe("ConnectionError");
    });

    it("createSession - ServerError when a success response is not JSON", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve(
                new Response("<html>Proxy page</html>", {status: 200, headers: {"Content-Type": "text/html"}}),
            ),
        );
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        expect<unknown>(expectToBeLeft(createSessionResult).type).toBe("ServerError");
    });

    it("createSession - ServerError when an error response is not JSON", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve(
                new Response("<html>Bad Gateway</html>", {status: 502, headers: {"Content-Type": "text/html"}}),
            ),
        );
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        expect<unknown>(expectToBeLeft(createSessionResult).type).toBe("ServerError");
    });

    it("createSession - ServerError if response is malformed", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve(
                jsonResponse(
                    {
                        // The response is malformed if the mandatory properties (type, title, detail) are not present.
                        type: "Abc",
                    },
                    500,
                ),
            ),
        );
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult) as ServerError;
        expect<unknown>(problemDetail.type).toBe("ServerError");
    });

    it("createSession - Any valid shaped ProblemDetail is becomes a ServerError", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve(
                jsonResponse(
                    {
                        type: "AnyProblemType",
                        title: "AnyProblemType Title",
                        detail: "AnyProblemType Detail",
                    },
                    500,
                ),
            ),
        );
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult);
        expect<unknown>(problemDetail.type).toBe("ServerError");
    });

    it("createSession - Success", async () => {
        fetchMock.mockImplementation((input, init) => {
            const {url} = describeFetchCall(input, init);
            console.log("Fetch", url);
            if (url.endsWith("session")) {
                return Promise.resolve(
                    jsonResponse({
                        sessionId: "SessionId",
                        timeout: {absolute: "2100-01-01T00:00:00Z", slidingInSeconds: 600},
                    } satisfies Engine.CreateSessionSuccessResponse),
                );
            }
            if (url.endsWith("consequence")) {
                return Promise.resolve(
                    jsonResponse({
                        isConfigurationSatisfied: false,
                        canAttributeContributeToConfigurationSatisfaction: [],
                        choiceConsequences: [
                            {
                                attributeId: {localId: "a1"},
                                isSatisfied: false,
                                cardinality: {
                                    upperBound: 1,
                                    lowerBound: 1,
                                },
                                values: [
                                    {
                                        choiceValueId: "v1",
                                        possibleDecisionStates: ["Included", "Excluded"],
                                        isPossibleDecisionStatesImmutable: false,
                                    },
                                    {
                                        choiceValueId: "v2",
                                        possibleDecisionStates: ["Included", "Excluded"],
                                        isPossibleDecisionStatesImmutable: false,
                                    },
                                ],
                            },
                        ],
                        componentConsequences: [],
                        numericConsequences: [],
                        booleanConsequences: [],
                    } satisfies Engine.Consequences),
                );
            }
            if (url.endsWith("decision")) {
                return Promise.resolve(
                    jsonResponse({
                        choiceValueDecisions: [],
                        numericDecisions: [],
                        booleanDecisions: [],
                        componentDecisions: [],
                    } satisfies Engine.Decisions),
                );
            }
            if (url.endsWith("meta")) {
                return Promise.resolve(
                    jsonResponse({
                        configurationModels: [
                            {
                                configurationModelId: "model1",
                                globalAttributeIds: [{localId: "a1"}],
                            },
                        ],
                    } satisfies Engine.CompleteMeta),
                );
            }

            return Promise.reject();
        });
        const createSessionResult = await Logic.createSession({
            ...SessionContextWithModelWithOneMandatoryChoice,
            sessionInitialisationOptions: {
                accessToken: "Token1",
            },
            provideSourceId: true,
        })();

        const result = expectToBeRight(createSessionResult);

        expect(fetchMock.mock.calls).toHaveLength(4);
        // First call must be SessionPost
        expect(describeFetchCall(...fetchMock.mock.calls[0]).url).toEndWith("session");
        expect(describeFetchCall(...fetchMock.mock.calls[0]).headers.get("Authorization")).toBe("Bearer Token1");

        // Every further call must have a SessionId header
        fetchMock.mock.calls
            .slice(1)
            .forEach(call => expect(describeFetchCall(...call).headers.get("X-SESSION-ID")).toBe("SessionId"));

        const attribute = result.configuration.attributes.get(GlobalAttributeIdKeyBuilder({localId: "a1"}))!;
        expect(attribute.sourceId).toEqual({
            configurationModel: "model1",
            localId: "a1",
        } satisfies SourceAttributeId);
        expect(attribute.isSatisfied).toBeFalse();
    });

    it("createSession - forwards additionalRequestHeaders on the CreateSession request only and never overrides Authorization", async () => {
        fetchMock.mockImplementation((input, init) => {
            const {url} = describeFetchCall(input, init);
            if (url.endsWith("session")) {
                return Promise.resolve(
                    jsonResponse({
                        sessionId: "SessionId",
                        timeout: {absolute: "2100-01-01T00:00:00Z", slidingInSeconds: 600},
                    } satisfies Engine.CreateSessionSuccessResponse),
                );
            }
            if (url.endsWith("consequence")) {
                return Promise.resolve(
                    jsonResponse({
                        isConfigurationSatisfied: false,
                        canAttributeContributeToConfigurationSatisfaction: [],
                        choiceConsequences: [],
                        componentConsequences: [],
                        numericConsequences: [],
                        booleanConsequences: [],
                    } satisfies Engine.Consequences),
                );
            }
            if (url.endsWith("decision")) {
                return Promise.resolve(
                    jsonResponse({
                        choiceValueDecisions: [],
                        numericDecisions: [],
                        booleanDecisions: [],
                        componentDecisions: [],
                    } satisfies Engine.Decisions),
                );
            }

            return Promise.reject();
        });

        const createSessionResult = await Logic.createSession({
            ...SessionContextWithModelWithOneMandatoryChoice,
            sessionInitialisationOptions: {
                accessToken: "Token1",
                additionalRequestHeaders: {
                    "X-TENANT-ID": "tenant1",
                    // The library's own Authorization must win over a consumer-supplied one.
                    Authorization: "Bearer Spoofed",
                },
            },
            provideSourceId: false,
        })();

        expectToBeRight(createSessionResult);

        // First call is the CreateSession POST: it carries the additional header...
        expect(describeFetchCall(...fetchMock.mock.calls[0]).url).toEndWith("session");
        expect(describeFetchCall(...fetchMock.mock.calls[0]).headers.get("X-TENANT-ID")).toBe("tenant1");
        // ...but Authorization is always the library's, never the consumer's.
        expect(describeFetchCall(...fetchMock.mock.calls[0]).headers.get("Authorization")).toBe("Bearer Token1");

        // Subsequent session-scoped calls must NOT carry the additional header (CreateSession only).
        fetchMock.mock.calls
            .slice(1)
            .forEach(call => expect(describeFetchCall(...call).headers.get("X-TENANT-ID")).toBeNull());
    });
});