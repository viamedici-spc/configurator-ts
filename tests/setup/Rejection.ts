/** The reason a promise rejects with; fails if it resolves. bun:test's `rejects` modifier does not support `toSatisfy`. */
export async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
    return promise.then(
        value => {
            throw new Error(`Expected a rejection, but the promise resolved with ${Bun.inspect(value)}`);
        },
        (reason: unknown) => reason,
    );
}
