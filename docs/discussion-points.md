---
status: living
---

# Discussion points

What is undecided. A decision moves to *Resolved* with a link to where it is recorded.

## Open

### fp-ts and morphic-ts

Both are in maintenance (fp-ts) or unmaintained (morphic-ts). Whether to keep them, move to Effect, or drop an FP
library is open; the public typings already depend on neither's internals.

## Resolved

- **The generator for the engine client** (2026-11-26): openapi-typescript and openapi-fetch, generator in its own
  `scripts/` package, public types written by hand — [ADR 0004](adr/0004-engine-client-and-hand-written-public-types.md).
