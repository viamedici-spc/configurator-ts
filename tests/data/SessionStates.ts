import type {
    ConfigurationSessionState,
    FullQualifiedConfigurationSessionState,
} from "../../src/domain/model/ConfigurationSessionState";
import type {Attribute, AttributeType, ConfigurationModelFromPackage, GlobalAttributeIdKey} from "../../src";
import {ConfigurationModelSourceType} from "../../src";
import {getBooleanAttribute, getComponentAttribute, getNumericAttribute} from "./AttributeGeneration";
import type ConfigurationRawData from "../../src/domain/model/ConfigurationRawData";
import {RM} from "@viamedici-spc/fp-ts-extensions";
import {fromRawData} from "../../src/domain/logic/Configuration";

export const sessionStateWithOneMandatoryBoolean: FullQualifiedConfigurationSessionState = {
    sessionId: "Session1",
    sessionContext: {
        sessionInitialisationOptions: {
            accessToken: "n/a",
        },
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: {
                root: "n/a",
                configurationModels: [],
            },
        } satisfies ConfigurationModelFromPackage,
    },
    ...getConfiguration(getBooleanAttribute("A1")),
};

export const sessionStateWithOneMandatoryNumeric: FullQualifiedConfigurationSessionState = {
    sessionId: "Session1",
    sessionContext: {
        sessionInitialisationOptions: {
            accessToken: "n/a",
        },
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: {
                root: "n/a",
                configurationModels: [],
            },
        } satisfies ConfigurationModelFromPackage,
    },
    ...getConfiguration(getNumericAttribute("A1")),
};

export const sessionStateWithOneMandatoryComponent: FullQualifiedConfigurationSessionState = {
    sessionId: "Session1",
    sessionContext: {
        sessionInitialisationOptions: {
            accessToken: "n/a",
        },
        configurationModelSource: {
            type: ConfigurationModelSourceType.Package,
            configurationModelPackage: {
                root: "n/a",
                configurationModels: [],
            },
        } satisfies ConfigurationModelFromPackage,
    },
    ...getConfiguration(getComponentAttribute("A1")),
};

function getConfiguration(
    a: [GlobalAttributeIdKey, Attribute & {type: Exclude<AttributeType, AttributeType.Choice>}],
): Pick<ConfigurationSessionState, "configuration" | "configurationRawData"> {
    const rawData: ConfigurationRawData = {
        isSatisfied: false,
        canContributeToSatisfaction: [],
        meta: RM.empty,
        decisions: new Map([a]),
        consequences: new Map([a]),
    };

    return {
        configuration: fromRawData(rawData),
        configurationRawData: rawData,
    };
}