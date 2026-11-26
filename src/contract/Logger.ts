import memize from "memize";

/**
 * How much the library logs to the console. Each level includes the ones after it: `"debug"` logs everything,
 * `"error"` only errors, `"silent"` nothing.
 */
export type LogLevel = "debug" | "info" | "warning" | "error" | "silent";

/** Writes the library's messages to the console, filtered by the {@link LogLevel} set with `setLogLevel`. */
export type Logger = {
    /** Sets how much the library logs from now on; until it is called, the level is `"error"`. */
    readonly setLogLevel: (level: LogLevel) => void;
    /** Logs at level `"debug"`. */
    readonly debug: (...args: Parameters<typeof console.log>) => void;
    /** Logs at level `"info"`. */
    readonly info: (...args: Parameters<typeof console.log>) => void;
    /** Logs at level `"warning"`. */
    readonly warn: (...args: Parameters<typeof console.log>) => void;
    /** Logs at level `"error"`. */
    readonly error: (...args: Parameters<typeof console.log>) => void;
};

let logLevel: LogLevel = "error";
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

const log =
    (level: Exclude<LogLevel, "silent">) =>
    (...args: Parameters<typeof console.log>) => {
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

const Logger: Logger = {
    setLogLevel: (level: LogLevel) => {
        logLevel = level;
    },
    debug: log("debug"),
    info: log("info"),
    warn: log("warning"),
    error: log("error"),
};

export default Logger;