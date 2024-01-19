import {Lazy, Option} from "@viamedici-spc/fp-ts-extensions";
import {IConfigurationSessionInternal, OnConfigurationChangedHandlerInternal} from "../IConfigurationSessionInternal";
import {
    TaskEitherResult,
    Configuration,
    ConfigurationSessionContext,
    AttributeDecision,
    ExplainSolution,
    SetManyMode,
    ExplainQuestionBase,
    WhyIsNotSatisfied,
    WhyIsStateNotPossible,
    ExplainAnswer
} from "../Model";
import {guid} from "dyna-guid";
import {Task} from "@viamedici-spc/fp-ts-extensions";

export default class SynchronousOperationDecorator implements IConfigurationSessionInternal {

    protected readonly inner: IConfigurationSessionInternal;
    protected readonly lockName: string;

    constructor(inner: IConfigurationSessionInternal) {
        this.inner = inner;
        this.lockName = "SynchronousOperationDecorator_" + guid();
    }

    static new(inner: IConfigurationSessionInternal) {
        return new SynchronousOperationDecorator(inner);
    }

    public close(): TaskEitherResult<void> {
        return this.executeTaskSynchronous(() => this.inner.close());
    }

    public restoreConfiguration(configuration: Configuration): TaskEitherResult<Configuration> {
        return this.executeTaskSynchronous(() => this.inner.restoreConfiguration(configuration));
    }

    public setSessionContext(sessionContext: ConfigurationSessionContext): TaskEitherResult<Configuration> {
        return this.executeTaskSynchronous(() => this.inner.setSessionContext(sessionContext));
    }

    public invalidateSessionId(): void {
        return this.inner.invalidateSessionId();
    }

    public makeDecision(decision: AttributeDecision): TaskEitherResult<Configuration> {
        return this.executeTaskSynchronous(() => this.inner.makeDecision(decision));
    }

    public applySolution(solution: ExplainSolution): TaskEitherResult<Configuration> {
        return this.executeTaskSynchronous(() => this.inner.applySolution(solution));
    }

    public setMany(decisions: readonly AttributeDecision[], mode: SetManyMode): TaskEitherResult<Configuration> {
        return this.executeTaskSynchronous(() => this.inner.setMany(decisions, mode));
    }

    public explain(explain: ExplainQuestionBase & (WhyIsNotSatisfied | WhyIsStateNotPossible)): TaskEitherResult<ExplainAnswer> {
        return this.executeTaskSynchronous(() => this.inner.explain(explain));
    }

    public setOnConfigurationChangedHandler(handler: Option<OnConfigurationChangedHandlerInternal>): void {
        return this.inner.setOnConfigurationChangedHandler(handler);
    }

    public getConfiguration(): Configuration {
        return this.inner.getConfiguration();
    }

    public getSessionContext(): ConfigurationSessionContext {
        return this.inner.getSessionContext();
    }

    private executeTaskSynchronous<T>(lazyTask: Lazy<Task<T>>): Task<T> {
        return () => navigator.locks.request(this.lockName, {mode: "exclusive"}, () => lazyTask()() satisfies Promise<T>);
    }
}