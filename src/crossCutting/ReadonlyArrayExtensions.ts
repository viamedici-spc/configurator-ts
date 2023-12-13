import {pipe} from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import {Eq} from "fp-ts/Eq";

export const updateBy = <T>(eq: Eq<T>) =>
    (value: T) =>
        (a: ReadonlyArray<T>) => pipe(
            a,
            RA.findIndex(i => eq.equals(i, value)),
            O.map(index => pipe(a,
                    RA.modifyAt(index, _ => value)
                )
            ),
            O.flatten,
            O.getOrElse(() => pipe(a, RA.concat(RA.of(value))))
        );

export const replace = <T>(eq: Eq<T>) =>
    (oldValue: T, newValue: T) =>
        (a: ReadonlyArray<T>) => pipe(
            a,
            RA.findIndex(i => eq.equals(i, oldValue)),
            O.chain(index => pipe(
                    a,
                    RA.modifyAt(index, _ => newValue)
                )
            )
        );