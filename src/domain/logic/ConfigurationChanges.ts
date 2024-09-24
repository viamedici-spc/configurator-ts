import {ConfigurationChanges} from "../../contract/Types";
import {configurationChangesEq} from "../../contract/Eqs";

export const emptyChanges: ConfigurationChanges = {
    isSatisfied: null,
    attributes: {
        added: [],
        changed: [],
        removed: []
    }
};

export function isEmpty(configurationChanges: ConfigurationChanges): boolean {
    return configurationChangesEq.equals(emptyChanges, configurationChanges);
}