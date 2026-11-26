# Changes

## ESM only, for browsers

- **ES modules only:** the package ships one ES module with its type declarations and no CommonJS build anymore. Use it
  through a bundler (Vite, webpack 5, Rollup, esbuild) or inside a bundle; `require` is not supported. Node.js is not a
  supported runtime — use the engine's REST API there.
- **Type declarations without morphic-ts:** the stored-configuration types (`StoredConfiguration`,
  `StoredConfigurationV1.*`) are plain readonly types now; their arrays are `ReadonlyArray`. Code that changed a stored
  configuration in place has to copy it instead.
- **Error objects carry only their documented fields:** `ConfiguratorError` and its members are written out as readonly
  types; fields the engine adds to its error responses are no longer copied into the error objects.

# Fixes

- **Installing with npm works again:** the package no longer runs a `postinstall` script that failed for consumers.
- **Type check without `skipLibCheck`:** the published declarations pass a full type check.
