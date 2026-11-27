/**
 * Regenerates src/apiClient/engine/Engine.ts, the wire types of the engine's REST API, from its OpenAPI document.
 * Run it with `bun run --filter scripts generate-engine-types` from the repository root, or `bun run
 * generate-engine-types` in scripts/. The output holds types only, no runtime code (enums are string unions); the
 * requests go through openapi-fetch in src/domain/EngineApiClient.ts.
 */
import openapiTS, {astToString} from "openapi-typescript";

const source = process.env["ENGINE_OPENAPI_URL"] ?? "https://spc.viamedici.io/hca/api/engine/api-docs/v2/openapi.json";
const target = new URL("../src/apiClient/engine/Engine.ts", import.meta.url);

const ast = await openapiTS(new URL(source), {
    rootTypes: true,
    rootTypesNoSchemaPrefix: true,
});

const header = `// Generated from ${source} by scripts/generate-engine-types.ts. Do not edit; regenerate instead.\n\n`;
await Bun.write(target, header + astToString(ast));
console.log(`Wrote ${target.pathname}`);