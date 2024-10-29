import * as Engine from "./EngineLogic";
import * as Storing from "./ConfigurationStoring";
import * as OD from "./OptimisticDecisions";
import {E, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {asLeftUnit, asUnit, createStateMutatingWorkItem, createStatePreservingWorkItem, guardSession} from "./WorkItem";
import {ConfigurationSessionState, FullQualifiedConfigurationSessionState} from "../model/ConfigurationSessionState";
import {EngineSuccessResultT} from "./EngineLogic";
import {ScheduleTaskResult} from "../../contract/Types";
import {WorkItem, WorkQueueInfo} from "../model/WorkItem";

export const makeDecision = pipe(
    Engine.makeDecision,
    guardSession,
    asUnit,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, OD.makeDecision, true),
);
export const setMany = pipe(
    Engine.setMany,
    guardSession,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, OD.setMany, true),
);
export const setSessionContext = pipe(
    Engine.setSessionContext,
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const reinitialize = pipe(
    () => Engine.reinitialize,
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const explain = pipe(
    Engine.explain,
    guardSession,
    createStatePreservingWorkItem
);
export const storeConfiguration = pipe(
    () => (sessionState: ConfigurationSessionState) => TE.right(Storing.storeConfiguration(sessionState.configurationRawData)),
    createStatePreservingWorkItem
);
export const scheduleTask = (signal: AbortSignal | null | undefined): WorkItem<ScheduleTaskResult> => {
    const execute = () =>
        (sessionState: FullQualifiedConfigurationSessionState, workQueueInfo: WorkQueueInfo) =>
            () => {
                if (signal && signal.aborted) {
                    // The signal is aborted.
                    return Promise.reject(signal.reason);
                }

                return Promise.resolve(E.right({
                    sessionState: sessionState,
                    result: {
                        // Remove this task from the amount of queued work.
                        pendingTasks: workQueueInfo.queuedWork - 1
                    }
                } satisfies EngineSuccessResultT<ScheduleTaskResult>));
            };

    const workItem = pipe(
        execute,
        guardSession,
        asLeftUnit,
        f => createStateMutatingWorkItem(f, null, false)
    )()(false);

    if (signal) {
        const callback = () => {
            workItem.deferredPromise.reject(signal.reason);
            signal.removeEventListener("abort", callback);
        };
        signal.addEventListener("abort", callback);
    }

    return workItem;
};