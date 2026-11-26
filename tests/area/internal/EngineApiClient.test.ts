import {afterAll, afterEach, describe, expect, it, mock} from "bun:test";
import {describeFetchCall, type FetchFunction, jsonResponse, setFetch} from "../../setup/Fetch";
import * as Logic from "../../../src/domain/logic/EngineLogic";
import * as DtoE from "../../../src/domain/mapper/DomainToEngineMapping";
import {AttributeType, ChoiceValueDecisionState, type SessionContext} from "../../../src";
import type * as Engine from "../../../src/apiClient/engine/Engine";
import {ModelWithOneMandatoryChoice} from "../../data/ConfigurationModelSources";
import {expectToBeRight} from "../../setup/EitherExtensions";

const globalFetch = globalThis.fetch;

/** Answers the session request only; the requests that follow it are not part of these tests and fail. */
const answerSessionRequest: FetchFunction = (input, init) =>
    describeFetchCall(input, init).method === "POST"
        ? Promise.resolve(
              jsonResponse({
                  sessionId: "Session1",
                  timeout: {absolute: "2100-01-01T00:00:00Z", slidingInSeconds: 600},
              } satisfies Engine.CreateSessionSuccessResponse),
          )
        : Promise.reject(new Error("Not part of the test."));

const consequences = {
    isConfigurationSatisfied: false,
    canAttributeContributeToConfigurationSatisfaction: [],
    choiceConsequences: [
        {
            attributeId: {localId: "a1"},
            isSatisfied: false,
            cardinality: {upperBound: 1, lowerBound: 1},
            values: [
                {
                    choiceValueId: "v1",
                    possibleDecisionStates: ["Included", "Excluded"],
                    isPossibleDecisionStatesImmutable: false,
                },
            ],
        },
    ],
    componentConsequences: [],
    numericConsequences: [],
    booleanConsequences: [],
} satisfies Engine.Consequences;
const noDecisions = {
    choiceValueDecisions: [],
    numericDecisions: [],
    booleanDecisions: [],
    componentDecisions: [],
} satisfies Engine.Decisions;

/**
 * Answers the requests of creating a session and making a decision, as the engine does, but rejects a `Request` with a
 * body as Framer's fetch hook does ("Cannot construct a Request with a Request object that has already been used").
 */
const framerLikeFetch: FetchFunction = (input, init) => {
    if (input instanceof Request && input.method !== "GET" && input.method !== "HEAD") {
        return Promise.reject(
            new TypeError("Cannot construct a Request with a Request object that has already been used."),
        );
    }
    const {url, method} = describeFetchCall(input, init);
    if (url.endsWith("/session") && method === "POST") {
        return Promise.resolve(
            jsonResponse({
                sessionId: "Session1",
                timeout: {absolute: "2100-01-01T00:00:00Z", slidingInSeconds: 600},
            } satisfies Engine.CreateSessionSuccessResponse),
        );
    }
    if (url.endsWith("/decision") && method === "PUT") {
        return Promise.resolve(
            jsonResponse({consequences, affectedDecisions: noDecisions} satisfies Engine.PutDecisionResponse),
        );
    }
    if (url.endsWith("/consequence")) {
        return Promise.resolve(jsonResponse(consequences));
    }
    if (url.endsWith("/decision")) {
        return Promise.resolve(jsonResponse(noDecisions));
    }
    if (url.endsWith("/meta")) {
        return Promise.resolve(
            jsonResponse({
                configurationModels: [{configurationModelId: "model1", globalAttributeIds: [{localId: "a1"}]}],
            } satisfies Engine.CompleteMeta),
        );
    }

    return Promise.reject(new Error("Not part of the test."));
};

describe("EngineApiClient", () => {
    const fetchMock = mock<FetchFunction>();

    afterEach(() => {
        mock.clearAllMocks();
        setFetch(globalFetch);
    });
    afterAll(() => {
        setFetch(globalFetch);
    });

    describe("sessionCreateUrl", () => {
        const sessionCreateUrl = "https://session-create.invalid/create";
        const sessionContext: SessionContext = {
            sessionInitialisationOptions: {sessionCreateUrl},
            configurationModelSource: ModelWithOneMandatoryChoice,
        };

        it("forwards the session request with its body as bytes and without a referrer", async () => {
            fetchMock.mockImplementation(answerSessionRequest);
            setFetch(fetchMock);

            await Logic.createSession(sessionContext)();

            const call = fetchMock.mock.calls.find(
                ([input, init]) => describeFetchCall(input, init).url === new URL(sessionCreateUrl).href,
            );
            expect(call).toBeDefined();
            const [input, init] = call!;
            expect(typeof input).toBe("string");
            expect(init?.method).toBe("POST");
            expect(init?.referrerPolicy).toBe("no-referrer");
            // A stream body (`new Request(url, request)`) fails in Chrome over HTTP/1.1 and arrives empty in Firefox.
            expect(init?.body).toBeInstanceOf(ArrayBuffer);
            const sentBody: unknown = JSON.parse(new TextDecoder().decode(init?.body as ArrayBuffer));
            expect(sentBody).toEqual(JSON.parse(JSON.stringify(DtoE.mapSessionContext(sessionContext))));
        });
    });

    describe("engine requests", () => {
        it("reach a fetch that rejects a Request with a body, as Framer's fetch hook does", async () => {
            fetchMock.mockImplementation(framerLikeFetch);
            setFetch(fetchMock);

            const session = expectToBeRight(
                await Logic.createSession({
                    sessionInitialisationOptions: {accessToken: "Token1"},
                    configurationModelSource: ModelWithOneMandatoryChoice,
                })(),
            );
            expectToBeRight(
                await Logic.makeDecision({
                    type: AttributeType.Choice,
                    attributeId: {localId: "a1"},
                    choiceValueId: "v1",
                    state: ChoiceValueDecisionState.Included,
                })(session)(),
            );

            const put = fetchMock.mock.calls.find(([input, init]) => describeFetchCall(input, init).method === "PUT");
            expect(put).toBeDefined();
            expect(put![1]?.body).toBeInstanceOf(ArrayBuffer);
            expect(put![1]?.referrerPolicy).toBe("no-referrer");
        });

        it("are sent without a referrer", async () => {
            fetchMock.mockImplementation(answerSessionRequest);
            setFetch(fetchMock);

            await Logic.createSession({
                sessionInitialisationOptions: {accessToken: "Token1"},
                configurationModelSource: ModelWithOneMandatoryChoice,
            })();

            expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
            expect(fetchMock.mock.calls.map(([, init]) => init?.referrerPolicy)).toSatisfyAll(
                (policy: unknown) => policy === "no-referrer",
            );
        });
    });
});