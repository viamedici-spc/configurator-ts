import defaults from "./config.json";

/**
 * Where the contract tests reach the engine. The access token is not part of the repository: CI passes it as
 * `HCA_ENGINE_ACCESS_TOKEN`, and locally it goes into the git-ignored `.env.test.local`, which `bun test` loads (see
 * `.env.example`). Pull requests from forks get no secrets, so they skip the tests that need the engine.
 */
const accessToken = process.env["HCA_ENGINE_ACCESS_TOKEN"] || undefined;
const isPullRequestFromFork = process.env["GITHUB_EVENT_NAME"] === "pull_request" && accessToken === undefined;

if (accessToken === undefined && !isPullRequestFromFork) {
    throw new Error(
        "HCA_ENGINE_ACCESS_TOKEN is not set. Put it into .env.test.local (see .env.example for where to find it).",
    );
}

/** Whether the tests that need the live engine run; false only in pull requests from forks. */
export const engineAvailable: boolean = accessToken !== undefined;

const config = {
    endpoints: {
        engine: process.env["HCA_ENGINE_ENDPOINT"] || defaults.endpoints.engine,
    },
    credentials: {
        engine: {accessToken: accessToken ?? ""},
    },
};

export default config;
