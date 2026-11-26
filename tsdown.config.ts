import {defineConfig, type Rolldown, type UserConfig} from "tsdown";

/**
 * fp-ts 2.x and morphic-ts have no `exports` map, so strict ESM resolution (webpack 5 for a `"type": "module"` package)
 * rejects subpaths such as `fp-ts/Option`. The JavaScript output therefore imports their ES modules by full file path;
 * the declarations keep the usual paths.
 */
const fullySpecifiedSubpaths: Rolldown.Plugin = {
    name: "fully-specified-subpaths",
    resolveId: {
        order: "pre",
        handler(source, importer) {
            if (importer?.endsWith(".d.ts")) {
                return null;
            }
            const fpTs = /^fp-ts(?:\/(?:lib|es6))?(?:\/([^/]+?))?(?:\.js)?$/.exec(source);
            if (fpTs) {
                return {id: `fp-ts/es6/${fpTs[1] ?? "index"}.js`, external: true};
            }
            const morphic = /^(@morphic-ts\/[^/]+)\/(?:lib|es6)\/([^/]+?)(?:\.js)?$/.exec(source);
            if (morphic) {
                return {id: `${morphic[1]}/es6/${morphic[2]}.js`, external: true};
            }
            return null;
        },
    },
};

const config: UserConfig = defineConfig({
    entry: ["src/index.ts"],
    format: "esm",
    platform: "browser",
    target: "es2022",
    dts: {generator: "tsgo"},
    exports: true,
    plugins: [fullySpecifiedSubpaths],
});

export default config;