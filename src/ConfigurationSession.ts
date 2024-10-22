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
    SetManyMode,
    SetManyResult,
    Subscription as TSubscription,
    OnCanResetConfigurationChangedHandler
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
import {loadConfiguration} from "./domain/logic/ConfigurationStoring";
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
    calculateCanResetConfigurationChangedHandler
} from "./domain/logic/HandlerChangeCalculation";
import HashedConfiguration from "./domain/model/HashedConfiguration";
import GenericChangesHandler from "./domain/logic/GenericChangesHandler";
import {emptyChanges} from "./domain/logic/ConfigurationChanges";
import memize from "memize";

export default class ConfigurationSession implements IConfigurationSession {
    private readonly canResetConfigurationMemo = memize(hasAnyExplicitDecision, {maxSize: 5});
    private readonly calculateConfigurationChangedHandlerMemo = memize(calculateConfigurationChangedHandler, {maxSize: 5});
    private readonly getCollectedDecisionsMemo = memize(getCollectedDecisions);
    private readonly getImplicitCollectedDecisionsMemo = memize(flow(this.getCollectedDecisionsMemo.bind(this), RA.filter(collectedImplicitDecisionRefinement)));
    private readonly getExplicitCollectedDecisionsMemo = memize(flow(this.getCollectedDecisionsMemo.bind(this), RA.filter(collectedExplicitDecisionRefinement)));

    private readonly sessionChangesHandler = new GenericChangesHandler<HashedConfiguration, Parameters<OnConfigurationChangedHandler>>(this.calculateConfigurationChangedHandlerMemo.bind(this));
    private readonly configurationChangedSubscriptionHandler = new SubscriptionHandler<HashedConfiguration, Parameters<OnConfigurationChangedHandler>>(this.calculateConfigurationChangedHandlerMemo.bind(this));
    private readonly canResetConfigurationSubscriptionHandler = new SubscriptionHandler<ConfigurationRawData, Parameters<OnCanResetConfigurationChangedHandler>>(calculateCanResetConfigurationChangedHandler(this.canResetConfigurationMemo.bind(this)));
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

    getDecisions(kind: DecisionKind.Explicit): readonly CollectedExplicitDecision[];
    getDecisions(kind: DecisionKind.Implicit): readonly CollectedImplicitDecision[];
    getDecisions(): readonly CollectedDecision[];
    getDecisions(kind?: DecisionKind): readonly CollectedDecision[] {
        this.throwIfSessionClosed();

        const fn = match(kind)
            .with(DecisionKind.Explicit, () => this.getExplicitCollectedDecisionsMemo.bind(this))
            .with(DecisionKind.Implicit, () => this.getImplicitCollectedDecisionsMemo.bind(this))
            .with(P.nullish, () => this.getCollectedDecisionsMemo.bind(this))
            .exhaustive();
        return fn(this.sessionState.configurationRawData);
    }

    async storeConfiguration(): Promise<StoredConfiguration> {
        this.throwIfSessionClosed();

        const workItem = Session.storeConfiguration();

        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    async restoreConfiguration(storedConfiguration: StoredConfiguration, mode: SetManyMode): Promise<SetManyResult> {
        this.throwIfSessionClosed();

        const loadedConfiguration = loadConfiguration(storedConfiguration);
        if (E.isLeft(loadedConfiguration)) {
            throw loadedConfiguration.left;
        }

        const workItem = pipe(
            Session.setMany(loadedConfiguration.right, mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.restoreConfiguration ?? false)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    get canResetConfiguration(): boolean {
        this.throwIfSessionClosed();

        return this.canResetConfigurationMemo(this.sessionState.configurationRawData);
    }

    async resetConfiguration(): Promise<void> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.setMany([], {type: "DropExistingDecisions", conflictHandling: {type: "Automatic"}}),
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

    getSessionContext(): SessionContext {
        this.throwIfSessionClosed();

        return this.sessionState.sessionContext;
    }

    getConfiguration(): Configuration {
        this.throwIfSessionClosed();

        return this.sessionState.configuration;
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

    async applySolution(solution: ExplainSolution): Promise<SetManyResult> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.setMany(solution.decisions, solution.mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.applySolution ?? true)
        );
        this.actor.send({type: "EnqueueWork", workItem: workItem});

        return await workItem.deferredPromise.promise;
    }

    async setMany(decisions: readonly ExplicitDecision[], mode: SetManyMode): Promise<SetManyResult> {
        this.throwIfSessionClosed();

        const workItem = pipe(
            Session.setMany(decisions, mode),
            I.ap(this.sessionState.sessionContext.optimisticDecisionOptions?.setMany ?? true)
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

    private handleActorUpdate(state: Omit<MachineState, "type">) {
        this.sessionState = state.sessionState;

        this.sessionChangesHandler.setValue(this.sessionState.configuration);

        // First inform all listener about the change.
        this.configurationChangedSubscriptionHandler.notifyListeners(this.sessionState.configuration);
        this.canResetConfigurationSubscriptionHandler.notifyListeners(this.sessionState.configurationRawData);

        // Then resolve all waiting promises.
        resolveDeferredPromises(state.deferredPromiseCompletions);
    }

    private throwIfSessionClosed(): void {
        if (this.actor.getSnapshot().status !== "active") {
            throw {type: ConfiguratorErrorType.SessionClosed} satisfies SessionClosed;
        }
    }
};