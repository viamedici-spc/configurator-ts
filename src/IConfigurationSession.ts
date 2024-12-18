import {
    Configuration,
    ConstraintsExplainAnswer,
    DecisionsExplainAnswer,
    ExplicitDecision,
    FullExplainAnswer,
    SessionContext,
    ExplainSolution,
    OnConfigurationChangedHandler,
    ConfigurationChanges,
    ExplainQuestionParam,
    Subscription,
    CollectedDecision,
    DecisionKind,
    CollectedImplicitDecision,
    CollectedExplicitDecision,
    OnCanResetConfigurationChangedHandler,
    ScheduleTaskResult,
    OnStoredConfigurationChangedHandler,
    OnDecisionsChangedHandler,
    MakeManyDecisionsResult,
    MakeManyDecisionsMode
} from "./contract/Types";
import {ConfiguratorError, SessionClosed, TaskCancelled, MakeManyDecisionsConflict} from "./contract/ConfiguratorError";
import {StoredConfiguration} from "./contract/storedConfiguration/StoredConfiguration";

export default interface IConfigurationSession {
    /**
     * Adds a listener that reacts to changes in the Configuration during specific operations.
     * Once registered, the handler is immediately invoked with the current Configuration state.
     * @param handler The handler to be invoked when configuration changes occur.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addConfigurationChangedListener(handler: OnConfigurationChangedHandler): Subscription;

    /**
     * Adds a listener that reacts to changes of {@link canResetConfiguration}.
     * Once registered, the handler is immediately invoked with the current state.
     * @param handler The handler to be invoked when canResetConfiguration changed.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addCanResetConfigurationChangedListener(handler: OnCanResetConfigurationChangedHandler): Subscription;

    /**
     * Adds a listener that reacts to changes of {@link storeConfiguration}.
     * Once registered, the handler is immediately invoked with the current state.
     * @param handler The handler to be invoked when storeConfiguration changed.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addStoredConfigurationChangedListener(handler: OnStoredConfigurationChangedHandler): Subscription;

    /**
     * Adds a listener that reacts to changes of {@link getDecisions}.
     * Once registered, the handler is immediately invoked with the current state.
     * @param kind The kind of decisions that should be listened to.
     * @param handler The handler to be invoked when getDecisions changed.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addDecisionsChangedListener(kind: DecisionKind.Explicit, handler: OnDecisionsChangedHandler<CollectedExplicitDecision>): Subscription;

    /**
     * Adds a listener that reacts to changes of {@link getDecisions}.
     * Once registered, the handler is immediately invoked with the current state.
     * @param kind The kind of decisions that should be listened to.
     * @param handler The handler to be invoked when getDecisions changed.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addDecisionsChangedListener(kind: DecisionKind.Implicit, handler: OnDecisionsChangedHandler<CollectedImplicitDecision>): Subscription;

    /**
     * Adds a listener that reacts to changes of {@link getDecisions}.
     * Once registered, the handler is immediately invoked with the current state.
     * @param handler The handler to be invoked when getDecisions changed.
     * @return A subscription that allows unsubscribing the handler from future changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    addDecisionsChangedListener(handler: OnDecisionsChangedHandler<CollectedDecision>): Subscription;

    /**
     * Retrieves the current SessionContext associated with this session.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getSessionContext(): SessionContext;

    /**
     * Retrieves the current SessionContext associated with this session.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getSessionContext(queue: true): Promise<SessionContext>;

    /**
     * Retrieves the full state of the Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getConfiguration(): Configuration;

    /**
     * Retrieves the full state of the Configuration.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getConfiguration(queue: true): Promise<Configuration>;

    /**
     * Retrieves the changes made to the Configuration since the last time they were cleared.
     * @remarks Changes are aggregated until they are cleared using {@link clearConfigurationChanges}.
     * @remarks This method can be called multiple times without recalculating the changes each time.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getConfigurationChanges(): ConfigurationChanges;

    /**
     * Clears all tracked Configuration changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    clearConfigurationChanges(): void;

    /**
     * Determines if the Configuration can be reset, which is possible if decisions have been made.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    canResetConfiguration(): boolean;

    /**
     * Determines if the Configuration can be reset, which is possible if decisions have been made.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    canResetConfiguration(queue: true): Promise<boolean>;

    /**
     * Resets the Configuration to its initial state.
     * @remarks This method can be called multiple times without issue.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    resetConfiguration(): Promise<void>;

    /**
     * Stores the current non-optimistic Configuration state.
     * @remarks The method waits for any pending or ongoing operations to complete before storing the state.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    storeConfiguration(): Promise<StoredConfiguration>;

    /**
     * Overwrites the current Configuration state with a previously stored Configuration.
     * @remarks Ensure that the session was initialized with the same SessionContext as when the configuration was stored,
     * otherwise not all decisions may be restored.
     * @param storedConfiguration The configuration to be restored.
     * @param mode The mode defining how existing decisions should be handled.
     * @return The decisions that were rejected during restoration.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    restoreConfiguration(storedConfiguration: StoredConfiguration, mode: MakeManyDecisionsMode): Promise<MakeManyDecisionsResult>;

    /**
     * Retrieves all explicit non-optimistic decisions in the current Configuration.
     * @param kind The kind of decisions that should be returned.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Explicit): ReadonlyArray<CollectedExplicitDecision>;

    /**
     * Retrieves all explicit non-optimistic decisions in the current Configuration.
     * @param kind The kind of decisions that should be returned.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Explicit, queue: true): Promise<ReadonlyArray<CollectedExplicitDecision>>;

    /**
     * Retrieves all implicit non-optimistic decisions in the current Configuration.
     * @param kind The kind of decisions that should be returned.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Implicit): ReadonlyArray<CollectedImplicitDecision>;

    /**
     * Retrieves all implicit non-optimistic decisions in the current Configuration.
     * @param kind The kind of decisions that should be returned.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Implicit, queue: true): Promise<ReadonlyArray<CollectedImplicitDecision>>;

    /**
     * Retrieves all implicit and explicit, non-optimistic decisions in the current Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(): ReadonlyArray<CollectedDecision>;

    /**
     * Retrieves all implicit and explicit, non-optimistic decisions in the current Configuration.
     * @param queue Whether to queue this operation instead of executing it immediately.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(queue: true): Promise<ReadonlyArray<CollectedDecision>>;

    /**
     * Makes an explicit decision in the Configuration.
     * @param decision The explicit decision to be made.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    makeDecision(decision: ExplicitDecision): Promise<void>;

    /**
     * Applies a solution that was generated either by explaining a circumstance or as the result of a rejected {@link makeManyDecisions}.
     * @param solution The solution to be applied.
     * @return The decisions that were rejected, depending on how the solution was generated.
     * @throws {MakeManyDecisionsConflict} Depending on how the solution was created.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    applySolution(solution: ExplainSolution): Promise<MakeManyDecisionsResult>;

    /**
     * Sets multiple explicit decisions at once.
     * @param decisions The explicit decisions to be made.
     * @param mode The mode defining how existing decisions should be handled.
     * @return The decisions that were rejected when automatic conflict resolution was applied.
     * @throws {MakeManyDecisionsConflict} If decisions were rejected and manual conflict resolution was required.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     * @deprecated Use {@link makeManyDecisions}
     */
    setMany(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode): Promise<MakeManyDecisionsResult>;

