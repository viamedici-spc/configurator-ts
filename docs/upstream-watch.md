---
status: living
---

# Upstream watch

Things we would do differently if a dependency or a tool allowed it, each with the one command that says whether it does
yet.

⚠️ **Nobody polls this file.** It is read when somebody upgrades the dependency in question.

## fp-ts, monocle-ts and morphic-ts

### Import them by their public subpaths in the output

- **We would rather** emit `fp-ts/Option`, `monocle-ts/Lens` and `@morphic-ts/batteries/lib/…` as written in the
  sources.
- **We do instead** rewrite these imports to full ES module paths in `tsdown.config.ts`.
- **What blocks it:** none of them has an `exports` map, so strict ESM resolution cannot resolve their subpaths.
- **Check** (an `exports` field means the gate has lifted for that package):

  ```bash
  npm view fp-ts@latest exports; npm view monocle-ts@latest exports; npm view @morphic-ts/batteries@latest exports
  ```

- **What it would buy:** the plugin in `tsdown.config.ts` goes away, and applications testing with Vitest no longer need
  `server.deps.inline` (README).
- **Upstream:** all three are in maintenance or unmaintained; whether to keep them is open (see discussion points).
- **Last checked:** fp-ts 2.16.11, monocle-ts 2.3.13 and @morphic-ts/batteries 3.0.0, 2026-11-26: no `exports`
  field.

### Let @morphic-ts load tslib itself

- **We would rather** not depend on `tslib`; the library does not use it.
- **We do instead** keep `tslib` in `dependencies`, because `@morphic-ts/eq-interpreters` requires it without declaring
  it.
- **Check** (a `tslib` entry means the gate has lifted):

  ```bash
  npm view @morphic-ts/eq-interpreters@latest dependencies
  ```

- **What it would buy:** one dependency less.
- **Upstream:** not reported; morphic-ts is unmaintained.
- **Last checked:** 3.0.0, 2026-11-26: not declared.

## Bun

### Publish with `bun publish`

- **We would rather** publish with `bun publish`.
- **We do instead** pack with `bun pm pack` and publish with `npm publish` in the shared CI workflow.
- **What blocks it:** `bun publish` cannot use npm trusted publishing (OIDC).
- **Check** (`CLOSED` means it may have landed):

  ```bash
  gh issue view 22423 --repo oven-sh/bun --json state --jq .state
  ```

- **What it would buy:** no Node.js setup in the publish job.
- **Upstream:** https://github.com/oven-sh/bun/issues/22423
- **Last checked:** Bun 1.4.5, 2026-11-26: open.

### Lint with `bun lint`

- **We would rather** lint with Bun itself.
- **We do instead** run oxlint (`bun run lint`).
- **What blocks it:** Bun has no released linter.
- **Check** (a line means Bun lists `lint` among its own commands; inside this repository `bun lint` would run the
  package's `lint` script instead):

  ```bash
  bun --help | grep -w lint
  ```

- **What it would buy:** one tool less.
- **Upstream:** Bun release notes.
- **Last checked:** Bun 1.4.5, 2026-11-26: no `lint` command.

### `toIncludeSameMembers`, `toSatisfyAll` and `toSatisfyAny` in `bun:test`

- **We would rather** use built-in matchers.
- **We do instead** define them in `tests/testSetup.ts`.
- **Check** (prints `function` once Bun has it):

  ```bash
  bun -e 'import {expect} from "bun:test"; console.log(typeof expect([]).toIncludeSameMembers)'
  ```

- **What it would buy:** `tests/testSetup.ts` and `tests/matchers.d.ts` go away.
- **Upstream:** not reported.
- **Last checked:** Bun 1.4.5, 2026-11-26: not built in.

## TypeScript and tsdown

### Declarations with TypeScript 7.1 and tsdown 0.24

- **We would rather** emit the declarations with TypeScript 7.1 and follow tsdown's releases.
- **We do instead** keep `typescript` at 7.0.2 and tsdown below 0.24 (`^0.23.7`). The build warns that tsdown's `tsgo`
  generator on TypeScript 7.0 is deprecated and goes away in tsdown's next minor.
- **What blocks it:** TypeScript 7.1 is not released; only its beta and nightly builds are published.
- **Check** (7.1 or later means it is released; then raise `typescript` first and tsdown after, not before):

  ```bash
  npm view typescript dist-tags.latest
  ```

- **What it would buy:** the deprecation warning goes away, and tsdown can move past 0.23.
- **Upstream:** TypeScript's release notes.
- **Last checked:** 2026-11-26: latest 7.0.2, 7.1 only as 7.1.0-beta.
