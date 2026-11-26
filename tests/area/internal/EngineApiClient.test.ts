import {afterAll, afterEach, describe, expect, it, mock} from "bun:test";
import {describeFetchCall, type FetchFunction, jsonResponse, setFetch} from "../../setup/Fetch";
import * as Logic from "../../../src/domain/logic/EngineLogic";
import * as DtoE from "../../../src/domain/mapper/DomainToEngineMapping";
import type {SessionContext} from "../../../src";
import type * as Engine from "../../../src/apiClient/engine/Engine";
import {ModelWithOneMandatoryChoice} from "../../data/ConfigurationModelSources";

const globalFetch = globalThis.fetch;
const GlobalRequest = globalThis.Request;

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

describe("EngineApiClient", () => {
    const fetchMock = mock<FetchFunction>();

    afterEach(() => {
        mock.clearAllMocks();
        setFetch(globalFetch);
        globalThis.Request = GlobalRequest;
    });
    afterAll(() => {
        setFetch(globalFetch);
        globalThis.Request = GlobalRequest;
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
        it("are sent without a referrer", async () => {
            // The client is created per base URL, so a base URL of its own makes it use the recording Request.
            const apiBaseUrl = "https://referrer-policy.invalid/engine";
            const referrerPolicies: Array<RequestInit["referrerPolicy"]> = [];
            globalThis.Request = class RecordingRequest extends GlobalRequest {
                constructor(input: RequestInfo | URL, init?: RequestInit) {
                    super(input, init);
                    referrerPolicies.push(init?.referrerPolicy);
                }
            };
            fetchMock.mockImplementation(answerSessionRequest);
            setFetch(fetchMock);

            await Logic.createSession({
                apiBaseUrl,
                sessionInitialisationOptions: {accessToken: "Token1"},
                configurationModelSource: ModelWithOneMandatoryChoice,
            })();

            expect(referrerPolicies.length).toBeGreaterThan(0);
            expect(referrerPolicies).toSatisfyAll((policy: unknown) => policy === "no-referrer");
        });
    });
});