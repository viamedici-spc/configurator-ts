import {ModelWithOneMandatoryChoice} from "./ConfigurationModelSources";
import type {SessionContext} from "../../src";

export const SessionContextWithModelWithOneMandatoryChoice: SessionContext = {
    sessionInitialisationOptions: {
        accessToken: "Token1"
    },
    configurationModelSource: ModelWithOneMandatoryChoice
};