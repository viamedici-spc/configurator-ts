---
status: living
---

# Code conventions

How code in this library is written and checked. [documentation.md](documentation.md) governs the documents; this one
the code, including TSDoc and what a code comment may say. Living: it grows as patterns settle.

## Verification

```bash
bun run verify
```

From the repository root, before a change counts as done. It is the one gate, and CI runs the same command: type check
(`bun check`), lint (oxlint), format check, tests, build, and the package checks (publint and arethetypeswrong) against
the built output. The build is part of it only because the package checks need the artifact; on its own it proves
nothing. `bun fmt` is not a verdict either: it rewrites rather than reports, so it always succeeds; the format check is
the one that answers.

The test step is `bun test` with the native `bun:test` API. The contract tests in `tests/area/contract/`
need the live engine and its access token in `HCA_ENGINE_ACCESS_TOKEN` (locally in the git-ignored `.env.test.local`,
see `.env.example`); without the token they fail with that hint, except in pull requests from forks, which skip them.
**A step is green when its exit code is 0, and only then.** Silence is not green. Never wrap a check so that failing
produces *less* output than passing: `… && echo ok` prints nothing at all on a failure, so the result is one missing
line in a list of green ones. Run each step on its own and let its status be seen. **A suite that did not run is not a
suite that passed**: a skipped contract test is reported as skipped, never counted as green.

**The type check covers every directory that holds code** (`src`, `tests`, scripts) and every `.ts` file at the root,
such as the build and test configuration. A test outside the type check can hold any type error while the gate stays
green. The check is `ls *.ts` against the `include` array.

**A script that runs another one writes `bun run <name>`**, never `bun <name>`: `bun test` starts Bun's own test runner
and `bun build` its bundler, each ignoring a script of that name. In a library tested with Vitest, `bun test` silently
runs the wrong runner.

## The public API

- **The entry point is the contract.** Everything exported from it is public and covered by semantic versioning; what
  is not exported is internal and may change in any release. Nothing becomes public by accident: a new export is a
  deliberate change with a changelog entry.
- **Backwards compatible by default.** A new property is optional, a new parameter comes last and is optional, a
  removed or renamed member is deprecated first (`@deprecated` with its replacement) and goes in a major release. A
  breaking change is listed under *Changes* in the changelog with what a consumer has to do.
- **Public types are immutable**: `readonly` properties, `ReadonlyArray`, `ReadonlyMap`. A consumer never receives
  something it is expected not to mutate without the type saying so.
- **Explicit types on the public API.** The build emits the `.d.ts` files with the TypeScript 7 compiler, which infers
  what is not written; so an exported function of the public API states its return type and an exported constant its
  type, and the declaration a consumer reads is the one written, not an inferred one that changes with the
  implementation.
- **No wire types through the entry point.** Generated client types stay behind the mapping layer; a consumer sees only
  the library's own domain types.
- **ESM only, browser only.** No `node:*` imports, no `process`, no `Buffer`, nothing that needs a Node.js runtime. A
  module's top level does not touch `window`, `document` or other browser globals, so importing it during a
  server-side render does not throw; the work starts when the client calls in.

The layers: `src/contract/` holds the public types, `src/domain/mapper/` maps between them and the generated
wire types in `src/apiClient/engine/`, which never leave the library through `src/index.ts`. A new field on a public
type also updates its `Eq` in `src/contract/Eqs.ts`, since `Eq.struct` requires every key.

### TSDoc on the public API

**Every public type, property, function, hook, component and method carries TSDoc.** Its readers are application
developers and coding agents, who meet it in their editor and often read nothing else. So it says what the signature
cannot:

- **purpose:** what the member is for, in one sentence that does not restate its name;
- **semantics:** what each parameter and the result mean, what `undefined` or `null` means where a type admits it, and
  how the member behaves on a failure (`@returns`, `@param`, `@throws` only for what is actually thrown);
- **defaults:** `@defaultValue` for every optional property or parameter that has one;
- **pitfalls:** the trap a caller falls into (`@remarks`): a referential-equality requirement, an ordering, a value the
  engine trims away;
- **an example** (`@example`) where the shape of a correct call is not obvious, short and compiling against the current
  API.

```ts
/**
 * Decisions passed once when the session is created; they stay in force for the session's lifetime.
 *
 * @remarks Use them for system context such as a sales region, not for user choices: explain never offers to undo a
 * fixed decision.
 * @defaultValue no fixed decisions
 */
readonly fixedDecisions?: ReadonlyArray<FixedDecision>;
```

