---
status: accepted
---

# Vision

## Goals

- Every capability of the configuration engine is reachable through a typed, immutable domain model, so a configurator
  never handles the REST contract itself.
- A configurator feels immediate: decisions apply optimistically, a lost session resumes without the user noticing.
- The library is the common base of SPC's client libraries (configurator-react, configurator-framer) and stays
  framework-independent.

## Non-goals

- Rendering or UI state; the libraries above do that.
- Server-side use in Node.js; the REST API serves that.

## Audiences

Developers of configurator applications, and the coding agents that help them, reading the TSDoc and these documents.
