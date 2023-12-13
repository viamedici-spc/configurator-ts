import {constVoid, TE} from "@viamedici-spc/fp-ts-extensions";


export function filterNullOrElse<TL, TR>(onLeft: () => TL): (value: TE.TaskEither<TL, TR>) => TE.TaskEither<TL, TR> {
    return value => TE.filterOrElse<TL, TR>(a => a != null, onLeft)(value);
}

export function rightOfVoid<E = never>(): TE.TaskEither<E, void> {
    return TE.right(constVoid());
}