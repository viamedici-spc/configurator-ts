import {defineConfig} from "vite";
import dts from "vite-plugin-dts";
import {externalizeDeps} from "vite-plugin-externalize-deps";

export default defineConfig(() => ({
    build: {
        outDir: "dist",
        minify: true,
        lib: {
            entry: "src/index.ts",
            formats: ["es", "cjs"],
            name: "configurator-ts",
            // We don't have ESM spec conform package because of fp-ts dependency.
            // So we can't let Vite name the ESM package .mjs because it would break compatibility with webpack.
            // Webpacks expects a fully spec conform package for a .mjs package. Node.js would be happy with this.
            // That's the reason why we don't specify type = "module". This would also break Node.js than because of directory imports.
            fileName: (format, entry) => entry + "." + (format === "es" ? "js" : format === "cjs" ? "cjs" : "XXX")
        },
    },
    plugins: [
        externalizeDeps(),
        dts({rollupTypes: true})
    ],
    test: {
        reporters: ["default", "junit"],
        setupFiles: ['./tests/testSetup.js'],
        outputFile: './report/tests-results.xml',
        coverage: {
            provider: "istanbul",
            reporter: "cobertura",
            reportsDirectory: "report",
            enabled: true
        }
    }
}));