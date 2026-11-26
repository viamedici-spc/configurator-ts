import {expect, mock} from "bun:test";
import {guid} from "dyna-guid";
import type {DeferredPromise} from "p-defer";
import pDefer from "p-defer";
import type {
    ErrorWithSessionState,
    PureError,
    StateMutatingWorkItem,
    StatePreservingWorkItem,
} from "../../src/domain/model/WorkItem";
import type {Mock} from "bun:test";
import type {T} from "@viamedici-spc/fp-ts-extensions";
import {E, pipe} from "@viamedici-spc/fp-ts-extensions";
import type {Either} from "fp-ts/Either";
import type {ConfiguratorError} from "../../src";
import type {EngineErrorResult, EngineSuccessResultT} from "../../src/domain/logic/EngineLogic";

export function createStatePreservingWorkItemDummy<T>(): {
    resolveExecute: (e: Either<ConfiguratorError, T>) => void;
    workItem: StatePreservingWorkItem<T>;
    resultPromise: Promise<T>;
    executeMock: Mock<StatePreservingWorkItem<T>["execute"]>;
} {
    let executeResultPromise: DeferredPromise<
        T.ExtractTaskType<ReturnType<StatePreservingWorkItem<T>["execute"]>>
    > | null = null;
    const executeMock = mock<StatePreservingWorkItem<T>["execute"]>(() => {
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
        execute: executeMock,
    } satisfies StatePreservingWorkItem<T>;

    return {
        resolveExecute: e => {
            expect(executeResultPromise).toBeTruthy();
            executeResultPromise!.resolve(
                pipe(
                    e,
                    E.mapLeft(
                        l =>
                            ({
                                type: "PureError",
                                error: l,
                            }) satisfies PureError,
                    ),
                ),
            );
        },
        resultPromise: handledLater(workItem.deferredPromise.promise),
        executeMock: executeMock,
        workItem: workItem,
    };
}

export function createStateMutatingWorkItemDummy<T>(
    allowSimultaneouslyTermination: boolean,
    optimisticAttributeUpdater?: StateMutatingWorkItem<T>["optimisticAttributeUpdater"],
): {
    resolveExecute: (e: Either<EngineErrorResult, EngineSuccessResultT<T>>) => void;
    workItem: StateMutatingWorkItem<T>;
    resultPromise: Promise<T>;
    executeMock: Mock<StateMutatingWorkItem<T>["execute"]>;
} {
    let executeResultPromise: DeferredPromise<
        T.ExtractTaskType<ReturnType<StateMutatingWorkItem<T>["execute"]>>
    > | null = null;
    const executeMock = mock<StateMutatingWorkItem<T>["execute"]>(() => {
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
        optimisticAttributeUpdater: optimisticAttributeUpdater ?? null,
    } satisfies StateMutatingWorkItem<T>;

    return {
        resolveExecute: e => {
            expect(executeResultPromise).toBeTruthy();
            executeResultPromise!.resolve(
                pipe(
                    e,
                    E.mapLeft(
                        l =>
                            ({
                                ...l,
                                type: "ErrorWithSessionState",
                            }) satisfies ErrorWithSessionState,
                    ),
                ),
            );
        },
        resultPromise: handledLater(workItem.deferredPromise.promise),
        executeMock: executeMock,
        workItem: workItem,
    };
}

/**
 * Marks a work item's promise as handled, because a test often asserts its rejection only after it happened. bun test,
 * unlike Vitest, fails a test on a rejection that has no handler yet; the promise itself stays rejected for the
 * assertion.
 */
export function handledLater<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => undefined);
    return promise;
}