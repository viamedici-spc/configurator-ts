/**
 * Replaces the global fetch for a test. Bun's `typeof fetch` carries a `preconnect` member that a plain function lacks,
 * so the assignment goes through here instead of a cast at every call site.
 */
/** A plain fetch function, as tests write and mock it. */
export type FetchFunction = (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;

export function setFetch(fetchFunction: FetchFunction): void {
    globalThis.fetch = fetchFunction as typeof fetch;
}

/** The parts of a fetch call the tests look at. */
export type FetchCall = {readonly url: string; readonly method: string; readonly headers: Headers};

/**
 * Reads URL, method and headers of a fetch call, whether it passed a `Request` (as the engine client does) or a URL with
 * `RequestInit`. The URL comes normalized (`new URL(…).href`). It never reads the body, so the call can still be
 * forwarded to the real fetch.
 */
export function describeFetchCall(input: Parameters<typeof fetch>[0], init?: RequestInit): FetchCall {
    if (input instanceof Request) {
        return {url: new URL(input.url).href, method: input.method, headers: input.headers};
    }

    return {url: new URL(input.toString()).href, method: init?.method ?? "GET", headers: new Headers(init?.headers)};
}

/** A JSON response with the given status, as the engine sends it. */
export function jsonResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {"Content-Type": "application/json"}});
}