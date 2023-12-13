import defaults from "./defaults.json";
import ISessionLifetimeHandler from "./sessionCreator/ISessionLifetimeHandler";

export type ServerSideLifeTimeHandlerOptions = {
    readonly sessionCreateUrl: string;
    readonly sessionDeleteUrl: string;
};

export type ClientSideLifeTimeHandlerOptions = {
    // Mutable by design
    accessToken: string
};

export type ClientOptions = {
    readonly hcaEngineBaseUrl?: string // Default: https://hca.cloud.viamedici.de/engine
    readonly sessionHandler: ISessionLifetimeHandler | ServerSideLifeTimeHandlerOptions | ClientSideLifeTimeHandlerOptions
}

export function applyDefaults(options: ClientOptions): ClientOptions {

    return {
        hcaEngineBaseUrl: options.hcaEngineBaseUrl ?? defaults.hcaEngineBaseUrl,
        sessionHandler: options.sessionHandler
    };
}