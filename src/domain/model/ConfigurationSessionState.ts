import {SessionContext, GlobalAttributeId} from "../../contract/Types";
import HashedConfiguration from "./HashedConfiguration";
import ConfigurationRawData from "./ConfigurationRawData";

export type ConfigurationSessionState = {
    readonly sessionId?: string;
    readonly activeAttributes?: ReadonlyArray<GlobalAttributeId> | null;
    readonly configuration: HashedConfiguration;
    readonly sessionContext: SessionContext;
    readonly configurationRawData: ConfigurationRawData;
};

export type FullQualifiedConfigurationSessionState = Required<Omit<ConfigurationSessionState, "activeAttributes">> & Pick<ConfigurationSessionState, "activeAttributes">;