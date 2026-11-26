declare module "bun:test" {
    interface Matchers<T = unknown> {
        /** Passes when both arrays hold the same members in any order (deep equality; duplicates count). */
        toIncludeSameMembers(expected: ReadonlyArray<unknown>): void;
        /** Passes when every member of the array satisfies the predicate. */
        toSatisfyAll<M = unknown>(predicate: (member: M) => boolean): void;
        /** Passes when at least one member of the array satisfies the predicate. */
        toSatisfyAny<M = unknown>(predicate: (member: M) => boolean): void;
    }
}

export {};