import * as Domain from "./Model";
import {constant, flow, O, none, Option, pipe, RA, TE} from "@viamedici-spc/fp-ts-extensions";
import {rightOfVoid} from "../crossCutting/TaskEitherExtensions";
import IConfigurationSessionHandler from "./handler/IConfigurationSessionHandler";
import {IConfigurationSessionInternal, OnConfigurationChangedHandlerInternal} from "./IConfigurationSessionInternal";
import {match, P} from "ts-pattern";

export class ConfigurationSessionInternal implements IConfigurationSessionInternal {

    protected configurationSession: Domain.ConfigurationSessionState;
    protected readonly sessionHandler: IConfigurationSessionHandler;
    private onConfigurationChangedHandler: Option<OnConfigurationChangedHandlerInternal> = none;

    constructor(sessionHandler: IConfigurationSessionHandler, configurationSession: Domain.ConfigurationSessionState) {
        this.sessionHandler = sessionHandler;
        this.configurationSession = configurationSession;
    }

    public setOnConfigurationChangedHandler(handler: Option<OnConfigurationChangedHandlerInternal>): void {
        this.onConfigurationChangedHandler = handler;
    }

    public getSessionContext(): Domain.ConfigurationSessionContext {
        return this.configurationSession.context;
    }

    public getConfiguration(): Domain.Configuration {
        return this.configurationSession.configuration;
    }

    public explain(explain: Domain.ExplainQuestion): Domain.TaskEitherResult<Domain.ExplainAnswer> {
        return pipe(this.sessionHandler.explain(explain, this.configurationSession),
            this.updateAvailableSolutionsIfRight(r => this.deriveSolutionsFromExplainAnswer(r)),
            this.invalidateAvailableSolutionsIfLeft()
        );
    }

    public setSessionContext(sessionContext: Domain.ConfigurationSessionContext): Domain.TaskEitherResult<Domain.Configuration> {
        return pipe(
            this.sessionHandler.recreate({
                ...this.configurationSession,
                context: sessionContext
            }),
            this.updateSession()
        );
    }

    public invalidateSessionId(): void {
        this.configurationSession = {
            ...this.configurationSession,
            sessionId: none
        };
    }

    public restoreConfiguration(configuration: Domain.Configuration): Domain.TaskEitherResult<Domain.Configuration> {

        return pipe(
            this.sessionHandler.reinitialize({
                ...this.configurationSession,
                configuration: configuration
            }),
            this.updateSession()
        );
    }

    public makeDecision(decision: Domain.AttributeDecision): Domain.TaskEitherResult<Domain.Configuration> {
        return pipe(
            this.sessionHandler.makeDecision(decision, this.configurationSession),
            this.updateSession()
        );
    }

    public close(): Domain.TaskEitherResult<void> {
        return pipe(
            this.configurationSession.sessionId,
            O.map(sessionId => this.sessionHandler.close(sessionId)),
            O.map(flow(TE.map(_ => {
                this.configurationSession = {
                    ...this.configurationSession,
                    sessionId: none
                };
            }))),
            O.getOrElse(constant(rightOfVoid()))
        );
    }

    public applySolution(solution: Domain.ExplainSolution): Domain.TaskEitherResult<Domain.Configuration> {
        return pipe(this.configurationSession.solutions,
            RA.findFirst(availableSolution => Domain.eqSolution.equals(availableSolution, solution)), // Validate solution is still available
            TE.fromOption((): Domain.FailureResult => ({
                type: Domain.FailureType.ConfigurationSolutionNotAvailable
            })),
            TE.map(solution => solution.decisions),
            TE.chain(d => this.setMany(d, solution.mode))
        );
    }

    public setMany(decisions: ReadonlyArray<Domain.AttributeDecision>, mode: Domain.SetManyMode): Domain.TaskEitherResult<Domain.Configuration> {
        return pipe(
            this.sessionHandler.setMany(decisions, mode, this.configurationSession),
            this.updateSession(),
            TE.doIfLeft(l => () => {
                const decisionExplanations = match(l)
                    .with({
                        decisionExplanations: P.array(P.any)
                    }, v => O.some(v.decisionExplanations))
                    .otherwise(() => O.none);

                this.configurationSession = {
                    ...this.configurationSession,
                    solutions: pipe(decisionExplanations, O.map(flow(RA.map(e => e.solution))), O.getOrElse((): ReadonlyArray<Domain.ExplainSolution> => []))
                };
            })
        );
    }

    private deriveSolutionsFromExplainAnswer(explanation: Domain.ExplainAnswer): ReadonlyArray<Domain.ExplainSolution> {
        const decisionExplanations = match(explanation)
            .with({
                decisionExplanations: P.array(P.any)
            }, p => p.decisionExplanations)
            .otherwise(() => []);

        return pipe(decisionExplanations, RA.map((decisionExplanation: Domain.DecisionExplanation) => decisionExplanation.solution));
    }

    private invalidateAvailableSolutions<R>(): (e: Domain.TaskEitherResult<R>) => Domain.TaskEitherResult<R> {
        return TE.doIfLeftOrRight(
            () => () => {
                this.configurationSession = {
                    ...this.configurationSession,
                    solutions: []
                };
            });
    }

    private invalidateAvailableSolutionsIfLeft<R>(): (e: Domain.TaskEitherResult<R>) => Domain.TaskEitherResult<R> {
        return TE.doIfLeft(
            () => () => {
                this.configurationSession = {
                    ...this.configurationSession,
                    solutions: []
                };
            });
    }

    private updateAvailableSolutionsIfRight<R>(solutionSelector: (r: R) => ReadonlyArray<Domain.ExplainSolution>): (e: Domain.TaskEitherResult<R>) => Domain.TaskEitherResult<R> {
        return TE.doIfRight(
            r => () => {
                this.configurationSession = {
                    ...this.configurationSession,
                    solutions: solutionSelector(r)
                };
            });
    }

    private updateSession(): (e: Domain.TaskEitherResult<Domain.ConfigurationSessionState>) => Domain.TaskEitherResult<Domain.Configuration> {
        return flow(
            TE.doIfRight(curConfigurationSession => () => {
                this.configurationSession = curConfigurationSession;

                pipe(this.onConfigurationChangedHandler, O.doIfSome(handler => () => handler(this.configurationSession.configuration)));
            }),
            TE.map(c => c.configuration),
            this.invalidateAvailableSolutions()
        );
    }
}