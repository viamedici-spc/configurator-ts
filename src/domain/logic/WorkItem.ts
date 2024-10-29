import * as Engine from "./EngineLogic";
import pDefer from "p-defer";
import {flow, pipe, RA, TaskEither, TE} from "@viamedici-spc/fp-ts-extensions";
import {Configuration} from "../../contract/Types";
import {ConfigurationSessionState, FullQualifiedConfigurationSessionState} from "../model/ConfigurationSessionState";
import {reduceUpdateFunctions} from "../../crossCutting/UpdateFunctionHelper";
import {
    ErrorWithSessionState,
    PureError,
    StateMutatingWorkItem,
    StatePreservingWorkItem, WorkQueueInfo
} from "../model/WorkItem";
import {guid} from "dyna-guid";
import {ConfiguratorError, ConfiguratorErrorType, SessionNotFound} from "../../contract/ConfiguratorError";
import {match, P} from "ts-pattern";
import {EngineErrorResult, EngineSuccessResultT} from "./EngineLogic";
import {Endomorphism} from "fp-ts/Endomorphism";

const sessionNotFoundError = TE.left({type: ConfiguratorErrorType.SessionNotFound} satisfies SessionNotFound);

export function createStateMutatingWorkItem<T extends ReadonlyArray<unknown>, R>(session: (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<EngineErrorResult, EngineSuccessResultT<R>>, optimisticDecisions: ((...args: T) => RA.SingleOrArray<Endomorphism<Configuration>>) | null, allowSimultaneouslyTermination: boolean) {
    return (...args: T) => {
        const apSession = session(...args);
        const apOptimisticDecisions = optimisticDecisions ? optimisticDecisions(...args) : null;

        return (useOptimisticDecisions: boolean) => {
            return {
                type: "StateMutating",
                itemId: guid(),
                allowSimultaneouslyTermination: allowSimultaneouslyTermination,
                deferredPromise: pDefer(),
                execute: flow(apSession, TE.mapLeft(e => ({
                    ...e,
                    type: "ErrorWithSessionState"
                } satisfies ErrorWithSessionState))),
                optimisticAttributeUpdater: (useOptimisticDecisions && apOptimisticDecisions) ? pipe(
                    apOptimisticDecisions,
                    RA.fromSingleOrArray,
                    reduceUpdateFunctions
                ) : null
            } satisfies StateMutatingWorkItem<R>;
        };
    };
}

export function createStatePreservingWorkItem<T extends ReadonlyArray<unknown>, R>(session: (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<ConfiguratorError, R>) {
    return (...args: T) => {
        const apSession = session(...args);

        return {
            type: "StatePreserving",
            itemId: guid(),
            deferredPromise: pDefer(),
            execute: flow(apSession, TE.mapLeft(e => ({type: "PureError", error: e} satisfies PureError))),
        } satisfies StatePreservingWorkItem<R>;
    };
}

export function guardSession<T extends ReadonlyArray<unknown>, R>(session: (...args: T) => (sessionState: FullQualifiedConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<ConfiguratorError, R>): (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<ConfiguratorError, R> {
    return (...args) => {
        const apSession = session(...args);

        return (sessionState, workQueueInfo) =>
            match(sessionState)
                .with({sessionId: P.not(P.nullish)}, s => apSession(s, workQueueInfo))
                .otherwise(() => sessionNotFoundError);
    };
}

export function asUnit<T extends ReadonlyArray<unknown>, L>(session: (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<L, FullQualifiedConfigurationSessionState>): (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<L, Engine.EngineSuccessResultT<void>> {
    return (...args) => {
        const apSession = session(...args);

        return (sessionState, workQueueInfo) => pipe(
            apSession(sessionState, workQueueInfo),
            TE.map(r => ({
                sessionState: r,
                result: undefined,
            } satisfies Engine.EngineSuccessResultT<void>))
        );
    };
}

export function asLeftUnit<T extends ReadonlyArray<unknown>, R>(session: (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<ConfiguratorError, R>): (...args: T) => (sessionState: ConfigurationSessionState, workQueueInfo: WorkQueueInfo) => TaskEither<Engine.EngineErrorResult, R> {
    return (...args) => {
        const apSession = session(...args);

        return (sessionState, workQueueInfo) => pipe(
            apSession(sessionState, workQueueInfo),
            TE.mapLeft(l => ({
                error: l,
                sessionState: null,
            } satisfies Engine.EngineErrorResult))
        );
    };
}