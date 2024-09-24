import {GlobalAttributeIdKey} from "../../contract/Types";
import {HashedAttribute} from "./HashedAttribute";

type HashedConfiguration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyMap<GlobalAttributeIdKey, HashedAttribute>;
}

export default HashedConfiguration;