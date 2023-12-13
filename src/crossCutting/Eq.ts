import {Eq, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";

export function getNullableEq<A>(eq: Eq.Eq<A>): Eq.Eq<A | null | undefined> {
    return {
        equals(x, y) {
            // Check for both being null or undefined
            if (x === null || x === undefined) {
                if (y === null || y === undefined) {
                    return true;
                }
            }

            // Check if only one is null or undefined
            if (x === null || x === undefined || y === null || y === undefined) {
                return false;
            }

            return eq.equals(x, y);
        }
    };
}

export function getNullTolerantReadOnlyArrayEq<A>(eq: Eq.Eq<A>): Eq.Eq<ReadonlyArray<A> | null | undefined>{
    return {
        equals(x, y) {
            const xSafe = pipe(O.fromNullable(x), O.getOrElse(():ReadonlyArray<A>  => []));
            const ySafe = pipe(O.fromNullable(y), O.getOrElse(():ReadonlyArray<A>  => []));

            return RA.getEq(eq).equals(xSafe, ySafe);
        }
    };
}