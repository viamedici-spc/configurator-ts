import {
    CollectedDecision,
    Configuration,
    ConfigurationChanges,
    ConstraintsExplainAnswer,
    DecisionKind,
    DecisionsExplainAnswer,
    ExplainAnswer,
    ExplainQuestionParam,
    ExplainSolution,
    CollectedExplicitDecision,
    ExplicitDecision,
    FullExplainAnswer,
    CollectedImplicitDecision,
    OnConfigurationChangedHandler,
    SessionContext,
    SetManyResult,
    Subscription as TSubscription,
    OnCanResetConfigurationChangedHandler,
    ScheduleTaskResult,
    OnStoredConfigurationChangedHandler,
    OnDecisionsChangedHandler, MakeManyDecisionsResult, MakeManyDecisionsMode
} from "./contract/Types";
import IConfigurationSession from "./IConfigurationSession";
import {ConfigurationSessionState} from "./domain/model/ConfigurationSessionState";
import {Subscription, waitFor} from "xstate";
import * as Session from "./domain/logic/SessionLogic";
import {E, flow, I, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import * as RT from "fp-ts/ReadonlyTuple";
import {createWorkProcessingMachine, MachineState, resolveDeferredPromises} from "./domain/WorkProcessingMachine";
import {explainQuestionBuilder} from "./contract/ExplainQuestionBuilder";
import {ConfiguratorErrorType, SessionClosed} from "./contract/ConfiguratorError";
import {loadConfiguration, storeConfiguration} from "./domain/logic/ConfigurationStoring";
import {StoredConfiguration} from "./contract/storedConfiguration/StoredConfiguration";
import {getCollectedDecisions, hasAnyExplicitDecision} from "./domain/logic/ConfigurationRawData";
import {
    collectedExplicitDecisionRefinement,
    collectedImplicitDecisionRefinement
} from "./contract/refinements/CollectedDecisionRefinements";
import {match, P} from "ts-pattern";
import SubscriptionHandler from "./domain/logic/SubscriptionHandler";
import ConfigurationRawData from "./domain/model/ConfigurationRawData";
import {
    calculateConfigurationChangedHandler,
    calculateCanResetConfigurationChangedHandler,
    calculateStoredConfigurationChangedHandler,
    calculateCollectedDecisionsChangedHandler
} from "./domain/logic/HandlerChangeCalculation";
import HashedConfiguration from "./domain/model/HashedConfiguration";
import GenericChangesHandler from "./domain/logic/GenericChangesHandler";
import {emptyChanges} from "./domain/logic/ConfigurationChanges";
import memize from "memize";

export default class ConfigurationSession implements IConfigurationSession {
    private readonly canResetConfigurationMemo = memize(hasAnyExplicitDecision, {maxSize: 5});
    private readonly calculateConfigurationChangedHandlerMemo = memize(calculateConfigurationChangedHandler, {maxSize: 5});
    private readonly getCollectedDecisionsMemo = memize(getCollectedDecisions);
    private readonly getCollectedImplicitDecisionsMemo = memize(flow(this.getCollectedDecisionsMemo.bind(this), RA.filter(collectedImplicitDecisionRefinement)));
    private readonly getCollectedExplicitDecisionsMemo = memize(flow(this.getCollectedDecisionsMemo.bind(this), RA.filter(collectedExplicitDecisionRefinement)));
    private readonly getStoredConfigurationMemo = memize(flow(this.getCollectedExplicitDecisionsMemo.bind(this), storeConfiguration));

    private readonly sessionChangesHandler = new GenericChangesHandler<HashedConfiguration, Parameters<OnConfigurationChangedHandler>>(this.calculateConfigurationChangedHandlerMemo.bind(this));
    private readonly configurationChangedSubscriptionHandler = new SubscriptionHandler<HashedConfiguration, Parameters<OnConfigurationChangedHandler>>(this.calculateConfigurationChangedHandlerMemo.bind(this));
    private readonly canResetConfigurationSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnCanResetConfigurationChangedHandler>>(calculateCanResetConfigurationChangedHandler(this.canResetConfigurationMemo.bind(this)));
    private readonly storedConfigurationSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnStoredConfigurationChangedHandler>>(calculateStoredConfigurationChangedHandler(this.getStoredConfigurationMemo.bind(this)));
    private readonly decisionsSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnDecisionsChangedHandler<CollectedDecision>>>(calculateCollectedDecisionsChangedHandler(this.getCollectedDecisionsMemo.bind(this)));
    private readonly explicitDecisionsSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnDecisionsChangedHandler<CollectedExplicitDecision>>>(calculateCollectedDecisionsChangedHandler(this.getCollectedExplicitDecisionsMemo.bind(this)));
    private readonly implicitDecisionsSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnDecisionsChangedHandler<CollectedImplicitDecision>>>(calculateCollectedDecisionsChangedHandler(this.getCollectedImplicitDecisionsMemo.bind(this)));

    private readonly hashedConfigurationInputHandler: ReadonlyArray<(hashedConfiguration: HashedConfiguration) => void> = [
        this.sessionChangesHandler.setValue.bind(this.sessionChangesHandler),
        this.configurationChangedSubscriptionHandler.notifyListeners.bind(this.configurationChangedSubscriptionHandler),
    ];
    private readonly rawDataInputHandlers: ReadonlyArray<SubscriptionHandler<ConfigurationRawData, any>> = [
        this.canResetConfigurationSubscriptionHandler,
        this.storedConfigurationSubscriptionHandler,
        this.decisionsSubscriptionHandler,
        this.explicitDecisionsSubscriptionHandler,
        this.implicitDecisionsSubscriptionHandler,
    ];

    private readonly actor: ReturnType<typeof createWorkProcessingMachine>;
    private readonly subscription: Subscription;

    // Will be set in constructor by call to handleActorUpdate.
    public sessionState: ConfigurationSessionState = null as any;

    constructor(initialSessionState: ConfigurationSessionState) {
        this.handleActorUpdate({sessionState: initialSessionState, deferredPromiseCompletions: RA.empty});

        this.actor = createWorkProcessingMachine(initialSessionState);
        this.subscription = this.actor.on("MachineState", state => {
            this.handleActorUpdate(state);
        });
        this.actor.start();
    }

    getDecisions(kind: DecisionKind.Explicit): ReadonlyArray<CollectedExplicitDecision>;
    getDecisions(kind: DecisionKind.Explicit, queue: true): Promise<ReadonlyArray<CollectedExplicitDecision>>;
    getDecisions(kind: DecisionKind.Implicit): ReadonlyArray<CollectedImplicitDecision>;
    getDecisions(kind: DecisionKind.Implicit, queue: true): Promise<ReadonlyArray<CollectedImplicitDecision>>;
    getDecisions(): ReadonlyArray<CollectedDecision>;
    getDecisions(queue: true): Promise<ReadonlyArray<CollectedDecision>>;
    getDecisions(kindOrQueueOrUndefined?: DecisionKind | boolean, queueOrUndefined?: true): ReadonlyArray<CollectedDecision> | Promise<ReadonlyArray<CollectedDecision>> {
        const execute = (kind: DecisionKind | undefined) => {
            this.throwIfSessionClosed();

            const fn = match(kind)
                .with(DecisionKind.Explicit, () => this.getCollectedExplicitDecisionsMemo.bind(this))
                .with(DecisionKind.Implicit, () => this.getCollectedImplicitDecisionsMemo.bind(this))
                .with(P.nullish, () => this.getCollectedDecisionsMemo.bind(this))
                .exhaustive();
            return fn(this.sessionState.configurationRawData);
        };

        const kind = typeof kindOrQueueOrUndefined === "string" ? kindOrQueueOrUndefined : undefined;
        const queue = typeof kindOrQueueOrUndefined === "boolean"
            ? kindOrQueueOrUndefined
            : queueOrUndefined;

        return this.executeMaybeQueued(queue === true, () => execute(kind));
    }

    async storeConfiguration(): Promise<StoredConfiguration> {
        return this.executeMaybeQueued(true, () => {
            this.throwIfSessionClosed();

            return this.getStoredConfigurationMemo(this.sessionState.configurationRawData);
        });
    }

    async restoreConfiguration(storedConfiguration: StoredConfiguration, mode: MakeManyDecisionsMode): Promise<MakeManyDecisionsResult> {
        this.throwIfSessionClosed();

        const loadedConfiguration = loadConfiguration(storedConfiguration);
        if (E.isLeft(loadedConfiguration)) {
            throw loadedConfiguration.left;
        }

        const workItem = pipe(
            Session.makeManyDecisions(loadedConfiguration.right, mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.restoreConfiguration ?? false)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    canResetConfiguration(): boolean;
    canResetConfiguration(queue: true): Promise<boolean>;
    canResetConfiguration(queue?: true): Promise<boolean> | boolean {
        return this.executeMaybeQueued(queue === true, () => {
            this.throwIfSessionClosed();

            return this.canResetConfigurationMemo(this.sessionState.configurationRawData);
        });
    }

    async resetConfiguration(): Promise<void> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.makeManyDecisions([], {type: "DropExistingDecisions", conflictHandling: {type: "Automatic"}}),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.resetConfiguration ?? false)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        await workItem.deferredPromise.promise;
    }

    addConfigurationChangedListener(handler: OnConfigurationChangedHandler): TSubscription {
        this.throwIfSessionClosed();

        return this.configurationChangedSubscriptionHandler.addListener(handler);
    }

    addCanResetConfigurationChangedListener(handler: OnCanResetConfigurationChangedHandler): TSubscription {
        this.throwIfSessionClosed();

        return this.canResetConfigurationSubscriptionHandler.addListener(handler);
    }

    addStoredConfigurationChangedListener(handler: OnStoredConfigurationChangedHandler): TSubscription {
        this.throwIfSessionClosed();

        return this.storedConfigurationSubscriptionHandler.addListener(handler);
    }

    addDecisionsChangedListener(kind: DecisionKind.Explicit, handler: OnDecisionsChangedHandler<CollectedExplicitDecision>): TSubscription;
    addDecisionsChangedListener(kind: DecisionKind.Implicit, handler: OnDecisionsChangedHandler<CollectedImplicitDecision>): TSubscription;
    addDecisionsChangedListener(handler: OnDecisionsChangedHandler<CollectedDecision>): TSubscription;
    addDecisionsChangedListener(kindOrHandler: DecisionKind | OnDecisionsChangedHandler<CollectedDecision>, handlerOrUndefined?: OnDecisionsChangedHandler<CollectedExplicitDecision> | OnDecisionsChangedHandler<CollectedImplicitDecision>): TSubscription {
        this.throwIfSessionClosed();

        const kind = typeof kindOrHandler === "string" ? kindOrHandler : undefined;
        const handler = typeof kindOrHandler !== "string" ? kindOrHandler : handlerOrUndefined;
        if (handler == null) {
            throw new Error("The handler is null or undefined");
        }

        if (kind === DecisionKind.Explicit) {
            return this.explicitDecisionsSubscriptionHandler.addListener(handler as OnDecisionsChangedHandler<CollectedExplicitDecision>);
        }
        if (kind === DecisionKind.Implicit) {
            return this.implicitDecisionsSubscriptionHandler.addListener(handler as OnDecisionsChangedHandler<CollectedImplicitDecision>);
        }
        return this.decisionsSubscriptionHandler.addListener(handler as OnDecisionsChangedHandler<CollectedDecision>);
    }

    getSessionContext(): SessionContext
    getSessionContext(queue: true): Promise<SessionContext>;
    getSessionContext(queue?: true): Promise<SessionContext> | SessionContext {
        return this.executeMaybeQueued(queue === true, () => {
            this.throwIfSessionClosed();

            return this.sessionState.sessionContext;
        });
    }

    getConfiguration(): Configuration
    getConfiguration(queue: true): Promise<Configuration>
    getConfiguration(queue?: true): Promise<Configuration> | Configuration {
        return this.executeMaybeQueued(queue === true, () => {
            this.throwIfSessionClosed();

            return this.sessionState.configuration;
        });
    }

    getConfigurationChanges(): ConfigurationChanges {
        this.throwIfSessionClosed();

        return pipe(
            this.sessionChangesHandler.getChanges(),
            O.map(RT.snd),
            O.getOrElse(() => emptyChanges)
        );
    }

    clearConfigurationChanges(): void {
        this.throwIfSessionClosed();

        this.sessionChangesHandler.clearChanges();
    }

    async makeDecision(decision: ExplicitDecision): Promise<void> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            decision,
            Session.makeDecision,
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.makeDecision ?? true)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        await workItem.deferredPromise.promise;
    }

    async applySolution(solution: ExplainSolution): Promise<MakeManyDecisionsResult> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.makeManyDecisions(solution.decisions, solution.mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.applySolution ?? true)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    setMany(decisions: readonly ExplicitDecision[], mode: MakeManyDecisionsMode): Promise<SetManyResult> {
        return this.makeManyDecisions(decisions, mode);
    }

    async makeManyDecisions(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode): Promise<MakeManyDecisionsResult> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.makeManyDecisions(decisions, mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.makeManyDecisions ?? true)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    async setSessionContext(sessionContext: SessionContext): Promise<void> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            sessionContext,
            Session.setSessionContext,
            I.ap(false)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        await workItem.deferredPromise.promise;
    }

    async reinitialize(): Promise<void> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.reinitialize(),
            I.ap(false)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        await workItem.deferredPromise.promise;
    }

    explain(question: ExplainQuestionParam, answerType: "decisions"): Promise<DecisionsExplainAnswer>;
    explain(question: ExplainQuestionParam, answerType: "constraints"): Promise<ConstraintsExplainAnswer>;
    explain(question: ExplainQuestionParam, answerType: "full"): Promise<FullExplainAnswer>;
    async explain(question: ExplainQuestionParam, answerType: "decisions" | "constraints" | "full"): Promise<ExplainAnswer> {
        this.throwIfSessionClosed();

        const q = typeof question === "function" ? question(explainQuestionBuilder) : question;
        const workItem = Session.explain(q, answerType);

        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    async close(): Promise<void> {
        if (this.actor.getSnapshot().status !== "active") {
            return;
        }

        this.subscription.unsubscribe();
        this.actor.send({type: "Shutdown"});
        await waitFor(this.actor, s => s.status !== "active");
        this.configurationChangedSubscriptionHandler.unsubscribeAllListeners();
    }

    async scheduleTask(signal?: AbortSignal | null): Promise<ScheduleTaskResult> {
        this.throwIfSessionClosed();

        const workItem = Session.scheduleTask(signal);

        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    executeMaybeQueued<T>(queue: boolean, fn: () => T, signal?: AbortSignal | null): Promise<T> | T {
        this.throwIfSessionClosed();

        if (queue) {
            return this.scheduleTask(signal)
                .then(() => fn());
        }
        return fn();
    }

    private handleActorUpdate(state: Omit<MachineState, "type">) {
        this.sessionState = state.sessionState;

        // First inform all handler about the change.
        this.hashedConfigurationInputHandler.forEach(fn => fn(this.sessionState.configuration));
        this.rawDataInputHandlers.forEach(sh => sh.notifyListeners(this.sessionState.configurationRawData));

        // Then resolve all waiting promises.
        resolveDeferredPromises(state.deferredPromiseCompletions);
    }

    private throwIfSessionClosed(): void {
        if (this.actor.getSnapshot().status !== "active") {
            throw {type: ConfiguratorErrorType.SessionClosed} satisfies SessionClosed;
        }
    }
};