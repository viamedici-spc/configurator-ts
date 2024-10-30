import {none, Option} from "fp-ts/Option";
import {
    Attribute,
    CollectedDecision,
    ConfigurationChanges,
    GlobalAttributeId,
    GlobalAttributeIdKey,
    OnCanResetConfigurationChangedHandler,
    OnDecisionsChangedHandler,
    OnConfigurationChangedHandler,
    OnStoredConfigurationChangedHandler
} from "../../contract/Types";
import ConfigurationRawData from "../model/ConfigurationRawData";
import {O, Ord, OrdT, P, pipe, RA, RM, some} from "@viamedici-spc/fp-ts-extensions";
import HashedConfiguration from "../model/HashedConfiguration";
import {globalAttributeIdKeyEq} from "../../contract/Eqs";
import {isEmpty} from "./ConfigurationChanges";
import {StoredConfiguration} from "../../contract/storedConfiguration/StoredConfiguration";

export function calculateCanResetConfigurationChangedHandler(canReset: (rawData: ConfigurationRawData) => boolean): (previous: ConfigurationRawData | null, current: ConfigurationRawData | null) => Option<Parameters<OnCanResetConfigurationChangedHandler>> {
    return (previous, current) => {
        const previousCanReset = previous ? canReset(previous) : null;
        const currentCanReset = current ? canReset(current) : null;

        if (currentCanReset != null && currentCanReset !== previousCanReset) {
            return some([currentCanReset]);
        }

        return none;
    };
}

export function calculateConfigurationChangedHandler(previous: HashedConfiguration | null, current: HashedConfiguration | null): Option<Parameters<OnConfigurationChangedHandler>> {
    const keys = RM.keys(Ord.trivial as OrdT<GlobalAttributeIdKey>);

    if (current == null) {
        return none;
    }

    const previousAttributes: HashedConfiguration["attributes"] = previous?.attributes ?? RM.empty;

    const allAttributeKeys = pipe([
            ...keys(current.attributes),
            ...keys(previousAttributes),
        ],
        RA.uniq(globalAttributeIdKeyEq)
    );

    const addedAttributes: Array<Attribute> = [];
    const changedAttributes: Array<Attribute> = [];
    const deletedAttributes: Array<GlobalAttributeId> = [];

    allAttributeKeys.forEach((key) => {
        const currentAttribute = current.attributes.get(key);
        const previousAttribute = previousAttributes.get(key);

        if (currentAttribute != null && previousAttribute == null) {
            addedAttributes.push(currentAttribute);
        }
        if (currentAttribute == null && previousAttribute != null) {
            deletedAttributes.push(previousAttribute.id);
        }
        if (currentAttribute != null && previousAttribute != null && currentAttribute.hash != previousAttribute.hash) {
            changedAttributes.push(currentAttribute);
        }
    });

    return pipe(
        {
            isSatisfied: current.isSatisfied != previous?.isSatisfied ? current.isSatisfied : null,
            attributes: {
                added: addedAttributes,
                changed: changedAttributes,
                removed: deletedAttributes,
            }
        } satisfies ConfigurationChanges,
        O.fromPredicate(P.not(isEmpty)),
        O.map(c => [current, c])
    );
}

export function calculateStoredConfigurationChangedHandler(getStoredConfiguration: (rawData: ConfigurationRawData) => StoredConfiguration): (previous: ConfigurationRawData | null, current: ConfigurationRawData | null) => Option<Parameters<OnStoredConfigurationChangedHandler>> {
    return mappingBasedChangeHandler(getStoredConfiguration);
}

export function calculateCollectedDecisionsChangedHandler<T extends CollectedDecision>(getCollectedDecisions: (rawData: ConfigurationRawData) => ReadonlyArray<T>): (previous: ConfigurationRawData | null, current: ConfigurationRawData | null) => Option<Parameters<OnDecisionsChangedHandler<T>>> {
    return mappingBasedChangeHandler(getCollectedDecisions);
}

function mappingBasedChangeHandler<TI, TO>(mapper: (rawData: TI) => TO): (previous: TI | null, current: TI | null) => Option<[TO]> {
    return (previous, current) => {
        if (current == null || previous === current) {
            return none;
        }

        const mappingResult = mapper(current);

        return some([mappingResult]);
    };
}