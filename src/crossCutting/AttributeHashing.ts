import {flow, I} from "@viamedici-spc/fp-ts-extensions";
import SparkMD5 from "spark-md5";
import {attributeShow} from "../contract/Shows";
import {Attribute} from "../contract/Types";
import {HashedAttribute} from "../domain/model/HashedAttribute";

export const calculateAttributeHash = flow(
    attributeShow.show,
    I.map(s => SparkMD5.hash(s))
);

export function hashAttribute(attribute: Attribute): HashedAttribute {
    return {
        ...attribute,
        hash: calculateAttributeHash(attribute),
    };
}