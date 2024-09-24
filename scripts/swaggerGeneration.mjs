import {generateApi} from "swagger-typescript-api";
import path from "path";

await generateApi({
    name: "Engine.ts",
    output: path.resolve(process.cwd(), "src/apiClient/engine"),
    url: "https://spc.cloud.ceventis.de/hca/api/engine/api-docs/v2/openapi.json",
    moduleNameFirstTag: true,
    httpClientType: "fetch",
    generateClient: true,
    cleanOutput: false,
    enumNamesAsValues: true
}).catch(e => console.error(e));