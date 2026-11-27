/**
 * Type-checks the published declarations the way a consumer sees them. For every entry of the `exports` map it imports
 * the entry by the package name and uses each of the entry's own runtime exports as a value, then type-checks that file
 * with `consumer/tsconfig.json`. publint and arethetypeswrong check that the declarations resolve, not that they
 * declare what the JavaScript exports. Run from the package directory after the build.
 */
type Manifest = {readonly name: string; readonly exports: Readonly<Record<string, string>>};

const manifest: Manifest = await Bun.file("package.json").json();
const transpiler = new Bun.Transpiler({loader: "js"});
const identifier = /^[A-Za-z_$][\w$]*$/;
const lines: string[] = [];
let valueCount = 0;

for (const [index, [entry, file]] of Object.entries(manifest.exports).entries()) {
    if (entry === "./package.json") {
        continue;
    }
    // Names a module passes on with `export * from` are not its own and are not listed by the scan. `<Module>_exports`
    // is the namespace object the build creates in each module for the entry point (`export * as O from "./Option"`
    // makes `Option.js` export `Option_exports`); it is not part of the API and has no declaration.
    const namespaceHelper = `${file.slice(file.lastIndexOf("/") + 1).replace(/\.js$/, "")}_exports`;
    const names = transpiler.scan(await Bun.file(file).text()).exports.filter(name => name !== namespaceHelper);
    const specifier = entry === "." ? manifest.name : `${manifest.name}/${entry.slice("./".length)}`;
    const access = (name: string): string =>
        identifier.test(name) ? `entry${index}.${name}` : `entry${index}[${JSON.stringify(name)}]`;
    lines.push(`import * as entry${index} from "${specifier}";`);
    lines.push(`export const values${index} = [${[`entry${index}`, ...names.map(access)].join(", ")}];`);
    valueCount += names.length;
}

await Bun.write("package-check/consumer/index.ts", `${lines.join("\n")}\n`);
console.log(`Consumer check: ${valueCount} values from ${lines.length / 2} entries.`);

const check = Bun.spawnSync(["bun", "check", "-p", "package-check/consumer"], {stdout: "inherit", stderr: "inherit"});
process.exit(check.exitCode);