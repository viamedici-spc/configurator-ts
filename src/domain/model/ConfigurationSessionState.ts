import {SessionContext} from "../../contract/Types";
import HashedConfiguration from "./HashedConfiguration";
import ConfigurationRawData from "./ConfigurationRawData";

export type ConfigurationSessionState = {
    readonly sessionId?: string;
    readonly configuration: HashedConfiguration;
    readonly sessionContext: SessionContext;
    readonly configurationRawData: ConfigurationRawData;
};

export type FullQualifiedConfigurationSessionState = Required<ConfigurationSessionState>;