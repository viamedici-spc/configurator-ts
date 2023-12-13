import {Either, Option, some, TE} from "@viamedici-spc/fp-ts-extensions";
import ReducingTaskExecutor from "../../crossCutting/ReducingTaskExecutor";
import * as Domain from "../Model";
import {IConfigurationSessionInternal, OnConfigurationChangedHandlerInternal} from "../IConfigurationSessionInternal";

class SetContextReducingTaskExecutor extends ReducingTaskExecutor<Either<Domain.FailureResult, Domain.Configuration>, Domain.ConfigurationSessionContext> {
    private readonly inner: IConfigurationSessionInternal;

    public constructor(inner: IConfigurationSessionInternal) {
        super();
        this.inner = inner;
    }

    protected reduce(a: Option<Domain.ConfigurationSessionContext>, c: Domain.ConfigurationSessionContext): Option<Domain.ConfigurationSessionContext> {
        return some(c);
    };

    protected async execute(param: Domain.ConfigurationSessionContext): Promise<Either<Domain.FailureResult, Domain.Configuration>> {
        const result = this.inner.setSessionContext(param);
        return await result();
    };
}

export class OperationOptimizerDecorator implements IConfigurationSessionInternal {

    protected readonly inner: IConfigurationSessionInternal;
    private readonly setContextReducingTaskExecutor: SetContextReducingTaskExecutor;

    constructor(inner: IConfigurationSessionInternal) {
        this.inner = inner;
        this.setContextReducingTaskExecutor = new SetContextReducingTaskExecutor(inner);
    }

    public getSessionContext(): Domain.ConfigurationSessionContext {
        return this.inner.getSessionContext();
    }

    public setSessionContext(sessionContext: Domain.ConfigurationSessionContext): Domain.TaskEitherResult<Domain.Configuration> {
        const actual = this.inner.getSessionContext();

        const isContextUnchanged = Domain.eqSessionContext.equals(actual, sessionContext);
        if (isContextUnchanged) {
            return TE.right(this.getConfiguration());
        }

        const setContextReducedPromise = this.setContextReducingTaskExecutor.push(sessionContext);

        return () => setContextReducedPromise;
    }

    public applySolution(solution: Domain.ExplainSolution): Domain.TaskEitherResult<Domain.Configuration> {
        return this.inner.applySolution(solution);
    }

    public close(): Domain.TaskEitherResult<void> {
        return this.inner.close();
    }

    public makeDecision(decision: Domain.AttributeDecision): Domain.TaskEitherResult<Domain.Configuration> {
        return this.inner.makeDecision(decision);
    }

    public restoreConfiguration(configuration: Domain.Configuration): Domain.TaskEitherResult<Domain.Configuration> {
        return this.inner.restoreConfiguration(configuration);
    }

    public setMany(decisions: ReadonlyArray<Domain.AttributeDecision>, mode: Domain.SetManyMode): Domain.TaskEitherResult<Domain.Configuration> {
        return this.inner.setMany(decisions, mode);
    }

    public explain(explain: Domain.ExplainQuestion): Domain.TaskEitherResult<Domain.ExplainAnswer> {
        return this.inner.explain(explain);
    }

    public invalidateSessionId(): void {
        return this.inner.invalidateSessionId();
    }

    public getConfiguration(): Domain.Configuration {
        return this.inner.getConfiguration();
    }

    public setOnConfigurationChangedHandler(handler: Option<OnConfigurationChangedHandlerInternal>): void {
        return this.inner.setOnConfigurationChangedHandler(handler);
    }
}