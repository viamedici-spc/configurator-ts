---
status: draft
---

# <Library name>

<One paragraph: what the library is and who uses it. The README says the same for a first-time user; this document is
the authoritative entry for anyone changing the library.>

## Purpose

<What the library is for.>

**Out of scope:** <what it deliberately does not do, and where that lives instead.>

## Public contract

The entry point is `src/index.ts`. <What it exports, by name and grouped by purpose, with a link to the TSDoc or the
feature note for each group. Name and link; do not restate signatures.>

## Invariants

- <What always holds for a consumer, e.g. "no wire type is reachable from the entry point".>

## Architecture

<The layers or modules and what each owns, the direction of their dependencies, and how the library builds on the SPC
library below it. A Mermaid diagram where it helps.>

## Supported environments

- **Browsers**, as ESM, through a bundler, or inside a self-contained bundle loaded from a CDN.
- **Not Node.js.** Server-side use goes through the engine's REST API.
- **SSR frameworks:** client-side only.

<!-- per-library: the minimum versions of peer dependencies (e.g. React), and the Framer bundle for
     configurator-framer. -->

## Commands

| Command | What it does |
|---|---|
| `bun install` | installs the dependencies |
| `bun run verify` | the gate: type check, lint, format check, tests, build, package checks |
| `bun check` | type check |
| `bun fmt` | formats the code |
| `bun run build` | builds `dist/` |

<!-- per-library: the test command and anything a test needs, such as the local engine configuration. -->

## What this still has open

<One sentence naming the live entries of discussion-points.md by title, with a link; or drop the section.>

## Links

- [Vision](vision.md)
- [ADRs](adr/)
- [Conventions](conventions/documentation.md)