    /**
     * Makes multiple decisions in the Configuration.
     * @param decisions The explicit decisions to be made.
     * @param mode The mode defining how existing decisions should be handled.
     * @return The decisions that were rejected when automatic conflict resolution was applied.
     * @throws {MakeManyDecisionsConflict} If decisions were rejected and manual conflict resolution was required.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    makeManyDecisions(decisions: ReadonlyArray<ExplicitDecision>, mode: MakeManyDecisionsMode): Promise<MakeManyDecisionsResult>;

    /**
     * Sets the SessionContext of the session and attempts to migrate all existing decisions.
     * @param sessionContext The SessionContext to apply.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    setSessionContext(sessionContext: SessionContext): Promise<void>;

    /**
     * Reinitializes the session by creating a new session and attempts to migrate all existing decisions.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    reinitialize(): Promise<void>;

    /**
     * Explains a specific circumstance based on the provided question.
     * @return The decisions that explain the circumstance.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    explain(question: ExplainQuestionParam, answerType: "decisions"): Promise<DecisionsExplainAnswer>;

    /**
     * Explains a specific circumstance based on the provided question.
     * @return The constraints that explain the circumstance.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    explain(question: ExplainQuestionParam, answerType: "constraints"): Promise<ConstraintsExplainAnswer>;

    /**
     * Explains a specific circumstance based on the provided question.
     * @return Both the decisions and constraints that explain the circumstance.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    explain(question: ExplainQuestionParam, answerType: "full"): Promise<FullExplainAnswer>;

    /**
     * Closes the session and makes it unavailable for further operations.
     * @remarks To continue, a new session must be created.
     * @remarks All pending or running operations will be rejected with {@link TaskCancelled}.
     */
    close(): Promise<void>;

    /**
     * Schedules a task to the end of the queue.
     * @param signal An optional AbortSignal which lets the promise become immediately rejected if aborted.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     * @throws {AbortSignal.reason} If the {@link signal} is aborted.
     */
    scheduleTask(signal?: AbortSignal | null): Promise<ScheduleTaskResult>;
}