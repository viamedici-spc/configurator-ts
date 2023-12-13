import {Option, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {IConfigurationSessionInternal, OnConfigurationChangedHandlerInternal} from "../IConfigurationSessionInternal";
import * as Domain from "../Model";

export class LoggingDecorator implements IConfigurationSessionInternal {

    protected readonly stringify: boolean;
    protected readonly inner: IConfigurationSessionInternal;
    protected readonly durationNumberFormat: Intl.NumberFormat;

    constructor(inner: IConfigurationSessionInternal, stringify: boolean = false) {
        this.stringify = stringify;
        this.inner = inner;
        this.durationNumberFormat = new Intl.NumberFormat("en-EN", {maximumFractionDigits: 3});
    }

    private withLogging<TR>(operationName: string, operationParams: any[], operation: () => Domain.TaskEitherResult<TR>) {
        const timeInitiated = performance.now();
        const getDuration = () => {
            const duration = performance.now() - timeInitiated;
            return this.durationNumberFormat.format(duration);
        };

        console.debug(`Operation ${operationName} started with`, this.renderAsRequired(operationParams));
        return pipe(operation(),
            TE.doIfLeft(l => () => {
                console.debug(`Operation ${operationName} completed after ${getDuration()}ms with failure`, this.renderAsRequired(l));
            }),
            TE.doIfRight(r => () => {
                console.debug(`Operation ${operationName} completed after ${getDuration()}ms with success`, this.renderAsRequired(r));
            })
        );
    }

    private renderAsRequired(data: any) {

        if (this.stringify){
            return JSON.stringify(data, null, 2);
        }

        return data;
    }

    public explain(explain: Domain.ExplainQuestion): Domain.TaskEitherResult<Domain.ExplainAnswer> {
        return this.withLogging("explain", [explain], () => {
            return this.inner.explain(explain);
        });
    }

    public getSessionContext(): Domain.ConfigurationSessionContext {
        return this.inner.getSessionContext();
    }

    public setSessionContext(sessionContext: Domain.ConfigurationSessionContext): Domain.TaskEitherResult<Domain.Configuration> {
        return this.withLogging("setSessionContext", [sessionContext], () => {
            return this.inner.setSessionContext(sessionContext);
        });
    }

    public applySolution(solution: Domain.ExplainSolution): Domain.TaskEitherResult<Domain.Configuration> {
        return this.withLogging("applySolution", [solution], () => {
            return this.inner.applySolution(solution);
        });
    }

    public close(): Domain.TaskEitherResult<void> {
        return this.inner.close();
    }

    public makeDecision(decision: Domain.AttributeDecision): Domain.TaskEitherResult<Domain.Configuration> {
        return this.withLogging("makeDecision", [decision], () => {
            return this.inner.makeDecision(decision);
        });
    }

    public restoreConfiguration(configuration: Domain.Configuration): Domain.TaskEitherResult<Domain.Configuration> {
        return this.withLogging("restoreConfiguration", [configuration], () => {
            return this.inner.restoreConfiguration(configuration);
        });
    }

    public setMany(decisions: ReadonlyArray<Domain.AttributeDecision>, mode: Domain.SetManyMode): Domain.TaskEitherResult<Domain.Configuration> {
        return this.withLogging("setMany", [decisions, mode], () => {
            return this.inner.setMany(decisions, mode);
        });
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