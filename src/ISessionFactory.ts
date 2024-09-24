import IConfigurationSession from "./IConfigurationSession";
import {SessionContext} from "./contract/Types";

export default interface ISessionFactory {
    /**
     * Creates a new Configuration session using the specified SessionContext.
     * @param sessionContext The initial SessionContext used to configure the session.
     * @return A promise that resolves to an instance of IConfigurationSession.
     */
    createSession(sessionContext: SessionContext): Promise<IConfigurationSession>;
};