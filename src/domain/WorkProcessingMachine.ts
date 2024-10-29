import {ActorRefFromLogic, assign, createActor, DoneActorEvent, enqueueActions, fromPromise, log, setup} from "xstate";
import {ConfigurationSessionState, FullQualifiedConfigurationSessionState} from "./model/ConfigurationSessionState";
import {
    ErrorWithSessionState,
    PureError,
    StateMutatingWorkItem,
    StatePreservingWorkItem,
    WorkItem, WorkQueueInfo
} from "./model/WorkItem";
import {E, O, Ord, OrdT, pipe, RA, RM, RNEA, Str, T, Task, TE} from "@viamedici-spc/fp-ts-extensions";
import {Either} from "fp-ts/Either";
import {ConfiguratorError, ConfiguratorErrorType, SessionNotFound, TaskCancelled} from "../contract/ConfiguratorError";
import * as Engine from "./logic/EngineLogic";
import {EngineSuccessResultT} from "./logic/EngineLogic";
import {DeferredPromise} from "p-defer";
import {Configuration} from "../contract/Types";
import {toHashedConfiguration} from "./logic/Configuration";

export type EnqueueWorkEvent = {
    type: "EnqueueWork",
    workItem: WorkItem<any>
};
export type ShutdownEvent = {
    type: "Shutdown",
};

export type DeferredPromiseCompletion = {
    deferredPromise: DeferredPromise<any>,
    result: Either<ConfiguratorError, any>
};

export type MachineState = {
    type: "MachineState";
    deferredPromiseCompletions: ReadonlyArray<DeferredPromiseCompletion>;
    sessionState: ConfigurationSessionState;
};

export const resolveDeferredPromises = (deferredPromiseCompletions: ReadonlyArray<DeferredPromiseCompletion>) => {
    deferredPromiseCompletions.forEach(d => {
        pipe(
            d.result,
            E.doIfRight(r => () => {
                d.deferredPromise.resolve(r);
            }),
            E.doIfLeft(l => () => {
                d.deferredPromise.reject(l);
            })
        );
    });
};

type StateMutatingExecuteResult = ReturnType<StateMutatingWorkItem<any>["execute"]>
type StatePreservingExecuteResult = ReturnType<StatePreservingWorkItem<any>["execute"]>
type StateMutatingExecuteResultEither = T.ExtractTaskType<StateMutatingExecuteResult>
type StatePreservingExecuteResultEither = T.ExtractTaskType<StatePreservingExecuteResult>
type RunTaskInput = {
    workItemId: string,
    run: () => Task<StateMutatingExecuteResultEither | StatePreservingExecuteResultEither>
};
type RunTaskResult = {
    workItemId: string,
    result: Either<unknown, Either<ErrorWithSessionState | PureError, EngineSuccessResultT<any> | any>>
};
const runTask = fromPromise<RunTaskResult, RunTaskInput>(({input}) => {
        return pipe(
            E.tryCatch(input.run, e => e),
            TE.fromEither,
            TE.chain(task => TE.tryCatch(task, e => e)),
            T.map(e => ({
                workItemId: input.workItemId,
                result: e
            } satisfies RunTaskResult))
        )();
    }
);

const isStatePreservingWorkItem = (w: WorkItem<any>): w is StatePreservingWorkItem<any> => w.type === "StatePreserving";
const isStateMutatingWorkItem = (w: WorkItem<any>): w is StateMutatingWorkItem<any> => w.type === "StateMutating";

const sessionNotFoundError: SessionNotFound = {
    type: ConfiguratorErrorType.SessionNotFound
};
const taskCancelledError: TaskCancelled = {type: ConfiguratorErrorType.TaskCancelled};

