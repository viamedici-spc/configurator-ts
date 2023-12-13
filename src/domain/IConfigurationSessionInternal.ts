import {Option} from "@viamedici-spc/fp-ts-extensions";
import {
    AttributeDecision,
    Configuration,
    ConfigurationSessionContext,
    ExplainAnswer,
    ExplainQuestion,
    SetManyMode,
    ExplainSolution,
    TaskEitherResult
} from "./Model";
import ConfigurationSession from "../ConfigurationSession";
import {ConfigurationSessionHandler} from "./handler/ConfigurationSessionHandler";
import IConfigurationSessionHandler from "./handler/IConfigurationSessionHandler";
import * as Domain from "./Model";

export type OnConfigurationChangedHandlerInternal = (configuration: Configuration) => void;

export type ConfigurationSessionInternalCreator = (sessionHandler: IConfigurationSessionHandler, configurationSession: Domain.ConfigurationSessionState) => IConfigurationSessionInternal;
export interface IConfigurationSessionInternal {

    /*
     * Operations that impact the session lifecycle
     */
    close(): TaskEitherResult<void>;

    restoreConfiguration(configuration: Configuration): TaskEitherResult<Configuration>;

    setSessionContext(sessionContext: ConfigurationSessionContext): TaskEitherResult<Configuration>;

    invalidateSessionId(): void;

    /*
     * Operations that modify the session state and modify the local tracked state
     */
    makeDecision(decision: AttributeDecision): TaskEitherResult<Configuration>;

    applySolution(solution: ExplainSolution): TaskEitherResult<Configuration>;

    setMany(decisions: ReadonlyArray<AttributeDecision>, mode: SetManyMode): TaskEitherResult<Configuration>;

    explain(explain: ExplainQuestion): TaskEitherResult<ExplainAnswer>;

    /*
     * Consumer operations that either do not modify or only modify the behavior for the consumer
     */
    setOnConfigurationChangedHandler(handler: Option<OnConfigurationChangedHandlerInternal>): void;

    getConfiguration(): Configuration;

    getSessionContext(): ConfigurationSessionContext;
}