# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the library source, organized in layers:
  - `src/contract/` is the public API surface: domain `Types.ts`, `ConfiguratorError.ts`, equality instances (`Eqs.ts`), `interpreter/`, `refinements/`, and `storedConfiguration/`.
  - `src/domain/` is internal: `domain/logic/` (session/engine logic), `domain/mapper/` (engine⇄domain mapping), `domain/model/`.
  - `src/apiClient/engine/Engine.ts` is the generated REST client and wire types for the Configuration Engine (see `npm run swagger`). Treat it as generated output.
  - `src/crossCutting/` holds shared helpers; `src/index.ts` is the public entry point (`SessionFactory`, contract types, errors, interpreters).
- `tests/` holds Vitest tests: `tests/area/contract/` (public-API / live-engine tests), `tests/area/internal/` (internal units), `tests/setup/` (helpers), `tests/data/` (fixtures).
- `dist/` is the build output (ESM `index.js`, CJS `index.cjs`, types `index.d.ts`). `docs/` holds conventions. `scripts/` holds tooling.

## Architecture Overview
- SPC uses a backend Configuration Engine (session-based REST API) that solves configuration decisions and returns consequences.
- This package (configurator-ts) is the TypeScript client on top of that API: it manages sessions, automatic resume on `SessionNotFound`, optimistic decisions, and maps the wire contract to a stable domain contract.
- `configurator-react` and `configurator-framer` build on this client. Keep the public `contract/` stable and backwards compatible, and never leak `Engine.*` wire types through `src/index.ts`.

## Build, Test, and Development Commands
- `npm run build` builds the library with Vite and generates bundled type declarations into `dist/`.
- `npm test` runs Vitest once. Contract tests run against a real Configuration Engine.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run typecheck` runs TypeScript without emitting.
- `npm run swagger` regenerates `src/apiClient/engine/Engine.ts` from the engine's OpenAPI document.

## Coding Style & Naming Conventions
- TypeScript; 4-space indentation; semicolons.
- Functional style with `@viamedici-spc/fp-ts-extensions`/`fp-ts` and `ts-pattern` (`match(...).with(...).exhaustive()`); prefer exhaustive matches over `if` chains.
- PascalCase for types (`SessionContext`, `ExplicitDecision`), camelCase for functions/mappers (`mapSessionContext`).
- Respect the layering: `contract` (public domain types) ↔ `domain/mapper` ↔ `apiClient/engine` (wire types). When you add a field to a public type (e.g. `SessionContext`), update its `Eq` in `src/contract/Eqs.ts` — `Eq.struct` requires every key.

## Testing Guidelines
- Vitest; test files are `*.test.ts` under `tests/area/`.
- Contract tests are integration tests that hit a live engine. They read `endpoints.engine` and `credentials.engine.accessToken` from `tests/config.json` (shallow-merged with `tests/config.local.json`, which takes precedence).
- Run `npm run typecheck` and `npm test` before pushing — the publish pipeline runs the test suite and a red test blocks the release.

## Commit & Pull Request Guidelines
- Commit history uses short, sentence-case messages, typically past tense (e.g. "Added support for fixed decisions").
- Keep commits focused and avoid noisy, multi-topic changes. Ask before committing.
- PRs should include a brief summary and testing notes; link related issues when applicable.

## Release & Versioning
- `.github/workflows/main.yml` runs on every push and builds, tests, and publishes via the shared `viamedici-spc/github-ci` workflow (trusted publishing).
- Branch builds publish a prerelease (`<base>-<branch>-<timestamp>`) under a dist-tag named after the branch; clean releases come from version tags. Dependent packages should pin the exact published version.

## Configuration Tips
- `src/apiClient/engine/Engine.ts` is generated; change the OpenAPI source/endpoint in `scripts/swaggerGeneration.mjs` and rerun `npm run swagger` instead of hand-editing the output.
- `tests/config.json` carries the default engine endpoint/token for tests; override locally via `tests/config.local.json`.

## Documentation
- Conventions live under `docs/conventions/` (e.g. `changelog.md`). Follow the changelog convention when writing release notes (see `CHANGELOG.md`).
