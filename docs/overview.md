---
status: accepted
---

# configurator-ts

## Purpose

A TypeScript client for SPC's configuration engine: it opens a configuration session against the engine's REST API,
keeps the session's state (attributes, decisions, consequences, satisfaction), applies decisions optimistically,
explains why a state is not possible, stores and restores configurations, and resumes a session the engine has lost.
Applications build their configurator UI on its typed, immutable domain model instead of the wire contract.

Out of scope: rendering, server-side use (the REST API serves that), and modeling (configuration models are made in
SPC's modeling tools).

## Public contract

- The entry point `src/index.ts` exports `SessionFactory` (creates an `IConfigurationSession`), the domain types of
  `src/contract/Types.ts`, the `ConfiguratorError` union, the interpreters (`AttributeInterpreter`,
  `ConfigurationInterpreter`, `ChoiceValueInterpreter`), the refinements, the `Eq` instances, `Logger` and the
  stored-configuration types.
- The stored-configuration types are plain readonly types;
  `src/contract/storedConfiguration/StoredConfigurationCodec.ts` validates them at runtime.

## Invariants

- **No wire type leaves the library, and no public type derives from one.** The generated wire types
  (`src/apiClient/engine/`) are mapped to the domain in `src/domain/mapper/`; the public types are written by hand
  ([ADR 0004](adr/0004-engine-client-and-hand-written-public-types.md)).
- **Every public type is immutable** (readonly properties, readonly collections).
- **A failure a caller can meet is a `ConfiguratorError`**, delivered as a rejected promise or in a result type.
- **The published typings need neither fp-ts internals nor morphic-ts**: they pass a type check without `skipLibCheck`.

## Architecture

`ConfigurationSession` wraps an XState machine (`src/domain/WorkProcessingMachine.ts`) that serializes the work on a
session: decisions, explanations, context changes, restoring a lost session. Engine calls are fp-ts `TaskEither`s in
`src/domain/logic/EngineLogic.ts`, sent by openapi-fetch (`src/domain/EngineApiClient.ts`); optimistic decisions are
applied in `src/domain/logic/OptimisticDecisions.ts` and reconciled with the engine's answer. Feature notes:
[fixed decisions](features/fixed-decisions.md).

## Supported environments

Browsers, as ESM, through a bundler or inside a CDN bundle; not Node.js
([ADR 0001](adr/0001-browser-target-and-esm-only.md)).

## Commands

| Command | What it does |
|---|---|
| `bun install` | Installs the dependencies (Bun is the package manager; see `packageManager` in `package.json`). |
| `bun run verify` | The gate, its steps in parallel: type check of sources, tests, `scripts/` and `package-check/`, lint, format check, tests, build with package checks (`package.json` unchanged, consumer type check, publint, arethetypeswrong). |
| `bun run test` | Runs the tests; the contract tests need `HCA_ENGINE_ACCESS_TOKEN` (see `.env.example`). |
| `bun run build` | Builds `dist/`. |
| `bun run --filter scripts generate-engine-types` | Regenerates the wire types in `src/apiClient/engine/Engine.ts` from the engine's OpenAPI document. |
| `bun fmt` | Formats the code. |

The toolchain: [ADR 0002](adr/0002-bun-toolchain.md).

## Links

- [AGENTS.md](../AGENTS.md): the rules for working in this repository.
- [upstream-watch.md](upstream-watch.md), [discussion-points.md](discussion-points.md), [backlog.md](backlog.md).
