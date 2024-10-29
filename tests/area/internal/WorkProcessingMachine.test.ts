// noinspection DuplicatedCode
/// <reference types="../../jest-extended" />

import {afterAll, beforeEach, describe, expect, it, MockedFunction, vi} from "vitest";
import {E, pipe, RM, TE} from "@viamedici-spc/fp-ts-extensions";
import {
    createWorkProcessingMachine,
    MachineState,
    resolveDeferredPromises
} from "../../../src/domain/WorkProcessingMachine";
import {
    sessionStateWithOneMandatoryBoolean,
    sessionStateWithOneMandatoryComponent,
    sessionStateWithOneMandatoryNumeric
} from "../../data/SessionStates";
import {createStateMutatingWorkItemDummy, createStatePreservingWorkItemDummy} from "../../data/WorkItem";
import {
    Attribute,
    AttributeType,
    ConfiguratorErrorType,
    globalAttributeIdKeyEq,
    ServerError,
    SessionNotFound,
    TaskCancelled
} from "../../../src";
import getWorkProcessingMachineExpectations from "../../setup/WorkProcessingMachineExpectations";
import {
    ConfigurationSessionState,
    FullQualifiedConfigurationSessionState
} from "../../../src/domain/model/ConfigurationSessionState";
import {expectToBeRight} from "../../setup/EitherExtensions";
import {WorkItem} from "../../../src/domain/model/WorkItem";
import pDefer from "p-defer";
import {closeSession, createSessionWithData} from "../../../src/domain/logic/EngineLogic";
import waitForExpect from "wait-for-expect";
import GlobalAttributeIdKeyBuilder from "../../../src/crossCutting/GlobalAttributeIdKeyBuilder";
import {getComponentAttribute, getNumericAttribute} from "../../data/AttributeGeneration";
import {createStatePreservingWorkItem} from "../../../src/domain/logic/WorkItem";
import * as Session from "../../../src/domain/logic/SessionLogic";
import {ScheduleTaskResult} from "../../../src/contract/Types";

vi.mock("../../../src/domain/logic/EngineLogic");

const createSessionWithDataMock: MockedFunction<typeof createSessionWithData> = createSessionWithData as any;
const closeSessionMock: MockedFunction<typeof closeSession> = closeSession as any;
const globalFetch = global.fetch;

