import configDefault from "./config.json";
import configLocal from "./config.local.json";

let config = {
    ...configDefault,
    ...configLocal
};

// Apply the accessToken from HCA_ENGINE_ACCESS_TOKEN if set, otherwise fallback to local override
config = {
    ...config,
    credentials: {
        ...config.credentials ?? {},
        engine: {
            ...config.credentials?.engine ?? {},
            accessToken: process.env.HCA_ENGINE_ACCESS_TOKEN ?? config.credentials?.engine?.accessToken
        }
    }
};

export default config;