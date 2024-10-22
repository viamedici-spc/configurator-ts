/// <reference types="vite/client" />

import memize from "memize";

type LogLevel = "debug" | "info" | "warning" | "error" | "silent";
let logLevel: LogLevel = import.meta.env?.PROD ? "error" : "debug";
const getValidLogLevels = memize((logLevel: LogLevel) => {
    switch (logLevel) {
        case "debug":
            return ["debug", "info", "warning", "error"];
        case "info":
            return ["info", "warning", "error"];
        case "warning":
            return ["warning", "error"];
        case "error":
            return ["error"];
        case "silent":
            return [];
    }
});

const log = (level: Exclude<LogLevel, "silent">) => (...args: Parameters<typeof console.log>) => {
    if (!getValidLogLevels(logLevel).includes(level)) {
        return;
    }

    switch (level) {
        case "debug":
            console.debug(...args);
            break;
        case "info":
            console.info(...args);
            break;
        case "warning":
            console.warn(...args);
            break;
        case "error":
            console.error(...args);
            break;
    }
};

const Logger = {
    setLogLevel: (level: LogLevel) => {
        logLevel = level;
    },
    debug: log("debug"),
    info: log("info"),
    warn: log("warning"),
    error: log("error"),
};

export default Logger;