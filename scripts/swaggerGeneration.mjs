import pkg from "swagger-typescript-api";
import path from "path";

const {generateApi} = pkg;

generateApi({
    name: "Engine.ts",
    output: path.resolve(process.cwd(), "src/apiClient/engine/models/generated"),
    url: "http://localhost/hca/api/engine/api-docs/v2/openapi.json",
    moduleNameFirstTag: true,
    httpClientType: "axios",
    generateClient: false,
    cleanOutput: true,
    enumNamesAsValues: true
}).catch(e => console.error(e));