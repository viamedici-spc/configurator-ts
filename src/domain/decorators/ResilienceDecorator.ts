import * as Domain from "../Model";
import {capDelay, exponentialBackoff, limitRetries, Monoid, RetryPolicy} from "retry-ts";
import {retrying} from "retry-ts/Task";
import {E, pipe, Option} from "@viamedici-spc/fp-ts-extensions";
import {match} from "ts-pattern";
import {IConfigurationSessionInternal, OnConfigurationChangedHandlerInternal} from "../IConfigurationSessionInternal";

export class ResilienceDecorator implements IConfigurationSessionInternal {

    protected readonly inner: IConfigurationSessionInternal;
    protected readonly policy: RetryPolicy;

    constructor(inner: IConfigurationSessionInternal) {
        this.inner = inner;

        const maxRetry = 3;
        const maxDelay = 2000;
        const expDelay = 200;

        this.policy = capDelay(maxDelay, Monoid.concat(exponentialBackoff(expDelay), limitRetries(maxRetry)));
    }

    public getSessionContext(): Domain.ConfigurationSessionContext {
        return this.inner.getSessionContext();
    }

    public close(): Domain.TaskEitherResult<void> {
        // No resilience need, better to fail fast and move on.
        return this.inner.close();
    }

    public setSessionContext(sessionContext: Domain.ConfigurationSessionContext): Domain.TaskEitherResult<Domain.Configuration> {
        const invocation = () => this.inner.setSessionContext(sessionContext);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public makeDecision(decision: Domain.AttributeDecision): Domain.TaskEitherResult<Domain.Configuration> {
        const invocation = () => this.inner.makeDecision(decision);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public restoreConfiguration(configuration: Domain.Configuration): Domain.TaskEitherResult<Domain.Configuration> {
        const invocation = () => this.inner.restoreConfiguration(configuration);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public explain(explain: Domain.ExplainQuestion): Domain.TaskEitherResult<Domain.ExplainAnswer> {
        const invocation = () => this.inner.explain(explain);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public applySolution(solution: Domain.ExplainSolution): Domain.TaskEitherResult<Domain.Configuration> {
        const invocation = () => this.inner.applySolution(solution);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public setMany(decisions: ReadonlyArray<Domain.AttributeDecision>, mode: Domain.SetManyMode): Domain.TaskEitherResult<Domain.Configuration> {
        const invocation = () => this.inner.setMany(decisions, mode);

        return retrying(this.policy, invocation, a => {
            return pipe(a, E.match(l => this.determineAndPrepareRetry(l), () => false));
        });
    }

    public setOnConfigurationChangedHandler(handler: Option<OnConfigurationChangedHandlerInternal>): void {
        this.inner.setOnConfigurationChangedHandler(handler);
    }

    public invalidateSessionId(): void {
        this.inner.invalidateSessionId();
    }

    public getConfiguration(): Domain.Configuration {
        return this.inner.getConfiguration();
    }

    private determineAndPrepareRetry(failure: Domain.FailureResult): boolean {
        return match(failure)
            .with({type: Domain.FailureType.ConfigurationUnauthenticated}, () => {
                this.invalidateSessionId();

                return true;
            })
            .with({type: Domain.FailureType.ConfigurationTimeout}, () => true)
            .otherwise(() => false)
            ;
    }
}