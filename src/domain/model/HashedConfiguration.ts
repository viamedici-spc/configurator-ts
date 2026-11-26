import type {GlobalAttributeIdKey} from "../../contract/Types";
import type {HashedAttribute} from "./HashedAttribute";

type HashedConfiguration = {
    readonly isSatisfied: boolean;
    readonly attributes: ReadonlyMap<GlobalAttributeIdKey, HashedAttribute>;
}

export type {HashedConfiguration as default};