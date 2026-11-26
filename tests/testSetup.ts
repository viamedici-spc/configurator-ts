import {expect} from "bun:test";

// bun:test has most of the extra matchers the tests use (toBeNil, toSatisfy, toBeEmpty, toEndWith, toBeFalse); these are
// the ones it lacks.
expect.extend({
    /** Passes when both arrays hold the same members in any order (deep equality; duplicates count). */
    toIncludeSameMembers(received: unknown, expected: ReadonlyArray<unknown>) {
        const remaining = [...expected];
        const pass =
            Array.isArray(received) &&
            received.length === expected.length &&
            received.every(item => {
                const index = remaining.findIndex(candidate => Bun.deepEquals(item, candidate));
                return index >= 0 && remaining.splice(index, 1).length === 1;
            });
        return {
            pass,
            message: () =>
                `expected ${Bun.inspect(received)} ${pass ? "not " : ""}to include the same members as ${Bun.inspect(expected)}`,
        };
    },
    /** Passes when every member of the array satisfies the predicate. */
    toSatisfyAll(received: unknown, predicate: (member: never) => boolean) {
        const pass = Array.isArray(received) && received.every(member => predicate(member as never));
        return {
            pass,
            message: () =>
                `expected every member of ${Bun.inspect(received)} ${pass ? "not " : ""}to satisfy the predicate`,
        };
    },
    /** Passes when at least one member of the array satisfies the predicate. */
    toSatisfyAny(received: unknown, predicate: (member: never) => boolean) {
        const pass = Array.isArray(received) && received.some(member => predicate(member as never));
        return {
            pass,
            message: () =>
                `expected some member of ${Bun.inspect(received)} ${pass ? "not " : ""}to satisfy the predicate`,
        };
    },
});