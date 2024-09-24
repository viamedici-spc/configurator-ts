import {EqT} from "@viamedici-spc/fp-ts-extensions";
import {Refinement} from "fp-ts/Refinement";

export type UnionEqBuilder<U, E extends U> = [U] extends [E]
    ? EqT<U>
    : {
        with: <T1 extends Exclude<U, E>>(ref: Refinement<Exclude<U, E>, T1>, eq: EqT<T1>) => UnionEqBuilder<U, E | T1>,
    };

export function union<U>(): UnionEqBuilder<U, never> {
    const getBuilder = (members: ReadonlyArray<[Refinement<unknown, unknown>, EqT<unknown>]>) => ({
        equals: (x: unknown, y: unknown) => {
            for (const [ref, eq] of members) {
                if (ref(x) && ref(y)) {
                    return eq.equals(x, y);
                }
            }
            return false;
        },
        with: (ref: Refinement<any, any>, eq: EqT<any>) => {
            return getBuilder([...members, [ref, eq]]);
        }
    });

    return getBuilder([]);
}