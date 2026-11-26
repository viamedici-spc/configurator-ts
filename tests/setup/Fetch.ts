/**
 * Replaces the global fetch for a test. Bun's `typeof fetch` carries a `preconnect` member that a plain function lacks,
 * so the assignment goes through here instead of a cast at every call site.
 */
/** A plain fetch function, as tests write and mock it. */
export type FetchFunction = (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;

export function setFetch(fetchFunction: FetchFunction): void {
    globalThis.fetch = fetchFunction as typeof fetch;
}
