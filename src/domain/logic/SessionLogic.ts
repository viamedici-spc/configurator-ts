import * as Engine from "./EngineLogic";
import * as OD from "./OptimisticDecisions";
import {E, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {asLeftUnit, asUnit, createStateMutatingWorkItem, createStatePreservingWorkItem, guardSession} from "./WorkItem";
import {ConfigurationSessionState, FullQualifiedConfigurationSessionState} from "../model/ConfigurationSessionState";
import {EngineSuccessResultT} from "./EngineLogic";
import {ExplicitDecision, MakeManyDecisionsMode, MakeManyDecisionsResult, ScheduleTaskResult} from "../../contract/Types";
import {WorkItem, WorkQueueInfo} from "../model/WorkItem";

export const makeDecision = pipe(
    Engine.makeDecision,
    guardSession,
    asUnit,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, OD.makeDecision, true),
);
type MakeManyDecisionsArgs = [
    decisions: ReadonlyArray<ExplicitDecision>,
    mode: MakeManyDecisionsMode,
    onScopedWrite: (state: FullQualifiedConfigurationSessionState) => void
];
export const makeManyDecisions = pipe(
    Engine.makeManyDecisions,
    guardSession,
    asLeftUnit,
    write => createStateMutatingWorkItem<MakeManyDecisionsArgs, MakeManyDecisionsResult>((decisions, mode, onScopedWrite) => {
        const execute = write(decisions, mode);
        return (state, info) => pipe(
            execute(state, info),
            TE.map(batch => {
                // A skipped write returns the original state.
                if (batch.sessionState !== state && batch.sessionState.activeAttributes != null) onScopedWrite(batch.sessionState);
                return batch;
            })
        );
    }, OD.makeManyDecisions, true),
);
const applyScopedDecisionRefreshState = (
    expected: FullQualifiedConfigurationSessionState, refreshed: FullQualifiedConfigurationSessionState,
    isLatest: () => boolean, retry: (state: FullQualifiedConfigurationSessionState) => void
) => (state: FullQualifiedConfigurationSessionState) => {
    if (!isLatest() || state.sessionId !== expected.sessionId || state.activeAttributes == null) {
        return TE.right(state);
    }
    // Only the serialized queue can confirm that no newer write changed the snapshot.
    if (state.configurationRawData !== expected.configurationRawData) {
        retry(state);
        return TE.right(state);
    }
    return TE.right(refreshed);
};
export const applyScopedDecisionRefresh = pipe(
    applyScopedDecisionRefreshState,
    guardSession,
    asUnit,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const setSessionContext = pipe(
    Engine.setSessionContext,
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const reinitialize = pipe(
    () => (sessionState: ConfigurationSessionState) => Engine.reinitialize(sessionState),
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const explain = pipe(
    Engine.explain,
    guardSession,
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
export const setActiveAttributes = pipe(
    Engine.setActiveAttributes,
    guardSession,
    asUnit,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
