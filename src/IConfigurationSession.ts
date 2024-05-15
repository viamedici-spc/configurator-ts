import {
    Configuration,
    ConstraintsExplainAnswer,
    DecisionsExplainAnswer,
    ExplicitDecision,
    FullExplainAnswer,
    ExplainQuestion,
    SessionContext,
    SetManyMode,
    ExplainSolution, Attribute, GlobalAttributeId
} from "./contract/Types";
import {ExplainQuestionBuilder} from "./contract/ExplainQuestionBuilder";

type ConfigurationChanges = {
    readonly isSatisfied?: boolean,
    readonly attributes: {
        readonly added: ReadonlyArray<Attribute>,
        readonly changed: ReadonlyArray<Attribute>,
        readonly removed: ReadonlyArray<GlobalAttributeId>
    }
}

export type OnConfigurationChangedHandler = (configurationChanges: ConfigurationChanges) => void;

export type ExplainQuestionParam = ExplainQuestion | ((b: ExplainQuestionBuilder) => ExplainQuestion);

export default interface IConfigurationSession {
    setOnConfigurationChangedHandler(handler: OnConfigurationChangedHandler): void;

    getSessionContext(): SessionContext;

    getConfiguration(): Configuration;

    // TODO: Throw exception when OnConfigurationChangedHandler is set
    getConfigurationChanges(): ConfigurationChanges;

    // TODO: Throw exception when OnConfigurationChangedHandler is set
    clearConfigurationChanges(): void;

    /**
     * @throws {FailureResult}
     */
    // TODO: Remove
    restoreConfiguration(configuration: Configuration): Promise<void>;

    /**
     * @throws {FailureResult}
     */
    makeDecision(decision: ExplicitDecision): Promise<void>;

    /**
     * @throws {FailureResult}
     */
    applySolution(solution: ExplainSolution): Promise<void>;

    /**
     * @throws {FailureResult}
     */
    setMany(decisions: ReadonlyArray<ExplicitDecision>, mode: SetManyMode): Promise<void>;

    /**
     * TODO: Add user documentation stating that during setSessionContext no operations like makeDecision should be used
     * @throws {FailureResult}
     */
    setSessionContext(sessionContext: SessionContext): Promise<void>;

    /**
     * @throws {FailureResult}
     */
    explain(question: ExplainQuestionParam, answerType: "decisions"): Promise<DecisionsExplainAnswer>;

    explain(question: ExplainQuestionParam, answerType: "constraints"): Promise<ConstraintsExplainAnswer>;

    explain(question: ExplainQuestionParam, answerType: "full"): Promise<FullExplainAnswer>;

    /**
     * @throws {FailureResult}
     */
    close(): Promise<void>;
}

