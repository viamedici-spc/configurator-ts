import * as Endo from "fp-ts/Endomorphism";
import {MO} from "@viamedici-spc/fp-ts-extensions";
import {Endomorphism} from "fp-ts/Endomorphism";

export function reduceUpdateFunctions<T>(updates: ReadonlyArray<Endomorphism<T>>): Endomorphism<T> {
    return MO.concatAll(Endo.getMonoid<T>())(updates);
}