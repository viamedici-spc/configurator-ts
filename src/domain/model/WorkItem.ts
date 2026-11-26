import type {DeferredPromise} from "p-defer";
import type {TaskEither} from "@viamedici-spc/fp-ts-extensions";
import type {Configuration} from "../../contract/Types";
import type {ConfigurationSessionState} from "./ConfigurationSessionState";
import type {ConfiguratorError} from "../../contract/ConfiguratorError";
import type {EngineErrorResult, EngineSuccessResultT} from "../logic/EngineLogic";
import type {Endomorphism} from "fp-ts/Endomorphism";

export type PureError = {
    type: "PureError";
    error: ConfiguratorError;
};
export type ErrorWithSessionState = {
    type: "ErrorWithSessionState"
} & EngineErrorResult;

export type WorkQueueInfo = {
    queuedWork: number;
    currentlyRunningWork: number;
};

export type StateMutatingWorkItem<T> = {
    type: "StateMutating";
    itemId: string;
    // Whether this WorkItem allow to be rejected once a previous or parallel running WorkItem rejects with SessionNotFound.
    allowSimultaneouslyTermination: boolean;
    deferredPromise: DeferredPromise<T>;
    optimisticAttributeUpdater: Endomorphism<Configuration> | null,
    execute: (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<ErrorWithSessionState, EngineSuccessResultT<T>>,
};

export type StatePreservingWorkItem<T> = {
    type: "StatePreserving";
    itemId: string;
    deferredPromise: DeferredPromise<T>;
    execute: (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<PureError, T>,
};

export type WorkItem<T> = StateMutatingWorkItem<T> | StatePreservingWorkItem<T>;