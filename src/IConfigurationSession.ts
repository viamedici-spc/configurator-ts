import {
    Configuration,
    ConstraintsExplainAnswer,
    DecisionsExplainAnswer,
    ExplicitDecision,
    FullExplainAnswer,
    SessionContext,
    SetManyMode,
    ExplainSolution,
    OnConfigurationChangedHandler,
    ConfigurationChanges,
    ExplainQuestionParam,
    SetManyResult,
    Subscription,
    CollectedDecision,
    DecisionKind,
    CollectedImplicitDecision,
    CollectedExplicitDecision, OnCanResetConfigurationChangedHandler,
} from "./contract/Types";
import {ConfiguratorError, SessionClosed, TaskCancelled, SetManyDecisionsConflict} from "./contract/ConfiguratorError";
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
     * Retrieves the current SessionContext associated with this session.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getSessionContext(): SessionContext;

    /**
     * Retrieves the full state of the Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getConfiguration(): Configuration;

    /**
     * Retrieves the changes made to the Configuration since the last time they were cleared.
     * @remarks Changes are aggregated until they are cleared using {@link clearConfigurationChanges}.
     * @remarks This method can be called multiple times without recalculating the changes each time.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getConfigurationChanges(): ConfigurationChanges;

    /**
     * Clears all tracked configuration changes.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    clearConfigurationChanges(): void;

    /**
     * Determines if the Configuration can be reset, which is possible if decisions have been made.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    get canResetConfiguration(): boolean;

    /**
     * Resets the Configuration to its initial state.
     * @remarks This method can be called multiple times without issue.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    resetConfiguration(): Promise<void>;

    /**
     * Stores the current Configuration state.
     * @remarks The method waits for any pending or ongoing operations to complete before storing the state.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    storeConfiguration(): Promise<StoredConfiguration>;

    /**
     * Overwrites the current Configuration state with a previously stored configuration.
     * @remarks Ensure that the session was initialized with the same SessionContext as when the configuration was stored,
     * otherwise not all decisions may be restored.
     * @param storedConfiguration The configuration to be restored.
     * @param mode The mode defining how existing decisions should be handled.
     * @return The decisions that were rejected during restoration.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    restoreConfiguration(storedConfiguration: StoredConfiguration, mode: SetManyMode): Promise<SetManyResult>;

    /**
     * Retrieves all explicit decisions in the current Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Explicit): ReadonlyArray<CollectedExplicitDecision>;

    /**
     * Retrieves all implicit decisions in the current Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(kind: DecisionKind.Implicit): ReadonlyArray<CollectedImplicitDecision>;

    /**
     * Retrieves all implicit and explicit decisions in the current Configuration.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    getDecisions(): ReadonlyArray<CollectedDecision>;

    /**
     * Makes an explicit decision in the Configuration.
     * @param decision The explicit decision to be made.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    makeDecision(decision: ExplicitDecision): Promise<void>;

    /**
     * Applies a solution that was generated either by explaining a circumstance or as the result of a rejected {@link setMany}.
     * @param solution The solution to be applied.
     * @return The decisions that were rejected, depending on how the solution was generated.
     * @throws {SetManyDecisionsConflict} Depending on how the solution was created.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    applySolution(solution: ExplainSolution): Promise<SetManyResult>;

    /**
     * Sets multiple explicit decisions at once.
     * @param decisions The explicit decisions to be made.
     * @param mode The mode defining how existing decisions should be handled.
     * @return The decisions that were rejected when automatic conflict resolution was applied.
     * @throws {SetManyDecisionsConflict} If decisions were rejected and manual conflict resolution was required.
     * @throws {TaskCancelled} If the session is closed while the operation is pending or in progress.
     * @throws {SessionClosed} If the session has already been closed using {@link close}.
     * @throws {ConfiguratorError} If a general configuration error occurs.
     */
    setMany(decisions: ReadonlyArray<ExplicitDecision>, mode: SetManyMode): Promise<SetManyResult>;

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
}