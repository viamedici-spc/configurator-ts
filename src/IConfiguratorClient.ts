import IConfigurationSession from "./IConfigurationSession";
import {SessionContext} from "./contract/Types";

export default interface IConfiguratorClient {
    createSession(sessionContext: SessionContext): Promise<IConfigurationSession>;
}