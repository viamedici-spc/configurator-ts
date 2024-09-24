/// <reference types="../../jest-extended" />

import {afterAll, afterEach, describe, expect, it, vi} from "vitest";
import * as Logic from "../../../src/domain/logic/EngineLogic";
import {SessionContextWithModelWithOneMandatoryChoice} from "../../data/SessionContexts";
import {ConnectionError, ServerError} from "../../../src";
import * as Engine from "../../../src/apiClient/engine/Engine";
import {PossibleDecisionState} from "../../../src/apiClient/engine/Engine";
import {stringify} from "../../setup/JSON";
import GlobalAttributeIdKeyBuilder from "../../../src/crossCutting/GlobalAttributeIdKeyBuilder";
import {SourceAttributeId} from "../../../src";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";

const globalFetch = global.fetch;

describe("EngineLogic", () => {
    const fetchMock = vi.fn<typeof global.fetch>();
    global.fetch = fetchMock;

    afterEach(async () => {
        vi.resetAllMocks();
    });
    afterAll(() => {
        global.fetch = globalFetch;
    });

    it("createSession - ConnectionError when there is a local problem", async () => {
        fetchMock.mockImplementation(() => Promise.reject());
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult) as ConnectionError;
        expect(problemDetail.type).toBe("ConnectionError");
    });

    it("createSession - ServerError if response is malformed", async () => {
        fetchMock.mockImplementation(() => Promise.resolve({
            ok: false,
            status: 500,
            json: (): Promise<any> => Promise.resolve({
                // The response is malformed if the mandatory properties (type, title, detail) are not present.
                type: "Abc"
            })
        } as Response));
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult) as ServerError;
        expect(problemDetail.type).toBe("ServerError");
    });

    it("createSession - Any valid shaped ProblemDetail is becomes a ServerError", async () => {
        fetchMock.mockImplementation(() => Promise.resolve({
            ok: false,
            status: 500,
            json: (): Promise<any> => Promise.resolve({
                type: "AnyProblemType",
                title: "AnyProblemType Title",
                detail: "AnyProblemType Detail"
            })
        } as Response));
        const createSessionResult = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        const problemDetail = expectToBeLeft(createSessionResult);
        expect(problemDetail.type).toBe("ServerError");
    });

    it("createSession - Success", async () => {
        fetchMock.mockImplementation((input) => {
            console.log("Fetch", stringify(input));
            if (typeof input === "string") {
                if (input.endsWith("session")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: (): Promise<any> => Promise.resolve({
                            sessionId: "SessionId"
                        } satisfies Engine.CreateSessionSuccessResponse)
                    } as Response);
                }
                if (input.endsWith("consequence")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: (): Promise<any> => Promise.resolve({
                            isConfigurationSatisfied: false,
                            canAttributeContributeToConfigurationSatisfaction: [],
                            choiceConsequences: [{
                                attributeId: {localId: "a1"},
                                isSatisfied: false,
                                cardinality: {
                                    upperBound: 1,
                                    lowerBound: 1
                                },
                                values: [
                                    {
                                        choiceValueId: "v1",
                                        possibleDecisionStates: [
                                            PossibleDecisionState.Included,
                                            PossibleDecisionState.Excluded
                                        ]
                                    },
                                    {
                                        choiceValueId: "v2",
                                        possibleDecisionStates: [
                                            PossibleDecisionState.Included,
                                            PossibleDecisionState.Excluded
                                        ]
                                    }
                                ]
                            }],
                            componentConsequences: [],
                            numericConsequences: [],
                            booleanConsequences: []
                        } satisfies Engine.Consequences)
                    } as Response);
                }
                if (input.endsWith("decision")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: (): Promise<any> => Promise.resolve({
                            choiceValueDecisions: [],
                            numericDecisions: [],
                            booleanDecisions: [],
                            componentDecisions: []
                        } satisfies Engine.Decisions)
                    } as Response);
                }
                if (input.endsWith("meta")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: (): Promise<any> => Promise.resolve({
                            configurationModels: [{
                                configurationModelId: "model1",
                                globalAttributeIds: [
                                    {localId: "a1"}
                                ]
                            }]
                        } satisfies Engine.CompleteMeta)
                    } as Response);
                }
            }

            return Promise.reject();
        });
        const createSessionResult = await Logic.createSession({
            ...SessionContextWithModelWithOneMandatoryChoice,
            sessionInitialisationOptions: {
                accessToken: "Token1"
            },
            provideSourceId: true
        })();

        const result = expectToBeRight(createSessionResult);

        expect(fetchMock.mock.calls).toHaveLength(4);
        // First call must be SessionPost
        expect(fetchMock.mock.calls[0][0]).toEndWith("session");
        expect(fetchMock.mock.calls[0][1]!.headers!["Authorization"]).toBe("Bearer Token1");

        // Every further call must have a SessionId header
        fetchMock.mock.calls.slice(1)
            .forEach(call => expect(call[1]!.headers!["X-SESSION-ID"]).toBe("SessionId"));

        const attribute = result.configuration.attributes.get(GlobalAttributeIdKeyBuilder({localId: "a1"}))!;
        expect(attribute.sourceId).toEqual({
            configurationModel: "model1",
            localId: "a1"
        } satisfies  SourceAttributeId);
        expect(attribute.isSatisfied).toBeFalse();
    });
});