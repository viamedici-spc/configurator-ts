import {expect, vi} from "vitest";
import {guid} from "dyna-guid";
import pDefer, {DeferredPromise} from "p-defer";
import {
    ErrorWithSessionState,
    PureError,
    StateMutatingWorkItem,
    StatePreservingWorkItem
} from "../../src/domain/model/WorkItem";
import {Mock} from "vitest";
import {E, pipe, T} from "@viamedici-spc/fp-ts-extensions";
import {Either} from "fp-ts/Either";
import {ConfiguratorError} from "../../src";
import {EngineErrorResult, EngineSuccessResultT} from "../../src/domain/logic/EngineLogic";

export function createStatePreservingWorkItemDummy<T>(): {
    resolveExecute: (e: Either<ConfiguratorError, T>) => void,
    workItem: StatePreservingWorkItem<T>,
    resultPromise: Promise<T>,
    executeMock: Mock<StatePreservingWorkItem<T>["execute"]>
} {
    let executeResultPromise: DeferredPromise<T.ExtractTaskType<ReturnType<StatePreservingWorkItem<T>["execute"]>>> | null = null;
    const executeMock = vi.fn<StatePreservingWorkItem<T>["execute"]>(() => {
        executeResultPromise = pDefer();
        return () => {
            expect(executeResultPromise).toBeTruthy();

            return executeResultPromise!.promise;
        };
    });

    const workItem = {
        type: "StatePreserving",
        itemId: guid(),
        deferredPromise: pDefer<T>(),
        execute: executeMock
    } satisfies StatePreservingWorkItem<T>;

    return {
        resolveExecute: e => {
            expect(executeResultPromise).toBeTruthy();
            executeResultPromise!.resolve(pipe(e, E.mapLeft(l => ({
                type: "PureError",
                error: l
            } satisfies PureError))));
        },
        resultPromise: workItem.deferredPromise.promise,
        executeMock: executeMock,
        workItem: workItem
    };
}

export function createStateMutatingWorkItemDummy<T>(allowSimultaneouslyTermination: boolean, optimisticAttributeUpdater?: StateMutatingWorkItem<T>["optimisticAttributeUpdater"]): {
    resolveExecute: (e: Either<EngineErrorResult, EngineSuccessResultT<T>>) => void,
    workItem: StateMutatingWorkItem<T>,
    resultPromise: Promise<T>,
    executeMock: Mock<StateMutatingWorkItem<T>["execute"]>
} {
    let executeResultPromise: DeferredPromise<T.ExtractTaskType<ReturnType<StateMutatingWorkItem<T>["execute"]>>> | null = null;
    const executeMock = vi.fn<StateMutatingWorkItem<T>["execute"]>(() => {
        executeResultPromise = pDefer();
        return () => {
            expect(executeResultPromise).toBeTruthy();

            return executeResultPromise!.promise;
        };
    });

    const workItem = {
        type: "StateMutating",
        itemId: guid(),
        allowSimultaneouslyTermination: allowSimultaneouslyTermination,
        deferredPromise: pDefer<T>(),
        execute: executeMock,
        optimisticAttributeUpdater: optimisticAttributeUpdater ?? null
    } satisfies StateMutatingWorkItem<T>;

    return {
        resolveExecute: e => {
            expect(executeResultPromise).toBeTruthy();
            executeResultPromise!.resolve(pipe(e, E.mapLeft(l => ({
                ...l,
                type: "ErrorWithSessionState",
            } satisfies ErrorWithSessionState))));
        },
        resultPromise: workItem.deferredPromise.promise,
        executeMock: executeMock,
        workItem: workItem
    };
}