describe("WorkProcessingMachine", () => {
    let sut: ReturnType<typeof createWorkProcessingMachine>;
    let expectation: ReturnType<typeof getWorkProcessingMachineExpectations>;
    const emittedMachineState = vi.fn<(machineState: MachineState) => void>();

    function enqueueWork(workItem: WorkItem<any>, ...workItems: ReadonlyArray<WorkItem<any>>) {
        [workItem, ...workItems].forEach(w => {
            sut.send({type: "EnqueueWork", workItem: w});
        });
    }

    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = () => Promise.reject();
        sut = createWorkProcessingMachine(sessionStateWithOneMandatoryBoolean);
        sut.on("MachineState", s => {
            emittedMachineState(s);
            resolveDeferredPromises(s.deferredPromiseCompletions);
        });
        expectation = getWorkProcessingMachineExpectations(sut);
        closeSessionMock.mockImplementation(() => pipe(TE.right({}), TE.asUnit));
    });
    afterAll(() => {
        if (sut) {
            sut.stop();
        }
        global.fetch = globalFetch;
    });

    it("Parallel execution of StatePreservingWork", async () => {
        sut.start();

        const w1 = createStatePreservingWorkItemDummy<number>();
        const w2 = createStatePreservingWorkItemDummy<number>();
        const w3 = createStatePreservingWorkItemDummy<number>();

        enqueueWork(w1.workItem, w2.workItem, w3.workItem);

        expectation.expectState("processing");
        // All enqueued work must be in the order of enqueuing.
        expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);
        expectation.expectWorkToRun([w1.workItem.itemId, w2.workItem.itemId, w3.workItem.itemId], true);
        // Each work must be attempted exactly once.
        expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(3);
        expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);
        expectation.expectWorkToBeExecuted(w2.workItem.itemId, 1);
        expectation.expectWorkToBeExecuted(w3.workItem.itemId, 1);

        // Every work have to be executed.
        expect(w1.executeMock).toBeCalledTimes(1);
        expect(w2.executeMock).toBeCalledTimes(1);
        expect(w3.executeMock).toBeCalledTimes(1);

        w1.resolveExecute(E.right(1));
        await expect(w1.resultPromise).resolves.toBe(1);

        w2.resolveExecute(E.left({type: ConfiguratorErrorType.ServerError} satisfies ServerError));
        w3.resolveExecute(E.right(3));

        await expect(w2.resultPromise).rejects.toStrictEqual({type: ConfiguratorErrorType.ServerError} satisfies ServerError);
        await expect(w3.resultPromise).resolves.toBe(3);

        // Every work have to be executed only once.
        expect(w1.executeMock).toBeCalledTimes(1);
        expect(w2.executeMock).toBeCalledTimes(1);
        expect(w3.executeMock).toBeCalledTimes(1);

        // No work should be left.
        expectation.expectWorkInOrder([]);
        expectation.expectWorkToRun([], true);

        sut.send({type: "Shutdown"});

        // The State have to be emitted x times.
        // 1 time initial
        // 3 times for every enqueued work.
        // 3 times for the finished work.
        // 1 time while shutdown.
        expect(emittedMachineState).toBeCalledTimes(1 + 3 + 3 + 1);
    });

    it("Sequential execution of StateMutatingWork", async () => {
        sut.start();

        const w1 = createStateMutatingWorkItemDummy<number>(true);
        const w2 = createStateMutatingWorkItemDummy<number>(true);
        const w3 = createStateMutatingWorkItemDummy<number>(true);

        enqueueWork(w1.workItem, w2.workItem, w3.workItem);

        expectation.expectState("processing");

        // ----  First work execution ---- //
        // All enqueued work must be in the order of enqueuing.
        expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);
        // Only the first work should run.
        expectation.expectWorkToRun([w1.workItem.itemId], true);
        // Only the first work must be attempted once.
        expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
        expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);
        expectation.expectWorkToBeExecuted(w2.workItem.itemId, undefined);
        expectation.expectWorkToBeExecuted(w3.workItem.itemId, undefined);

        // Only the first work should have been called at this time.
        expect(w1.executeMock).toBeCalledTimes(1);
        expect(w2.executeMock).toBeCalledTimes(0);
        expect(w3.executeMock).toBeCalledTimes(0);

        // Resolve the first work.
        w1.resolveExecute(E.right({
            sessionState: sessionStateWithOneMandatoryNumeric as FullQualifiedConfigurationSessionState,
            result: 1
        }));
        await expect(w1.resultPromise).resolves.toBe(1);

        // ----  Second work execution ---- //
        // The first work must be removed.
        expectation.expectWorkInOrder([w2.workItem, w3.workItem]);
        // Only the second work should run.
        expectation.expectWorkToRun([w2.workItem.itemId], true);
        // The second work must be attempted once, because finished work is removed from the Map.
        expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
        expectation.expectWorkToBeExecuted(w1.workItem.itemId, undefined);
        expectation.expectWorkToBeExecuted(w2.workItem.itemId, 1);
        expectation.expectWorkToBeExecuted(w3.workItem.itemId, undefined);

        // The first and the second work should have been called at this time.
        expect(w1.executeMock).toBeCalledTimes(1);
        expect(w2.executeMock).toBeCalledTimes(1);
        expect(w3.executeMock).toBeCalledTimes(0);

        // Resolve the second work.
        w2.resolveExecute(E.right({
            sessionState: sessionStateWithOneMandatoryBoolean as FullQualifiedConfigurationSessionState,
            result: 2
        }));
        await expect(w2.resultPromise).resolves.toBe(2);

        // ----  Third work execution ---- //
        // The second work must be removed.
        expectation.expectWorkInOrder([w3.workItem]);
        // Only the third work should run.
        expectation.expectWorkToRun([w3.workItem.itemId], true);
        // The third work must be attempted once, because finished work is removed from the Map.
        expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
        expectation.expectWorkToBeExecuted(w1.workItem.itemId, undefined);
        expectation.expectWorkToBeExecuted(w2.workItem.itemId, undefined);
        expectation.expectWorkToBeExecuted(w3.workItem.itemId, 1);

        // The all work should have been called at this time.
        expect(w1.executeMock).toBeCalledTimes(1);
        expect(w2.executeMock).toBeCalledTimes(1);
        expect(w3.executeMock).toBeCalledTimes(1);

        // Resolve the third work.
        w3.resolveExecute(E.right({
            sessionState: sessionStateWithOneMandatoryNumeric as FullQualifiedConfigurationSessionState,
            result: 3
        }));
        await expect(w3.resultPromise).resolves.toBe(3);

        // Result of w1 must be parameter of w2.
        const w1Result = w1.executeMock.mock.results[0];
        if (w1Result.type === "return") {
            const w1SuccessResult = expectToBeRight(await w1Result.value());
            expect(w1SuccessResult.result).toBe(1);
            expect(w1SuccessResult.sessionState).toEqual(w2.executeMock.mock.calls[0][0]);
        } else {
            expect(w1Result.type).toBe("return");
        }

        // Result of w2 must be parameter of w3.
        const w2Result = w2.executeMock.mock.results[0];
        if (w2Result.type === "return") {
            const w2SuccessResult = expectToBeRight(await w2Result.value());
            expect(w2SuccessResult.result).toBe(2);
            expect(w2SuccessResult.sessionState).toEqual(w3.executeMock.mock.calls[0][0]);
        } else {
            expect(w2Result.type).toBe("return");
        }

        // No work should be left.
        expectation.expectWorkInOrder([]);
        expectation.expectWorkToRun([], true);

        sut.send({type: "Shutdown"});

        // The State have to be emitted x times.
        // 1 time initial
        // 3 times for every enqueued work.
        // 3 times for the finished work.
        // 1 time while shutdown.
        expect(emittedMachineState).toBeCalledTimes(1 + 3 + 3 + 1);
    });

    describe("SessionNotFound with successful recovery", () => {
        let releaseCreateSessionPromise: ReturnType<typeof pDefer> = null as any;
        beforeEach(() => {
            releaseCreateSessionPromise = pDefer();

            createSessionWithDataMock.mockImplementation(() => async () => {
                await releaseCreateSessionPromise.promise;
                return E.right(sessionStateWithOneMandatoryComponent);
            });

            sut.start();
        });

        it("StateMutatingWork", async () => {
            const w1 = createStateMutatingWorkItemDummy<number>(true);
            const w2 = createStatePreservingWorkItemDummy<number>();
            const w3 = createStatePreservingWorkItemDummy<number>();

            enqueueWork(w1.workItem, w2.workItem, w3.workItem);

            expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);
            // The first work should be the only to execute.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);

            w1.resolveExecute(E.left({
                sessionState: sessionStateWithOneMandatoryNumeric,
                error: {type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound
            }));

            // Create session must have been called.
            await waitForExpect(() => {
                expect(createSessionWithDataMock).toBeCalledTimes(1);
            });

            // The state machine must be in restoring state.
            expect(sut.getSnapshot().matches("restoreSession")).toBeTruthy();

            // The sessionState must have become the rejection of w1.
            // The sessionId must be discarded if there was a SessionNotFound error.
            expect(sut.getSnapshot().context.sessionState).toEqual({
                ...sessionStateWithOneMandatoryNumeric,
                sessionId: undefined
            } satisfies ConfigurationSessionState);

            // Release the createSessionWithData request once the sessionState become the error result of w1.
            releaseCreateSessionPromise.resolve();

            // Wait for the sessionState become the result of createSessionWithData.
            await waitForExpect(() => {
                expect(sut.getSnapshot().context.sessionState).toEqual(sessionStateWithOneMandatoryComponent);
            });

            // The first work is executed a second time and resolves successful.
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 2);
            w1.resolveExecute(E.right({
                sessionState: sessionStateWithOneMandatoryNumeric,
                result: 1
            }));
            await expect(w1.resultPromise).resolves.toBe(1);

            // Wait for the sessionState become the result of w1.
            await waitForExpect(() => {
                expect(sut.getSnapshot().context.sessionState).toEqual(sessionStateWithOneMandatoryNumeric);
            });

            // The first work must be executed twice, the following 2 StatePreserving works are called once.
            expect(w1.executeMock).toBeCalledTimes(2);
            expect(w2.executeMock).toBeCalledTimes(1);
            expect(w3.executeMock).toBeCalledTimes(1);
        });

        const work1 = 1;
        const work2 = 2;
        const work3 = 4;
        it.each([work1, work2, work3, work1 + work2, work1 + work3, work2 + work3, work1 + work2 + work3])
        ("StatePreservingWork", async (workToCancel: number) => {
            const w1 = createStatePreservingWorkItemDummy<number>();
            const w2 = createStatePreservingWorkItemDummy<number>();
            const w3 = createStatePreservingWorkItemDummy<number>();

            enqueueWork(w1.workItem, w2.workItem, w3.workItem);

            expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);
            // All works should be executed.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(3);
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);
            expectation.expectWorkToBeExecuted(w2.workItem.itemId, 1);
            expectation.expectWorkToBeExecuted(w3.workItem.itemId, 1);

            const error = E.left({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);
            if (workToCancel & work1) {
                w1.resolveExecute(error);
            }
            if (workToCancel & work2) {
                w2.resolveExecute(error);
            }
            if (workToCancel & work3) {
                w3.resolveExecute(error);
            }

            // Create session must have been called.
            await waitForExpect(() => {
                expect(createSessionWithDataMock).toBeCalledTimes(1);
            });

            // The state machine must be in restoring state.
            expect(sut.getSnapshot().matches("restoreSession")).toBeTruthy();

            // The sessionId must be discarded if there was a SessionNotFound error.
            expect(sut.getSnapshot().context.sessionState).toEqual({
                ...sessionStateWithOneMandatoryBoolean,
                sessionId: undefined,
            } satisfies ConfigurationSessionState);

            releaseCreateSessionPromise.resolve();

            // Wait for the sessionState become the result of createSessionWithData.
            await waitForExpect(() => {
                expect(sut.getSnapshot().context.sessionState).toEqual(sessionStateWithOneMandatoryComponent);
            });

            // All work are executed a second time and resolve successful.
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 2);
            expectation.expectWorkToBeExecuted(w2.workItem.itemId, 2);
            expectation.expectWorkToBeExecuted(w3.workItem.itemId, 2);
            w1.resolveExecute(E.right(1));
            w2.resolveExecute(E.right(2));
            w3.resolveExecute(E.right(3));
            await expect(w1.resultPromise).resolves.toBe(1);
            await expect(w2.resultPromise).resolves.toBe(2);
            await expect(w3.resultPromise).resolves.toBe(3);

            // The sessionState must still be the result of createSessionWithData.
            expect(sut.getSnapshot().context.sessionState).toEqual(sessionStateWithOneMandatoryComponent);

            // All work must have been executed twice.
            expect(w1.executeMock).toBeCalledTimes(2);
            expect(w2.executeMock).toBeCalledTimes(2);
            expect(w3.executeMock).toBeCalledTimes(2);
        });
    });

    describe("SessionNotFound with failed recovery", () => {
        let releaseCreateSessionPromise: ReturnType<typeof pDefer> = null as any;
        beforeEach(() => {
            releaseCreateSessionPromise = pDefer();

            createSessionWithDataMock.mockImplementation(() => async () => {
                await releaseCreateSessionPromise.promise;
                return E.left({type: ConfiguratorErrorType.ServerError});
            });

            sut.start();
        });

        it("StateMutating fails", async () => {
            const w1 = createStateMutatingWorkItemDummy<number>(true);
            const w2 = createStateMutatingWorkItemDummy<number>(true);
            const w3 = createStateMutatingWorkItemDummy<number>(false);
            const w4 = createStateMutatingWorkItemDummy<number>(true);

            enqueueWork(w1.workItem, w2.workItem, w3.workItem, w4.workItem);

            expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem, w4.workItem]);
            // The first work should be the only to execute.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);

            w1.resolveExecute(E.left({
                sessionState: sessionStateWithOneMandatoryNumeric,
                error: {type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound
            }));

            // Create session must have been called.
            await waitForExpect(() => {
                expect(createSessionWithDataMock).toBeCalledTimes(1);
            });

            // The state machine must be in restoring state.
            expect(sut.getSnapshot().matches("restoreSession")).toBeTruthy();

            // The sessionState must have become the rejection of w1.
            // The sessionId must be discarded if there was a SessionNotFound error.
            expect(sut.getSnapshot().context.sessionState).toEqual({
                ...sessionStateWithOneMandatoryNumeric,
                sessionId: undefined
            } satisfies ConfigurationSessionState);

            // Release the createSessionWithData request once the sessionState become the error result of w1.
            releaseCreateSessionPromise.resolve();

            // w1 and w2 become rejected. w2 is reject because allowSimultaneouslyTermination was set to true.
            // If there was any error during session recovery, the error is always changed to SessionNotFound.
            await expect(w1.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);
            await expect(w2.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);

            // The third and fourth work should remain.
            expectation.expectWorkInOrder([w3.workItem, w4.workItem]);
            // The third work should be the only to execute.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
            expectation.expectWorkToBeExecuted(w3.workItem.itemId, 1);

            // The first and third work must be executed once, all other work never.
            // This is w1 resulted in SessionNotFound and w3 is never answered.
            expect(w1.executeMock).toBeCalledTimes(1);
            expect(w2.executeMock).toBeCalledTimes(0);
            expect(w3.executeMock).toBeCalledTimes(1);
            expect(w4.executeMock).toBeCalledTimes(0);
        });

        it("StatePreserving fails", async () => {
            const w1 = createStatePreservingWorkItemDummy<number>();
            const w2 = createStatePreservingWorkItemDummy<number>();
            const w3 = createStateMutatingWorkItemDummy<number>(false);
            const w4 = createStatePreservingWorkItemDummy<number>();

            enqueueWork(w1.workItem, w2.workItem, w3.workItem, w4.workItem);

            expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem, w4.workItem]);
            // w1 and w2 should be executed.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(2);
            expectation.expectWorkToBeExecuted(w1.workItem.itemId, 1);
            expectation.expectWorkToBeExecuted(w2.workItem.itemId, 1);

            w2.resolveExecute(E.left({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound));

            // Create session must have been called.
            await waitForExpect(() => {
                expect(createSessionWithDataMock).toBeCalledTimes(1);
            });

            // The state machine must be in restoring state.
            expect(sut.getSnapshot().matches("restoreSession")).toBeTruthy();

            // The sessionId must be discarded if there was a SessionNotFound error.
            expect(sut.getSnapshot().context.sessionState).toEqual({
                ...sessionStateWithOneMandatoryBoolean,
                sessionId: undefined
            } satisfies ConfigurationSessionState);

            releaseCreateSessionPromise.resolve();

            // w1 and w2 become rejected. w1 is reject because StatePreserving work is always rejected if parallel running work is rejected with SessionNotFound.
            // If there was any error during session recovery, the error is always changed to SessionNotFound.
            await expect(w1.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);
            await expect(w2.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);

            // w3 and w4 should remain because w3 doesn't allow simultaneously termination.
            expectation.expectWorkInOrder([w3.workItem, w4.workItem]);
            // Only w3 should be executed.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);
            expectation.expectWorkToBeExecuted(w3.workItem.itemId, 1);
            expectation.expectWorkToBeExecuted(w4.workItem.itemId, undefined);

            // w1 and w2 are executed once because w2 resulted in an error which failed w1 and w2.
            // w3 tried to execute but is never answered.
            expect(w1.executeMock).toBeCalledTimes(1);
            expect(w2.executeMock).toBeCalledTimes(1);
            expect(w3.executeMock).toBeCalledTimes(1);
            expect(w4.executeMock).toBeCalledTimes(0);
        });
    });

    it("Optimistic decisions", async () => {
        const getLastEmittedState = () => emittedMachineState.mock.calls.slice(-1)[0][0];
        const attributeId = GlobalAttributeIdKeyBuilder({localId: "A1"});

        sut.start();

        const w1 = createStateMutatingWorkItemDummy<number>(true, c => c);
        const w2 = createStateMutatingWorkItemDummy<number>(true, c => ({
            ...c,
            attributes: pipe(
                c.attributes,
                RM.upsertAt(globalAttributeIdKeyEq)<Attribute>(attributeId, getNumericAttribute("A1", {hash: undefined})[1])
            )
        }));
        const w3 = createStateMutatingWorkItemDummy<number>(true, c => ({
            ...c,
            attributes: RM.empty
        }));
        const w4 = createStateMutatingWorkItemDummy<number>(true, c => ({
            ...c,
            attributes: pipe(
                c.attributes,
                RM.upsertAt(globalAttributeIdKeyEq)<Attribute>(attributeId, getComponentAttribute("A1", {hash: undefined})[1])
            )
        }));

        // Initial the attribute is of type Boolean
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Boolean);

        // W1 should change nothing
        enqueueWork(w1.workItem);
        expectation.expectWorkInOrder([w1.workItem]);
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Boolean);

        // W2 should change the attribute type to Numeric
        enqueueWork(w2.workItem);
        expectation.expectWorkInOrder([w1.workItem, w2.workItem]);
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Numeric);

        // W3 should clear all attributes
        enqueueWork(w3.workItem);
        expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);
        expect(getLastEmittedState().sessionState.configuration.attributes).toBeEmpty();

        // W4 will add a Component attribute
        enqueueWork(w4.workItem);
        expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem, w4.workItem]);
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Component);

        // Rejecting w1 to w3 should change nothing to the configuration because w4 still overlay the attributes
        // Reject w1
        emittedMachineState.mockClear();
        w1.resolveExecute(E.left({
            sessionState: null,
            error: {type: ConfiguratorErrorType.ServerError} satisfies ServerError
        }));
        await expect(w1.resultPromise).rejects.toBeTruthy();
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Component);
        // Reject w2
        emittedMachineState.mockClear();
        w2.resolveExecute(E.left({
            sessionState: null,
            error: {type: ConfiguratorErrorType.ServerError} satisfies ServerError
        }));
        await expect(w2.resultPromise).rejects.toBeTruthy();
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Component);
        // Reject w3
        emittedMachineState.mockClear();
        w3.resolveExecute(E.left({
            sessionState: null,
            error: {type: ConfiguratorErrorType.ServerError} satisfies ServerError
        }));
        await expect(w3.resultPromise).rejects.toBeTruthy();
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Component);

        // Rejecting w4 should restore the initial Boolean attribute
        emittedMachineState.mockClear();
        w4.resolveExecute(E.left({
            sessionState: null,
            error: {type: ConfiguratorErrorType.ServerError} satisfies ServerError
        }));
        await expect(w4.resultPromise).rejects.toBeTruthy();
        expect(getLastEmittedState().sessionState.configuration.attributes.get(attributeId)!.type).toBe(AttributeType.Boolean);
    });

    it("Shutdown rejects all pending work", () => {
        sut.start();

        const w1 = createStateMutatingWorkItemDummy<number>(true);
        const w2 = createStateMutatingWorkItemDummy<number>(false);
        const w3 = createStatePreservingWorkItemDummy<number>();

        enqueueWork(w1.workItem, w2.workItem, w3.workItem);
        expectation.expectWorkInOrder([w1.workItem, w2.workItem, w3.workItem]);

        sut.send({type: "Shutdown"});

        expect(w1.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.TaskCancelled} satisfies TaskCancelled);
        expect(w2.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.TaskCancelled} satisfies TaskCancelled);
        expect(w3.resultPromise).rejects.toEqual({type: ConfiguratorErrorType.TaskCancelled} satisfies TaskCancelled);
    });

    it("Errors during executing reject promise", async () => {
        sut.start();

        const w1 = createStatePreservingWorkItem(() => () => {
            throw new Error("MappingError");
        })();
        const w2 = createStatePreservingWorkItem(() => () => () => {
            throw new Error("MappingError");
        })();

        enqueueWork(w1, w2);

        await expect(w1.deferredPromise.promise).rejects.toThrowError("MappingError");
        await expect(w2.deferredPromise.promise).rejects.toThrowError("MappingError");
    });

    describe("ScheduleTask", () => {
        it("Task resolves with right amount of pending tasks.", async () => {
            sut.start();

            const w1 = createStateMutatingWorkItemDummy<number>(true);
            const w2 = Session.scheduleTask(null);
            const w3 = createStateMutatingWorkItemDummy<number>(true);

            enqueueWork(w1.workItem, w2, w3.workItem);
            expectation.expectWorkInOrder([w1.workItem, w2, w3.workItem]);

            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);

            // Resolve the first WorkItem
            w1.resolveExecute(E.right({
                sessionState: sessionStateWithOneMandatoryNumeric as FullQualifiedConfigurationSessionState,
                result: 1
            }));
            await expect(w1.resultPromise).resolves.toBe(1);

            // WorkItem 3 is still pending
            await expect(w2.deferredPromise.promise).resolves.toEqual({pendingTasks: 1} satisfies ScheduleTaskResult);
        });

        it("Aborting the signal immediately rejects the promise.", async () => {
            sut.start();

            const abortController = new AbortController();
            const w1 = createStateMutatingWorkItemDummy<number>(true);
            const w2 = Session.scheduleTask(abortController.signal);

            enqueueWork(w1.workItem, w2);
            expectation.expectWorkInOrder([w1.workItem, w2]);

            // W1 must be executing.
            expect(sut.getSnapshot().context.workExecutionAttemptAmount).toHaveLength(1);

            // Abort the task and check that the reason is passed.
            abortController.abort("AbortReason");
            await expect(w2.deferredPromise.promise).rejects.toEqual("AbortReason");

            // The two WorkItems are still enqueued.
            expectation.expectWorkInOrder([w1.workItem, w2]);

            // If the first work is finished, the second work should also be removed from the queue because it was aborted previously.
            w1.resolveExecute(E.right({
                sessionState: sessionStateWithOneMandatoryNumeric as FullQualifiedConfigurationSessionState,
                result: 1
            }));
            await expect(w1.resultPromise).resolves.toBe(1);

            await waitForExpect(() => expectation.expectWorkInOrder([]));

            sut.send({type: "Shutdown"});
        });
    });
});