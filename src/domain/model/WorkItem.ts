import {DeferredPromise} from "p-defer";
import {TaskEither} from "@viamedici-spc/fp-ts-extensions";
import {Configuration} from "../../contract/Types";
import {ConfigurationSessionState} from "./ConfigurationSessionState";
import {ConfiguratorError} from "../../contract/ConfiguratorError";
import {EngineErrorResult, EngineSuccessResultT} from "../logic/EngineLogic";
import {Endomorphism} from "fp-ts/Endomorphism";

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