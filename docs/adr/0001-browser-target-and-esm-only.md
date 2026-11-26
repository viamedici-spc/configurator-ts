---
status: accepted
---

# ADR 0001: The library targets browsers and ships ES modules only

Date: 2026-11-26

## Context

configurator-ts runs in configurator applications in the browser: through a bundler, or inside the self-contained bundle
of configurator-framer loaded from a CDN. Server-side integrations use the engine's REST API directly. The package used
to ship ES modules and CommonJS side by side, without `"type": "module"`, to keep older bundlers working; the ES build
was not standard ESM, and a consumer reported that it cannot be imported in plain Node.js
([issue #2](https://github.com/viamedici-spc/configurator-ts/issues/2)).

fp-ts 2.x, monocle-ts and morphic-ts have no `exports` map. Strict ESM resolution, as webpack 5 applies it to a
`"type": "module"` package, rejects extensionless subpaths such as `fp-ts/Option`.

## Decision

The package is ESM only (`"type": "module"`, `exports` with the ES module and its declarations) and supports browsers
through a bundler or a CDN bundle. Node.js is not a supported runtime. All dependencies stay external; the JavaScript
output imports the ES modules of fp-ts, monocle-ts and morphic-ts by full path, the declarations keep the usual paths.

## Consequences

- No CommonJS build; `require` is not supported.
- Plain Node.js cannot import the package: it loads fp-ts's ES files, but cannot resolve their imports, which have no
  file extension. Tests run in Bun.
- In server-side rendering frameworks the library runs on the client only.
- The default log level is set in code (`error`), no longer derived from the bundler's build mode.
- Test runners that run in Node.js (Vitest) must let their bundler transform fp-ts and the SPC packages
  (`server.deps.inline`, see the README); the alternative, inlining fp-ts into this package, was not chosen: it would
  duplicate fp-ts for consumers that use it directly. Whether fp-ts stays is open (discussion point *fp-ts and
  morphic-ts*); dropping it would remove the setting.

## Alternatives considered

- **Keep CommonJS beside ESM:** no supported environment needs it, and it made the ES build non-standard.
- **Inline fp-ts, monocle-ts and morphic-ts:** would duplicate fp-ts for consumers that use it directly.
- **Support Node.js:** not a runtime this library targets: server-side integrations use the engine's REST API, as the
  context says.
