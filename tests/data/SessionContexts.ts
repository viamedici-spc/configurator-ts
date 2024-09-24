import {ModelWithOneMandatoryChoice} from "./ConfigurationModelSources";
import {SessionContext} from "../../src";

export const SessionContextWithModelWithOneMandatoryChoice: SessionContext = {
    sessionInitialisationOptions: {
        accessToken: "Token1"
    },
    configurationModelSource: ModelWithOneMandatoryChoice
};