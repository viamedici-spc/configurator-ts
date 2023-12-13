import {SessionId, TaskEitherResult} from "../domain/Model";
import {SessionContext} from "../contract/Types";

export default interface ISessionLifetimeHandler {
    create(sessionContext: SessionContext): TaskEitherResult<SessionId>;

    close(sessionId: string): TaskEitherResult<void>;
}