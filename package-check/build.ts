/**
 * Builds the package and fails when the build changed `package.json`. tsdown's `exports: true` writes the `exports` map
 * and `inlinedDependencies` into the manifest, so a new module or a newly bundled package shows up there; the
 * committed manifest has to be what the build produces. Run from the package directory.
 */
const manifestPath = "package.json";
const before = await Bun.file(manifestPath).text();

const build = Bun.spawnSync(["bun", "run", "build"], {stdout: "inherit", stderr: "inherit"});
if (build.exitCode !== 0) {
    process.exit(build.exitCode);
}

if ((await Bun.file(manifestPath).text()) !== before) {
    console.error("The build changed package.json. Check the change and commit it.");
    process.exit(1);
}