Link related members with `{@link Name}` rather than describing them. **In existing code TSDoc is added whenever a
public member is touched**, for that member and the type it belongs to; a pull request that changes the public API and
leaves it undocumented is not done. TSDoc is exempt from the comment rules below where they would cut a contract short,
but not from their spirit: no history, no dates, no internals
([documentation.md](documentation.md#this-repository-is-public)).

## Formatting and naming

`bun fmt` owns the layout. PascalCase for types, components and classes, camelCase for functions, hooks and values.

## Functional style

- **fp-ts throughout:** `pipe`, `Option`, `Either`, `TaskEither`, the `ReadonlyArray` and `ReadonlyRecord` modules, via
  `@viamedici-spc/fp-ts-extensions` where it adds what is needed. Data flows through pure functions; side effects sit at
  the edges.
- **An expected failure is a value, a defect is an exception.** Inside the library, a failure a caller can meet travels
  as `Either` or `TaskEither` with a typed error, so a new failure nobody handled is a compile error. At the public
  boundary it becomes the library's documented error type, never an untyped throw.

The public error type is `ConfiguratorError`, a union tagged by `type` (`ConfiguratorErrorType`); a session's
methods reject their promise with it.

## A union is consumed exhaustively, with `ts-pattern`

Nothing about a union makes it safe on its own: a chain of `if`s over one still compiles the day a member is added, and
returns `undefined` at the one call site that forgot. **So a value produced from a union is produced with
`match(…).with(…).exhaustive()`**, which is a type error when a member is unhandled; add `.returnType<T>()` where the
result type matters.

```ts
return match(decision)
    .with({kind: DecisionKind.Explicit}, (d) => mapExplicit(d))
    .with({kind: DecisionKind.Implicit}, () => O.none)
    .exhaustive();
```

**What it does not replace:** a two-member union inside one function that never leaves it. The test is whether a reader
elsewhere has to be told about a new member.

## Values and state

- **An optional field is absent or valid.** Never an empty string or an empty array standing for "none". Where a public
  type admits `null` beside `undefined`, `null` has a meaning of its own (a reset, say) and TSDoc states it.
- **Don't store what's derivable.** A value that is always determined by another (a label from a type, a flag from a
  state) is computed, not kept beside its source: a derived atom or a selector, never a second atom written in step.
  One source of truth cannot drift.

## Dependencies between the libraries

A library that builds on another pins its **exact published version**, released first. A change that needs a change
below it is released bottom-up: `fp-ts-extensions`, `configurator-ts`, `configurator-react`, `configurator-framer`.

## Tests

A test states behavior a consumer can observe, through the public API wherever it can reach it; an internal unit gets a
test of its own where its logic is worth pinning down by itself. Test data is invented and public: no customer models,
no internal hosts, no real person ([documentation.md](documentation.md#this-repository-is-public)). Non-public test
configuration, such as an endpoint or a token, lives in a git-ignored local file.

Tests live in `tests/area/contract/` (through the public API, partly against the live engine) and
`tests/area/internal/` (internal units); helpers in `tests/setup/`, fixtures in `tests/data/`.

## Code comments

**The question a comment has to answer is not whether it is useful, but where it belongs.**

| goes in | what |
|---|---|
| the **commit message** | why this change, what was measured, what was tried and dropped |
| a **state document or ADR** | the decision, its alternatives, and the constraint it rests on |
| **TSDoc** | the contract of a public member, as above |
| a **code comment** | only what cannot be read off the code **and** is needed to change it safely |

Comments are maintained far less than the code beside them, so every paragraph is surface area for going stale, and a
stale comment is worse than none because it is still read as true. The rules below are the consequences.

- **A comment states the current state.** No "previously", no "after the migration", no "this used to". A correction
  belongs in the commit that made it; the code keeps the trap, stated once, as it now is.
- **No dates, no measurements, no counts.** `git blame` has the date; a measured number is evidence for a decision and
  belongs in its commit; a count ("the three cases") goes stale the moment the thing it counts grows.
- **No provenance.** "Borrowed from", "another project does it differently" never helps the person changing the line.
- **No internals of anything outside this repository** ([documentation.md](documentation.md#this-repository-is-public)).
  A workaround for an engine behavior names the observable behavior, not its cause.
- **What a test can state, the test states.** An executable claim cannot rot; a paragraph asserting the same thing can.
- **The deletion test decides:** would someone change this code wrongly if the comment were gone? If not, it goes.
- **A `⚠️` is earned per comment**, and the bar is *nothing else can hold this*: a trap outside the reach of the type
  checker and the tests, such as a browser behavior, a consumer's expectation, or a workaround for a dependency
  ([upstream-watch.md](../upstream-watch.md)). A marker that appears everywhere warns nowhere. No shouted capitals.

A note on deliberately unidiomatic code stays, since it is the one thing a reader will otherwise tidy away. When a
comment block is longer than the function beneath it, the explanation belongs in a document and the comment should be
the pointer to it. **This binds agents in particular**: verbose commentary is a strong default in current models and
survives being told otherwise.

### A path in a code comment is written from the repository root

`docs/adr/0001-….md`, `src/domain/mapper/DomainToEngineMapping.ts`: never with a run of `../`, and never relative to a
folder the reader has to guess. **A path with no `../` in it cannot be wrong by one**, and nothing renders a comment, so
its only reader is a person with the tree in front of them. A file in another repository is named, not given a path.

This is a code comment's rule and not a Markdown link's: a link in a `.md` file stays relative to its own file, because
that is what renders.

