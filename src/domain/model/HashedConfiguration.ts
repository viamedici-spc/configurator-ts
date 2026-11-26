import {GlobalAttributeIdKey} from "../../contract/Types";
import {HashedAttribute} from "./HashedAttribute";

type HashedConfiguration = {
    readonly isSatisfied: boolean | null;
    readonly attributes: ReadonlyMap<GlobalAttributeIdKey, HashedAttribute>;
}

export default HashedConfiguration;
