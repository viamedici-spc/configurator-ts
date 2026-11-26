---
status: accepted
---

# ADR 0003: The public stored-configuration types are plain readonly types

Date: 2026-11-26

## Context

The stored-configuration types were derived from their morphic-ts codecs (`AType<typeof Codec>`), so the published
declarations carried morphic's types. Those fail a full type check without `skipLibCheck`, and under TypeScript 7 they no
longer resolve to the intended shapes at all. morphic-ts is no longer maintained.

## Decision

`src/contract/storedConfiguration/StoredConfigurationV1.ts` and `StoredConfiguration.ts` declare the types by hand as
readonly types. The morphic codecs stay, internal, for validation (`StoredConfigurationCodec.ts`). The test
`tests/area/internal/StoredConfiguration.test.ts` validates a configuration with every decision type, typed with the
public type, so codecs and types cannot drift apart unnoticed.

## Consequences

- The declarations reference neither morphic-ts nor its internals.
- The arrays in these types are readonly (`ReadonlyArray`); code that mutated a stored configuration in place no longer
  compiles.
- A new schema version adds its type and its codec side by side, and a fixture to the test.

## Alternatives considered

- **A type-level equality check against the codecs:** cannot work while morphic's types do not resolve under
  TypeScript 7.
- **Replace morphic-ts now:** the choice of a validation library belongs to the decision about fp-ts, which is open.
