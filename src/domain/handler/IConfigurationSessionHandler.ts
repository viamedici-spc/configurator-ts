import {
    AttributeDecision, ConfigurationSessionState,
    SessionId,
    SetManyMode,
    TaskEitherResult
} from "../Model";
import * as Domain from "../Model";

export default interface IConfigurationSessionHandler {
    recreate(configurationData: ConfigurationSessionState): TaskEitherResult<ConfigurationSessionState>;
    reinitialize(session: ConfigurationSessionState): TaskEitherResult<ConfigurationSessionState>;
    close(sessionId: SessionId): TaskEitherResult<void>;

    makeDecision(decision: AttributeDecision, configurationSession: ConfigurationSessionState): TaskEitherResult<ConfigurationSessionState>;
    setMany(decisions: readonly AttributeDecision[], mode: SetManyMode, configurationSession: ConfigurationSessionState): TaskEitherResult<ConfigurationSessionState>;

    explain(explain: Domain.ExplainQuestion, configurationSession: Domain.ConfigurationSessionState): Domain.TaskEitherResult<Domain.ExplainAnswer>;
}