const workProcessingMachine = setup({
    types: {
        input: {} as { sessionState: ConfigurationSessionState },
        context: {} as {
            sessionState: ConfigurationSessionState,
            work: ReadonlyArray<WorkItem<any>>,
            runningWork: ReadonlyMap<string, ActorRefFromLogic<typeof runTask>>,
            workExecutionAttemptAmount: ReadonlyMap<string, number>,
            deferredPromiseCompletions: ReadonlyArray<DeferredPromiseCompletion>,
        },
        events: {} as EnqueueWorkEvent | ShutdownEvent | DoneActorEvent,
        emitted: {} as MachineState
    },
    guards: {
        isSessionNotFoundProblem: ({}, {result}: RunTaskResult) => pipe(
            result,
            E.match(() => false, E.match(l => l.error.type === "SessionNotFound", () => false))
        )
    },
    actors: {
        runTask: runTask,
        createSessionWithData: fromPromise<Either<ConfiguratorError, ConfigurationSessionState>, ConfigurationSessionState>(({input}) =>
            Engine.createSessionWithData(input.sessionContext, input.configurationRawData)())
    },
    actions: {
        emitState: enqueueActions(({context, enqueue}) => {
            const externalConfiguration = toHashedConfiguration(
                context.work
                    .filter(isStateMutatingWorkItem)
                    .reduce((xs, w) => w.optimisticAttributeUpdater ? w.optimisticAttributeUpdater(xs) : xs, context.sessionState.configuration as Configuration)
            );

            enqueue.assign({
                deferredPromiseCompletions: RA.empty
            });
            enqueue.emit({
                type: "MachineState",
                sessionState: {
                    ...context.sessionState,
                    configuration: externalConfiguration,
                },
                deferredPromiseCompletions: context.deferredPromiseCompletions
            });
        }),
        spawnWork: enqueueActions(({context, enqueue}) => {
            const workToRun = pipe(
                context.work,
                RNEA.fromReadonlyArray,
                O.map(a => pipe(
                    a,
                    RNEA.head,
                    O.fromPredicate(isStateMutatingWorkItem),
                    O.map(RA.of<WorkItem<any>>),
                    O.getOrElse<ReadonlyArray<WorkItem<any>>>(() => pipe(
                        a,
                        RA.takeLeftWhile(isStatePreservingWorkItem),
                    ))
                )),
                O.getOrElse(() => RA.empty as ReadonlyArray<WorkItem<any>>)
            );
            const queueInfo: WorkQueueInfo = {
                queuedWork: context.work.length,
                currentlyRunningWork: workToRun.length,
            };
            workToRun.forEach(w => {
                if (!RM.member(Str.Eq)(w.itemId, context.runningWork)) {
                    enqueue.assign({
                        // Increase execution attempts
                        workExecutionAttemptAmount: ({context}) => pipe(
                            context.workExecutionAttemptAmount,
                            RM.addOrUpdate<string, number>(Str.Eq)(w.itemId, () => 1, i => i + 1)
                        ),
                        runningWork: ({context, spawn}) => pipe(
                            context.runningWork,
                            RM.upsertAt(Str.Eq)(w.itemId, spawn("runTask", {
                                input: {
                                    workItemId: w.itemId,
                                    run: () => w.execute(context.sessionState, queueInfo)
                                }
                            }))
                        )
                    });
                }
            });
        }),
        answerAndRemoveWork: enqueueActions(({context, enqueue}, params: {
            workItemId: string,
            result: Either<ConfiguratorError, any>
        }) => {
            const work = pipe(context.work, RA.findFirst(w => w.itemId === params.workItemId), O.toNullable);
            // Remove work from every collection.
            enqueue.assign({
                work: ({context}) => pipe(context.work, RA.filter(w => w.itemId !== params.workItemId)),
                runningWork: ({context}) => pipe(context.runningWork, RM.deleteAt(Str.Eq)(params.workItemId)),
                workExecutionAttemptAmount: ({context}) => pipe(context.workExecutionAttemptAmount, RM.deleteAt(Str.Eq)(params.workItemId)),
            });
            if (work) {
                enqueue.assign({
                    deferredPromiseCompletions: ({context}) => pipe(
                        context.deferredPromiseCompletions,
                        RA.append({
                            deferredPromise: work.deferredPromise,
                            result: params.result
                        })
                    )
                });
            }
        }),
        cancelAllRunningWork: enqueueActions(({context, enqueue}) => {
            if (context.runningWork.size > 0) {
                enqueue(log(`Cancelling ${context.runningWork.size} running work${context.runningWork.size !== 1 ? "s" : ""}`));
            }

            context.runningWork.forEach(v => {
                enqueue.stopChild(v);
            });
            enqueue.assign({
                runningWork: RM.empty
            });
        })
    }
})
    .createMachine({
        context: ({input}) => ({
            sessionState: input.sessionState,
            work: RA.empty,
            runningWork: RM.empty,
            workExecutionAttemptAmount: RM.empty,
            deferredPromiseCompletions: RA.empty,
        }),
        entry: [
            "emitState"
        ],
        on: {
            EnqueueWork: {
                actions: [
                    assign({
                        work: ({context, event}) => RA.append(event.workItem)(context.work)
                    }),
                    "emitState"
                ]
            },
            Shutdown: {
                target: "#shutdown",
            }
        },
        initial: "processing",
        states: {
            processing: {
                always: {
                    actions: [
                        "spawnWork"
                    ]
                },
                on: {
                    "xstate.done.actor.*": [
                        {
                            target: "restoreSession",
                            guard: {
                                type: "isSessionNotFoundProblem",
                                params: ({event}) => event.output as RunTaskResult
                            },
                            actions: [
                                log("Work resulted in SessionNotFound"),
                                "cancelAllRunningWork",
                                enqueueActions(({enqueue, event}) => {
                                    const {result} = event.output as RunTaskResult;
                                    pipe(
                                        result,
                                        E.doIfRight(r => () => pipe(
                                            r,
                                            E.doIfLeft(l => () => {
                                                if (l.type === "ErrorWithSessionState" && l.sessionState) {
                                                    enqueue.assign({
                                                        sessionState: l.sessionState
                                                    });
                                                }
                                            })
                                        ))
                                    );
                                })
                            ]
                        },
                        {
                            actions: [
                                enqueueActions(({context, enqueue, event}) => {
                                    const taskResult = event.output as RunTaskResult;
                                    const work = pipe(context.work, RA.findFirst(w => w.itemId === taskResult.workItemId), O.toNullable);
                                    const runningWork = context.runningWork.get(taskResult.workItemId);

                                    // Check if result is valid and must not be discarded.
                                    if (work && runningWork && event.actorId === runningWork.id) {
                                        if (E.isLeft(taskResult.result)) {
                                            enqueue({
                                                type: "answerAndRemoveWork",
                                                params: {
                                                    workItemId: work.itemId,
                                                    result: E.left(taskResult.result.left as ConfiguratorError)
                                                }
                                            });
                                        } else {
                                            const right = taskResult.result.right;
                                            if (work.type === "StateMutating") {
                                                const tr = right as StateMutatingExecuteResultEither;
                                                pipe(
                                                    tr,
                                                    E.doIfRight(r => () => {
                                                        enqueue.assign({
                                                            sessionState: r.sessionState
                                                        });
                                                    }),
                                                    E.doIfLeft(l => () => {
                                                        if (l.sessionState) {
                                                            enqueue.assign({
                                                                sessionState: l.sessionState
                                                            });
                                                        }
                                                    })
                                                );
                                                enqueue({
                                                    type: "answerAndRemoveWork",
                                                    params: {
                                                        workItemId: work.itemId,
                                                        result: pipe(tr, E.map(r => r.result), E.mapLeft(l => l.error))
                                                    }
                                                });
                                            } else {
                                                const tr = right as StatePreservingExecuteResultEither;
                                                enqueue({
                                                    type: "answerAndRemoveWork",
                                                    params: {
                                                        workItemId: work.itemId,
                                                        result: pipe(tr, E.mapLeft(l => l.error))
                                                    }
                                                });
                                            }
                                        }
                                    }

                                    enqueue("emitState");
                                })
                            ]
                        }
                    ]
                }
            },
            restoreSession: {
                entry: [
                    assign({
                        sessionState: ({context}) => ({
                            ...context.sessionState,
                            sessionId: undefined
                        })
                    }),
                    enqueueActions(({context, enqueue}) => {
                        // Cancel work that have exceeded their execution attempts.
                        const workToCancel = pipe(
                            context.workExecutionAttemptAmount,
                            RM.filter(a => a > 1),
                            RM.keys(Ord.trivial as OrdT<string>),
                        );
                        workToCancel.forEach(w => {
                            enqueue({
                                type: "answerAndRemoveWork",
                                params: {workItemId: w, result: E.left(sessionNotFoundError)}
                            });
                        });
                    }),
                    "emitState"
                ],
                invoke: {
                    src: "createSessionWithData",
                    input: ({context}) => context.sessionState,
                    onDone: {
                        target: "processing",
                        actions: [
                            enqueueActions(({context, event, enqueue}) => {
                                pipe(
                                    event.output,
                                    E.doIfRight(r => () => {
                                        enqueue.assign({
                                            sessionState: r
                                        });
                                    }),
                                    E.doIfLeft(l => () => {
                                        enqueue(log("Can't restore session because of error: " + JSON.stringify(l)));

                                        const simultaneouslyCancelableWork = pipe(
                                            context.work,
                                            RA.takeLeftWhile(w => w.type === "StatePreserving" || w.allowSimultaneouslyTermination)
                                        );
                                        simultaneouslyCancelableWork.forEach(w => {
                                            enqueue({
                                                type: "answerAndRemoveWork",
                                                params: {workItemId: w.itemId, result: E.left(sessionNotFoundError)}
                                            });
                                        });
                                    })
                                );
                            }),
                            "emitState"
                        ]
                    },
                    onError: {
                        target: "processing",
                        actions: [
                            log("An unexpected error occurred while trying to restore the session.")
                        ]
                    }
                }
            },
            shutdown: {
                type: "final",
                id: "shutdown",
                entry: [
                    "cancelAllRunningWork",
                    enqueueActions(({context, enqueue}) => {
                        const error = E.left(taskCancelledError);
                        context.work.forEach(w => {
                            enqueue({type: "answerAndRemoveWork", params: {workItemId: w.itemId, result: error}});
                        });

                        if (context.sessionState.sessionId) {
                            const fullQualifiedSessionState: FullQualifiedConfigurationSessionState = {
                                ...context.sessionState,
                                sessionId: context.sessionState.sessionId
                            };
                            enqueue(() => {
                                Engine.closeSession(fullQualifiedSessionState)()
                                    .then(() => {
                                    }, () => {
                                    });
                            });
                        }
                    }),
                    "emitState"
                ]
            }
        }
    });

export function createWorkProcessingMachine(initialSessionState: ConfigurationSessionState) {
    return createActor(workProcessingMachine, {
        input: {
            sessionState: initialSessionState
        }
    });
}