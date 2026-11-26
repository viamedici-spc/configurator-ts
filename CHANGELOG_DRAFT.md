# Improvements

## Public types

- **Configuration model packages can be written without a cast:** the types a side-loaded package is built from
  (`ConfigurationModelPackage`, `PackageConfigurationModel`, the attribute, inclusion and constraint types) are
  exported, and `PackageTextualConstraintCollection.operator` is the string union `"And" | "Or"`.
- **`LogLevel` and the `Logger` type are exported,** so the argument of `Logger.setLogLevel` can be named.
- **`ConfiguratorErrorText` is exported:** the `title` and `detail` every engine error carries.

# Changes

## ESM only, for browsers

- **ES modules only:** the package ships one ES module with its type declarations and no CommonJS build anymore. Use it
  through a bundler (Vite, webpack 5, Rollup, esbuild) or inside a bundle; `require` is not supported. Node.js is not a
  supported runtime — use the engine's REST API there.
- **TypeScript resolution:** TypeScript finds the package with `moduleResolution` `bundler`, `node16` or `nodenext`;
  `node10` (`node`) no longer finds it, since the package has an `exports` map and no `main` or `types` field.
- **Tests in Node.js:** test runners that run in Node.js, such as Vitest, need
  `server.deps.inline: [/fp-ts/, /@viamedici-spc\//]` ([README](README.md#testing-with-vitest)).

## Stored configuration types

- **Type declarations without morphic-ts:** the stored-configuration types (`StoredConfiguration`,
  `StoredConfigurationV1.*`) are plain readonly types now.
- **`StoredConfigurationV1` is exported as a type only:** import it with `import type`.

## Readonly types

- **Every public type is readonly:** its properties are `readonly` and its collections `ReadonlyArray`. Code that
  changed such an object after creating it, a configuration model package say, has to build a new one instead.

## Error objects

- **Error objects carry only their documented fields:** `ConfiguratorError` and its members are written out as readonly
  types; fields the engine adds to its error responses are no longer copied into the error objects.

# Fixes

## Installation and typings

- **Installing with npm works again:** the package no longer runs a `postinstall` script that failed for consumers.
- **Type check without `skipLibCheck`:** the published declarations pass a full type check.
