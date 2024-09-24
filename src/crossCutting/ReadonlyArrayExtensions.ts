import {Eq, EqT, O, pipe, RA, some} from "@viamedici-spc/fp-ts-extensions";

export type SingleOrArray<T> = T | ReadonlyArray<T>;

const isArray = <T>(a: SingleOrArray<T>): a is ReadonlyArray<T> => Array.isArray(a);

export function fromSingleOrArray<T>(a: SingleOrArray<T>): ReadonlyArray<T> {
    if (isArray(a)) {
        return a;
    }
    return [a];
}

export function getUnsortedArrayEq<A>(eq: EqT<A>): EqT<ReadonlyArray<A>> {
    return Eq.fromEquals<ReadonlyArray<A>>((x, y) => {
        return x.length === y.length && pipe(
            x,
            RA.reduce(some(y), (b, a) => pipe(
                b,
                O.chain(b => pipe(
                    b,
                    RA.difference(eq)([a]),
                    // The size must have changed, otherwise the item was not found.
                    O.fromPredicate(n => n.length !== b.length)
                ))
            )),
            // The array must be empty, otherwise one array was larger than the other.
            O.filter(RA.isEmpty),
            O.isSome
        );
    });
}
