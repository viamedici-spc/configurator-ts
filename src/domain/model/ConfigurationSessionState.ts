import type {SessionContext} from "../../contract/Types";
import type HashedConfiguration from "./HashedConfiguration";
import type ConfigurationRawData from "./ConfigurationRawData";

export type ConfigurationSessionState = {
    readonly sessionId?: string;
    readonly configuration: HashedConfiguration;
    readonly sessionContext: SessionContext;
    readonly configurationRawData: ConfigurationRawData;
};

export type FullQualifiedConfigurationSessionState = Required<ConfigurationSessionState>;