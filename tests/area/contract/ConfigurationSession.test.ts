// noinspection DuplicatedCode
/// <reference types="../../jest-extended" />

import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import SessionFactory from "../../../src/SessionFactory";
import {
    AllowedRulesInExplainType,
    AttributeType,
    CausedByBooleanDecision,
    ChoiceValueDecisionState,
    CollectedBooleanDecision,
    ConfigurationModelSourceType,
    ConfiguratorError,
    ConfiguratorErrorType,
    Decision,
    DecisionKind,
    ExplicitBooleanDecision,
    ExplicitNumericDecision,
    FullExplainAnswer,
    ServerSideSessionInitialisationOptions,
    SessionClosed,
    SessionContext,
    SetManyDecisionsConflict,
    SetManyDropExistingDecisionsMode,
    SetManyKeepExistingDecisionsMode,
    SetManyMode,
    StoredConfiguration,
    StoredConfigurationInvalid
} from "../../../src";
import config from "../../config";
import getConfigurationSessionExpectations from "../../setup/ConfigurationSessionExpectations";
import {createSession} from "../../../src/domain/logic/EngineLogic";
import {expectToBeLeft, expectToBeRight} from "../../setup/EitherExtensions";
import * as Engine from "../../../src/apiClient/engine/Engine";
import {SessionNotFound} from "../../../src/apiClient/engine/Engine";
import ConfigurationSession from "../../../src/ConfigurationSession";
import pDefer from "p-defer";
import GlobalAttributeIdKeyBuilder from "../../../src/crossCutting/GlobalAttributeIdKeyBuilder";
import {hashAttribute} from "../../../src/crossCutting/AttributeHashing";
import {E, TE} from "@viamedici-spc/fp-ts-extensions";
import {
    configurationEq,
    configurationRawDataEq,
    fullExplainAnswerEq,
    globalAttributeIdEq,
    hashedConfigurationEq,
    setManyDecisionsConflictEq
} from "../../../src/contract/Eqs";
import * as ConfigurationRawDataL from "../../../src/domain/logic/ConfigurationRawData";

const getSessionContext = (deploymentName: string): SessionContext => ({
    apiBaseUrl: config.endpoints.engine,
    sessionInitialisationOptions: {
        accessToken: config.credentials.engine.accessToken,
    },
    provideSourceId: true,
    optimisticDecisionOptions: {
        setMany: true,
        makeDecision: true,
        applySolution: true,
        restoreConfiguration: true
    },
    allowedInExplain: {
        rules: {
            type: AllowedRulesInExplainType.all
        }
    },
    configurationModelSource: {
        type: ConfigurationModelSourceType.Channel,
        channel: "release",
        deploymentName: deploymentName
    }
});

