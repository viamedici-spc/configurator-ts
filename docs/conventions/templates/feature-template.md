---
status: draft
---

# <Feature name>

<!-- Only for a feature whose flow or edge cases need more than TSDoc. Describes the feature as it is: no rollout or
     migration notes (changelog), no follow-ups (the lists). A feature spanning libraries gets one note per library,
     each linking the lower layer's note instead of restating it. -->

## Goal

<What a consumer can do with it, and why it exists.>

## User-visible behavior

- <What a consumer observes, naming the public members involved (their contract is in their TSDoc).>

```ts
// A short example that compiles against the current API.
```

## Edge cases / rules

- **<Rule>.** <What happens, and why where it is not obvious.>

## Flow

1. <The sequence across the library's parts, down to the engine's public REST API where it matters.>

## Tests that define behavior

- `<path from the repository root>`: <what the test pins down.>

## Links

- <Related ADRs, the feature note of the layer below, the main source files.>
