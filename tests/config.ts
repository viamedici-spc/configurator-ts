import configDefault from "./config.json";
import configLocal from "./config.local.json";

let config = {
    ...configDefault,
    ...configLocal
};

export default config;