describe("ConfigurationSession", () => {
    const globalFetch = global.fetch;

    beforeAll(() => {
        // Log all failed requests.
        global.fetch = (...args: Parameters<typeof globalFetch>): ReturnType<typeof globalFetch> => {
            return globalFetch(...args)
                .catch((reason) => {
                    console.log(reason);
                    return Promise.reject(reason);
                });
        };
    });
    afterEach(() => {
        global.fetch = globalFetch;
    });

    describe("Session initialization", () => {
        const sessionContext = getSessionContext("Configurator-TS-Model1");

        it("Using accessToken", async () => {
            const session = await SessionFactory.createSession(sessionContext);
            const expectations = getConfigurationSessionExpectations(session);
            expectations.expectRawDataToBeSameAsConfiguration();

            await session.close();
        });

        it("Using sessionCreateUrl", async () => {
            // Create a session out of the ConfigurationSession scope.
            const backgroundSession = await createSession(sessionContext)();
            const sessionId = expectToBeRight(backgroundSession).sessionId;
            const sessionCreateUrl = "http://some-session-create-url";

            // Intercept fetch and return the previous generated sessionId once the sessionCreateUrl is requested.
            const fetch = global.fetch;
            const fetchMock = vi.fn<typeof global.fetch>((input, init) => {
                if (input === sessionCreateUrl) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: (): Promise<any> => Promise.resolve({
                            sessionId: sessionId
                        } satisfies Engine.CreateSessionSuccessResponse)
                    } as Response);
                }
                return fetch(input, init);
            });

            global.fetch = fetchMock;

            // Create a session using the sessionCreateUrl.
            const session = await SessionFactory.createSession({
                ...sessionContext,
                sessionInitialisationOptions: {
                    sessionCreateUrl: sessionCreateUrl
                } satisfies  ServerSideSessionInitialisationOptions
            });
            const expectations = getConfigurationSessionExpectations(session);

            // Any request should point to the sessionCreateUrl.
            expect(fetchMock.mock.calls).toSatisfyAny(([input]: Parameters<typeof global.fetch>) => {
                return input === sessionCreateUrl;
            });
            expectations.expectRawDataToBeSameAsConfiguration();

            await session.close();
        });
    });

    it("reinitialize", async () => {
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        const expectations = getConfigurationSessionExpectations(session);

        await session.makeDecision({
            type: AttributeType.Boolean,
            attributeId: {localId: "Bool1"},
            state: true
        });
        await session.makeDecision({
            type: AttributeType.Numeric,
            attributeId: {localId: "Num1"},
            state: 11
        });
        expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
            expect(a.decision).toEqual({
                kind: DecisionKind.Explicit,
                state: true
            } satisfies Decision<boolean>);
        });
        expectations.expectNumericAttribute({localId: "Num1"}, a => {
            expect(a.decision).toEqual({
                kind: DecisionKind.Explicit,
                state: 11
            } satisfies Decision<number>);
        });
        expectations.expectRawDataToBeSameAsConfiguration();

        const previousSessionState = session.sessionState;
        const previousConfiguration = session.getConfiguration();
        await session.reinitialize();

        expectations.expectRawDataToBeSameAsConfiguration();
        expect(configurationRawDataEq.equals(previousSessionState.configurationRawData, session.sessionState.configurationRawData)).toBeTruthy();
        expect(hashedConfigurationEq.equals(previousSessionState.configuration, session.sessionState.configuration)).toBeTruthy();
        expect(configurationEq.equals(previousConfiguration, session.getConfiguration())).toBeTruthy();
    });

    it("Session recreation when SessionNotFound", async () => {
        // Create a session and make a decision.
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        const expectations = getConfigurationSessionExpectations(session);
        await session.makeDecision({
            type: AttributeType.Boolean,
            attributeId: {localId: "Bool1"},
            state: true
        });
        // Expect decision to be applied.
        expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
            expect(a.decision).toEqual({kind: DecisionKind.Explicit, state: true} satisfies Decision<boolean>);
        });
        expectations.expectRawDataToBeSameAsConfiguration();

        // Simulate SessionNotFound on the next call to MakeDecision.
        const sessionIdToReject = session.sessionState.sessionId!;
        let gotRejected = false;
        const fetch = global.fetch;
        const fetchMock = vi.fn<typeof global.fetch>((input, init) => {
            if (typeof input === "string" && input.endsWith("decision") && init && init.method === "PUT" && init.headers["X-SESSION-ID"] === sessionIdToReject) {
                gotRejected = true;
                return Promise.resolve({
                    ok: false,
                    status: 401,
                    json: (): Promise<any> => Promise.resolve({
                        type: "SessionNotFound",
                        sessionId: {tenantId: "", sessionId: sessionIdToReject},
                        title: "",
                        detail: ""
                    } satisfies SessionNotFound)
                } as Response);
            }

            return fetch(input, init);
        });
        global.fetch = fetchMock;

        await session.makeDecision({
            type: AttributeType.Numeric,
            attributeId: {localId: "Num1"},
            state: 10
        });

        // The sessionId must have been rejected and the new sessionId must be different to the old.
        expect(gotRejected).toBeTruthy();
        expect(session.sessionState.sessionId).not.toEqual(sessionIdToReject);
        // The old decision must remain.
        expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
            expect(a.decision).toEqual({kind: DecisionKind.Explicit, state: true} satisfies Decision<boolean>);
        });
        // The new decision must be applied.
        expectations.expectNumericAttribute({localId: "Num1"}, a => {
            expect(a.decision).toEqual({kind: DecisionKind.Explicit, state: 10} satisfies Decision<number>);
        });
        expectations.expectRawDataToBeSameAsConfiguration();
    });

    it("CanContribute", async () => {
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-CanContribute"));
        const expectations = getConfigurationSessionExpectations(session);

        expectations.expectSatisfaction(false);
        expectations.expectChoiceAttribute({localId: "Attr1"}, (a, e) => {
            expect(a.canContributeToConfigurationSatisfaction).toBeTruthy();
            e.expectChoiceValue("Value1", v => {
                expect(v.decision).toBeFalsy();
            });
        });
        expectations.expectChoiceAttribute({localId: "Attr2"}, (a, e) => {
            expect(a.canContributeToConfigurationSatisfaction).toBeTruthy();
            e.expectChoiceValue("Value1", v => {
                expect(v.decision).toBeFalsy();
            });
        });

        await session.makeDecision({
            type: AttributeType.Choice,
            attributeId: {localId: "Attr1"},
            choiceValueId: "Value1",
            state: ChoiceValueDecisionState.Included
        });

        expectations.expectSatisfaction(true);
        expectations.expectChoiceAttribute({localId: "Attr1"}, (a, e) => {
            expect(a.canContributeToConfigurationSatisfaction).toBeFalsy();
            e.expectChoiceValue("Value1", v => {
                expect(v.decision).toBeTruthy();
            });
        });
        expectations.expectChoiceAttribute({localId: "Attr2"}, (a, e) => {
            expect(a.canContributeToConfigurationSatisfaction).toBeFalsy();
            e.expectChoiceValue("Value1", v => {
                expect(v.decision).toBeFalsy();
            });
        });
        expectations.expectRawDataToBeSameAsConfiguration();
    });

    it("Optimistic decisions", async () => {
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        const expectations = getConfigurationSessionExpectations(session);

        const deferredPromise = pDefer();
        const fetch = global.fetch;
        global.fetch = async (input, init) => {
            await deferredPromise.promise;

            return await fetch(input, init);
        };

        const mkDec1 = session.makeDecision({
            type: AttributeType.Boolean,
            attributeId: {localId: "Bool1"},
            state: true
        });
        // The decision must be applied optimistically.
        expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
            expect(a.decision).toEqual({
                kind: DecisionKind.Explicit,
                state: true
            } satisfies Decision<boolean>);
        });

        const mkDec2 = session.makeDecision({
            type: AttributeType.Numeric,
            attributeId: {localId: "Num1"},
            state: 10
        });
        // The decision must be applied optimistically.
        expectations.expectNumericAttribute({localId: "Num1"}, a => {
            expect(a.decision).toEqual({
                kind: DecisionKind.Explicit,
                state: 10
            } satisfies Decision<number>);
        });

        // Due to the optimistic decisions, the rawData cannot be converted to the same configuration.
        expect(() => expectations.expectRawDataToBeSameAsConfiguration()).toThrow();

        const getBool1 = () => session.getConfiguration().attributes.get(GlobalAttributeIdKeyBuilder({localId: "Bool1"}))!;
        const getNum1 = () => session.getConfiguration().attributes.get(GlobalAttributeIdKeyBuilder({localId: "Num1"}))!;

        const previousBool1 = getBool1();
        const previousNum1 = getNum1();

        // Clear all changes.
        session.clearConfigurationChanges();
        // Resolve all promises.
        deferredPromise.resolve();

        // Both requests must resolve successful.
        await expect(mkDec1).resolves.toBeNil();
        await expect(mkDec2).resolves.toBeNil();

        // The optimistic decisions must become real decisions and therefore there have to be no changes to the decisions.
        const configurationChanges = session.getConfigurationChanges();
        expect(configurationChanges.isSatisfied).toBeNil();
        expect(configurationChanges.attributes.added).toHaveLength(0);
        // The two attributes have changes because their satisfaction is changed.
        expect(configurationChanges.attributes.changed).toHaveLength(2);
        expect(getBool1()).toEqual(hashAttribute({...previousBool1, isSatisfied: true}));
        expect(getNum1()).toEqual(hashAttribute({...previousNum1, isSatisfied: true}));
        expect(configurationChanges.attributes.removed).toHaveLength(0);

        expectations.expectRawDataToBeSameAsConfiguration();
    });

    it("Throws if session is used after closing", async () => {
        const expectSessionClosed = (p: Parameters<typeof E.tryCatch>[0]) => {
            const error = expectToBeLeft(E.tryCatch(p, e => e as ConfiguratorError));
            expect(error).toEqual({type: ConfiguratorErrorType.SessionClosed} satisfies SessionClosed);
        };
        const expectSessionClosedAsync = async (p: Parameters<typeof TE.tryCatch>[0]) => {
            const error = expectToBeLeft(await TE.tryCatch(p, e => e as ConfiguratorError)());
            expect(error).toEqual({type: ConfiguratorErrorType.SessionClosed} satisfies SessionClosed);
        };

        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        await session.close();

        expectSessionClosed(() => session.getSessionContext());
        expectSessionClosed(() => session.getConfiguration());
        expectSessionClosed(() => session.getConfigurationChanges());
        expectSessionClosed(() => session.clearConfigurationChanges());
        expectSessionClosed(() => session.addConfigurationChangedListener(null as any));
        await expectSessionClosedAsync(() => session.makeDecision(null as any));
        await expectSessionClosedAsync(() => session.setMany(null as any, null as any));
        await expectSessionClosedAsync(() => session.explain(null as any, null as any));
        await expectSessionClosedAsync(() => session.applySolution(null as any));
    });

    describe("Explain", () => {
        it("whyIsNotSatisfied", async () => {
            const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

            const answer = await session.explain(q => q.whyIsNotSatisfied.attribute({localId: "Num1"}), "full");
            expect(answer.decisionExplanations).toHaveLength(0);
            expect(answer.constraintExplanations).toHaveLength(1);
            const singleExplanation = answer.constraintExplanations[0];
            expect(singleExplanation.causedByRules).toHaveLength(0);
            expect(singleExplanation.causedByCardinalities).toHaveLength(1);
            expect(singleExplanation.causedByCardinalities[0]).toEqual({localId: "Num1"});
        });

        it("whyIsStateNotPossible", async () => {
            const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
            const expectations = getConfigurationSessionExpectations(session);

            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool2"},
                state: true
            });

            // Expect that only false is possible because setting Bool2 to true prevents GetBlocked1 to be true.
            expectations.expectBooleanAttribute({localId: "GetBlocked1"}, a => {
                expect(a.possibleDecisionStates).toIncludeSameMembers([false]);
                expect(a.decision).toEqual({
                    kind: DecisionKind.Implicit,
                    state: false
                } satisfies Decision<boolean>);
            });

            // The decision should fail.
            await expect(session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "GetBlocked1"},
                state: true
            })).rejects.toSatisfy(e => {
                const error = e as ConfiguratorError;
                return error.type === "ConflictWithConsequence" && globalAttributeIdEq.equals(error.globalAttributeId, {localId: "GetBlocked1"}) && error.choiceValueId == null;
            });

            const answer = await session.explain(q => q.whyIsStateNotPossible.boolean({localId: "GetBlocked1"}).state(true), "full");

            const expectedAnswer: FullExplainAnswer = {
                constraintExplanations: [{
                    causedByCardinalities: [],
                    causedByRules: [{
                        configurationModelId: "Model1",
                        localId: "Group1::Rule1"
                    }]
                }],
                decisionExplanations: [{
                    causedByDecisions: [{
                        type: AttributeType.Boolean,
                        attributeId: {localId: "Bool2"},
                        state: true
                    }],
                    solution: {
                        decisions: [
                            // The attribute with the explained state must always be part of the solution.
                            {
                                type: AttributeType.Boolean,
                                attributeId: {localId: "GetBlocked1"},
                                state: true
                            } satisfies ExplicitBooleanDecision,
                            // The attribute that is causing the attribute to be blocked must be reset.
                            {
                                type: AttributeType.Boolean,
                                attributeId: {localId: "Bool2"},
                                state: null
                            } satisfies ExplicitBooleanDecision
                        ],
                        mode: {
                            type: "KeepExistingDecisions"
                        }
                    }
                }],
            };

            expect(fullExplainAnswerEq.equals(answer, expectedAnswer)).toBeTruthy();
        });
    });

    describe("SetMany", () => {
        describe("Compatible decisions", () => {
            it.each([
                {
                    type: "DropExistingDecisions",
                    conflictHandling: {
                        type: "Manual",
                        includeConstraintsInConflictExplanation: true
                    }
                } satisfies SetManyDropExistingDecisionsMode as SetManyMode,
                {
                    type: "DropExistingDecisions",
                    conflictHandling: {
                        type: "Automatic"
                    }
                } satisfies SetManyDropExistingDecisionsMode as SetManyMode,
                {
                    type: "KeepExistingDecisions",
                } satisfies SetManyKeepExistingDecisionsMode as SetManyMode
            ])
            ("Compatible decisions", async (setManyMode: SetManyMode) => {
                const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
                const expectations = getConfigurationSessionExpectations(session);

                const desiredBool1Decision: ExplicitBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "Bool1"},
                    state: true
                };
                const desiredNum1Decision: ExplicitNumericDecision = {
                    type: AttributeType.Numeric,
                    attributeId: {localId: "Num1"},
                    state: 10
                };

                // Make two decisions compatible decisions.
                const setMany = await session.setMany([desiredBool1Decision, desiredNum1Decision], setManyMode);

                expect(setMany.rejectedDecisions).toHaveLength(0);
                expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
                    expect(a.decision).toEqual({
                        kind: DecisionKind.Explicit,
                        state: true
                    } satisfies Decision<boolean>);
                });
                expectations.expectNumericAttribute({localId: "Num1"}, a => {
                    expect(a.decision).toEqual({
                        kind: DecisionKind.Explicit,
                        state: 10
                    } satisfies Decision<number>);
                });
                expectations.expectRawDataToBeSameAsConfiguration();
            });
        });

        describe("Incompatible decisions", () => {
            it("DropExistingDecisions - ManualConflictResolution", async () => {
                const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

                const independentNumericDecision: ExplicitNumericDecision = {
                    type: AttributeType.Numeric,
                    attributeId: {localId: "Num1"},
                    state: 10
                };
                const desiredBool2Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "Bool2"},
                    state: true
                };
                const desiredGetBlocked1Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "GetBlocked1"},
                    state: true
                };

                const setManyMode: SetManyMode = {
                    type: "DropExistingDecisions",
                    conflictHandling: {type: "Manual", includeConstraintsInConflictExplanation: true}
                };

                // Make two decisions that are not compatible due to rules.
                const setMany = session.setMany([desiredBool2Decision, desiredGetBlocked1Decision, independentNumericDecision], setManyMode);

                const expected: SetManyDecisionsConflict = {
                    type: ConfiguratorErrorType.SetManyDecisionsConflict,
                    title: "",
                    detail: "",
                    decisionExplanations: [
                        {
                            causedByDecisions: [
                                desiredBool2Decision
                            ],
                            solution: {
                                mode: setManyMode,
                                decisions: [
                                    desiredGetBlocked1Decision,
                                    {
                                        ...desiredBool2Decision,
                                        state: undefined
                                    },
                                    independentNumericDecision
                                ],

                            }
                        },
                        {
                            causedByDecisions: [
                                desiredGetBlocked1Decision
                            ],
                            solution: {
                                mode: setManyMode,
                                decisions: [
                                    desiredBool2Decision,
                                    {
                                        ...desiredGetBlocked1Decision,
                                        state: undefined
                                    },
                                    independentNumericDecision
                                ],

                            }
                        }
                    ],
                    constraintExplanations: [{
                        causedByCardinalities: [],
                        causedByRules: [{
                            configurationModelId: "Model1",
                            localId: "Group1::Rule1"
                        }]
                    }]
                };

                await expect(setMany).rejects.toSatisfy(e => setManyDecisionsConflictEq.equals({
                    ...e as SetManyDecisionsConflict,
                    // Reset the title and detail because this test is about the explanations.
                    title: "",
                    detail: ""
                }, expected));
            });

            it("DropExistingDecisions - AutomaticConflictResolution", async () => {
                const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
                const expectations = getConfigurationSessionExpectations(session);

                const independentNumericDecision: ExplicitNumericDecision = {
                    type: AttributeType.Numeric,
                    attributeId: {localId: "Num1"},
                    state: 10
                };
                const desiredBool2Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "Bool2"},
                    state: true
                };
                const desiredGetBlocked1Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "GetBlocked1"},
                    state: true
                };

                // Make two decisions that are not compatible due to rules.
                const setMany = await session.setMany([desiredBool2Decision, desiredGetBlocked1Decision, independentNumericDecision], {
                    type: "DropExistingDecisions",
                    conflictHandling: {type: "Automatic"}
                });

                expectations.expectNumericAttribute({localId: "Num1"}, a => {
                    expect(a.decision).toEqual({
                        kind: DecisionKind.Explicit,
                        state: 10
                    } satisfies Decision<number>);
                });
                expect(setMany.rejectedDecisions).toHaveLength(1);
                // One expectation must be right depending on the solution chosen by the engine.
                expect(() => {
                    try {
                        expectations.expectBooleanAttribute({localId: "GetBlocked1"}, a => {
                            expect(a.decision).toEqual({
                                kind: DecisionKind.Explicit,
                                state: true
                            } satisfies Decision<boolean>);
                        });
                        expectations.expectBooleanAttribute({localId: "Bool2"}, a => {
                            expect(a.decision).toEqual({
                                kind: DecisionKind.Implicit,
                                state: false
                            } satisfies Decision<boolean>);
                        });
                        expect(setMany.rejectedDecisions[0]).toEqual(desiredBool2Decision);
                    } catch (e) {
                        expectations.expectBooleanAttribute({localId: "GetBlocked1"}, a => {
                            expect(a.decision).toEqual({
                                kind: DecisionKind.Implicit,
                                state: false
                            } satisfies Decision<boolean>);
                        });
                        expectations.expectBooleanAttribute({localId: "Bool2"}, a => {
                            expect(a.decision).toEqual({
                                kind: DecisionKind.Explicit,
                                state: true
                            } satisfies Decision<boolean>);
                        });
                        expect(setMany.rejectedDecisions[0]).toEqual(desiredGetBlocked1Decision);
                    }
                }).not.toThrow();

                expectations.expectRawDataToBeSameAsConfiguration();
            });

            it("KeepExistingDecisions", async () => {
                const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

                const independentNumericDecision: ExplicitNumericDecision = {
                    type: AttributeType.Numeric,
                    attributeId: {localId: "Num1"},
                    state: 10
                };
                const desiredBool2Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "Bool2"},
                    state: true
                };
                const desiredGetBlocked1Decision: ExplicitBooleanDecision & CausedByBooleanDecision = {
                    type: AttributeType.Boolean,
                    attributeId: {localId: "GetBlocked1"},
                    state: true
                };

                // Make two decisions that are not compatible due to rules.
                const setMany = session.setMany([desiredBool2Decision, desiredGetBlocked1Decision, independentNumericDecision], {
                    type: "KeepExistingDecisions"
                });

                await expect(setMany).rejects.toSatisfy(e => (e as ConfiguratorError).type === "SetManyDecisionsConflict");
            });
        });
    });

    it("ResetConfiguration", async () => {
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1"));

        // Initially the configuration has no explicit decisions and can therefore not be reset.
        expect(session.canResetConfiguration).toBeFalsy();

        // Resetting the configuration if it can not be reset, must not throw an error.
        await session.resetConfiguration();

        await session.makeDecision({
            type: AttributeType.Boolean,
            attributeId: {localId: "Bool1"},
            state: true
        });

        // After a decision is made, the configuration have to be resettable.
        expect(session.canResetConfiguration).toBeTruthy();

        await session.resetConfiguration();
        expect(session.canResetConfiguration).toBeFalsy();
    });

    describe("Store/Restore configuration", () => {
        it("Restore to old state", async () => {
            const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1"));
            const expectations = getConfigurationSessionExpectations(session);

            // On a new session the stored configuration must be empty due to missing explicit decisions.
            await expect(session.storeConfiguration()).resolves.toEqual({
                schemaVersion: 1,
                explicitDecisions: []
            } satisfies StoredConfiguration);

            // Do some decisions of any kind.
            await session.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool1"},
                state: true
            });

            await session.setMany([{
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool2"},
                state: true
            }, {
                type: AttributeType.Numeric,
                attributeId: {localId: "Num1"},
                state: 12
            }], {type: "KeepExistingDecisions"});

            const storedConfiguration = await session.storeConfiguration();

            // Made a decision that is not contained in the StoredConfiguration.
            await session.makeDecision({
                type: AttributeType.Choice,
                attributeId: {localId: "Ch1"},
                choiceValueId: "Value1",
                state: ChoiceValueDecisionState.Included
            });

            // Expect that every made decision is present in the configuration.
            expectations.expectRawDataToBeSameAsConfiguration();
            expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: true
                } satisfies Decision<boolean>);
            });
            expectations.expectBooleanAttribute({localId: "Bool2"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: true
                } satisfies Decision<boolean>);
            });
            expectations.expectNumericAttribute({localId: "Num1"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: 12
                } satisfies Decision<number>);
            });
            expectations.expectChoiceValue({localId: "Ch1"}, "Value1", a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: ChoiceValueDecisionState.Included
                } satisfies Decision<ChoiceValueDecisionState>);
            });

            // Restore the session to the previously stored state.
            await session.restoreConfiguration(storedConfiguration, {
                type: "DropExistingDecisions",
                conflictHandling: {type: "Automatic"}
            });

            // Expect that every decision state the same, except for ChoiceDecision that was made after storing the configuration.
            expectations.expectRawDataToBeSameAsConfiguration();
            expectations.expectBooleanAttribute({localId: "Bool1"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: true
                } satisfies Decision<boolean>);
            });
            expectations.expectBooleanAttribute({localId: "Bool2"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: true
                } satisfies Decision<boolean>);
            });
            expectations.expectNumericAttribute({localId: "Num1"}, a => {
                expect(a.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: 12
                } satisfies Decision<number>);
            });
            expectations.expectChoiceValue({localId: "Ch1"}, "Value1", a => {
                expect(a.decision).toBeNil();
            });
        });

        it("Restore to other session", async () => {
            const session1 = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

            // Do some decisions of any kind.
            await session1.makeDecision({
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool1"},
                state: true
            });

            await session1.setMany([{
                type: AttributeType.Boolean,
                attributeId: {localId: "Bool2"},
                state: true
            }, {
                type: AttributeType.Numeric,
                attributeId: {localId: "Num1"},
                state: 12
            }], {type: "KeepExistingDecisions"});

            const storedConfiguration = await session1.storeConfiguration();

            const session2 = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

            // Restore the session2 to the previously stored state.
            await session2.restoreConfiguration(storedConfiguration, {
                type: "DropExistingDecisions",
                conflictHandling: {type: "Automatic"}
            });

            // Session2 must have the same state as Session1
            expect(configurationRawDataEq.equals(session1.sessionState.configurationRawData, session2.sessionState.configurationRawData)).toBeTruthy();
            expect(hashedConfigurationEq.equals(session1.sessionState.configuration, session2.sessionState.configuration)).toBeTruthy();
            expect(configurationEq.equals(session1.getConfiguration(), session2.getConfiguration())).toBeTruthy();
        });

        it("StoredConfiguration is malformed", async () => {
            const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;

            await expect(session.restoreConfiguration({
                schemaVersion: 2,
                decisions: []
            } as any as StoredConfiguration, {
                type: "DropExistingDecisions",
                conflictHandling: {type: "Automatic"}
            })).rejects.toEqual({type: ConfiguratorErrorType.StoredConfigurationInvalid} satisfies StoredConfigurationInvalid);
        });
    });

    it("getDecisions", async () => {
        const getCollectedDecisionsMock = vi.spyOn(ConfigurationRawDataL, "getCollectedDecisions");

        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        const expectations = getConfigurationSessionExpectations(session);

        // Make a decision that results in an explicit and an implicit decision.
        await session.makeDecision({
            type: AttributeType.Boolean,
            attributeId: {localId: "Bool2"},
            state: true
        });

        expectations.expectBooleanAttribute({localId: "GetBlocked1"}, a => {
            expect(a.possibleDecisionStates).toIncludeSameMembers([false]);
            expect(a.decision).toEqual({
                kind: DecisionKind.Implicit,
                state: false
            } satisfies Decision<boolean>);
        });

        expect(getCollectedDecisionsMock).toBeCalledTimes(0);

        const explicitCD: CollectedBooleanDecision = {
            attributeType: AttributeType.Boolean,
            attributeId: {localId: "Bool2"},
            attributeKey: GlobalAttributeIdKeyBuilder({localId: "Bool2"}),
            kind: DecisionKind.Explicit,
            state: true
        };
        const implicitCD: CollectedBooleanDecision = {
            attributeType: AttributeType.Boolean,
            attributeId: {localId: "GetBlocked1"},
            attributeKey: GlobalAttributeIdKeyBuilder({localId: "GetBlocked1"}),
            kind: DecisionKind.Implicit,
            state: false
        };

        // Call getDecisions multiple times to ensure that the initial result is cached.
        expect(session.getDecisions()).toIncludeSameMembers([explicitCD, implicitCD]);
        expect(session.getDecisions(DecisionKind.Implicit)).toIncludeSameMembers([implicitCD]);
        expect(session.getDecisions(DecisionKind.Explicit)).toIncludeSameMembers([explicitCD]);
        session.getDecisions();
        expect(getCollectedDecisionsMock).toBeCalledTimes(1);
        expect(getCollectedDecisionsMock).toHaveBeenLastCalledWith(session.sessionState.configurationRawData);
    });

    it("Decision results in multiple changes for a single choice attribute", async () => {
        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1"));
        const expectations = getConfigurationSessionExpectations(session);

        await session.makeDecision({
            type: AttributeType.Choice,
            attributeId: {localId: "Ch2"},
            choiceValueId: "Value1",
            state: ChoiceValueDecisionState.Included
        });

        expectations.expectChoiceAttribute({localId: "Ch2"}, (_, e) => {
            e.expectChoiceValue("Value1", v => {
                expect(v.decision).toEqual({
                    kind: DecisionKind.Explicit,
                    state: ChoiceValueDecisionState.Included
                } satisfies Decision<ChoiceValueDecisionState>);
            });
            e.expectChoiceValue("Value2", v => {
                expect(v.decision).toEqual({
                    kind: DecisionKind.Implicit,
                    state: ChoiceValueDecisionState.Included
                } satisfies Decision<ChoiceValueDecisionState>);
            });
        });
    });

    it("Closing the session sends a DELETE request", async () => {
        const globalFetch = global.fetch;
        const fetchMock = vi.fn<typeof global.fetch>((input, init) => globalFetch(input, init));
        global.fetch = fetchMock;

        const session = await SessionFactory.createSession(getSessionContext("Configurator-TS-Model1")) as ConfigurationSession;
        await expect(session.close()).resolves.toBeNil();

        // Expect that a DELETE request was send to close the session.
        expect(fetchMock.mock.calls).toSatisfyAny(call => {
            const [input, init] = (call as Parameters<typeof globalFetch>);

            return typeof input === "string" && input.includes("session") && init?.method === "DELETE";
        });
    });
});