import {Attribute} from "../../contract/Types";

export type HashedAttribute = Attribute & { readonly hash: string; };
export const isHashedAttribute = (a: Attribute): a is HashedAttribute => (a as HashedAttribute).hash != null;