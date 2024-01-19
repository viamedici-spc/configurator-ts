import {applyDefaults, ClientOptions} from "./Options";
import {DomainUpdater} from "./domain/services/Updater";
import IConfiguratorClient from "./IConfiguratorClient";
import {EngineApiClient} from "./apiClient/engine/EngineApiClient";
import RestToDomainMapper from "./mappers/RestToDomainMapper";
import DomainToRestMapper from "./mappers/DomainToRestMapper";
import ConfiguratorClient from "./ConfiguratorClient";
import {ConfigurationSessionHandler} from "./domain/handler/ConfigurationSessionHandler";
import DomainToContractMapper from "./mappers/DomainToContractMapper";
import {ConfigurationSessionInternalCreator} from "./domain/IConfigurationSessionInternal";
import {pipe} from "@viamedici-spc/fp-ts-extensions";
import {ConfigurationSessionInternal} from "./domain/ConfigurationSessionInternal";
import {ResilienceDecorator} from "./domain/decorators/ResilienceDecorator";
import {OperationOptimizerDecorator} from "./domain/decorators/OperationOptimizerDecorator";
import {LoggingDecorator} from "./domain/decorators/LoggingDecorator";
import {match, P} from "ts-pattern";
import ISessionLifetimeHandler from "./sessionCreator/ISessionLifetimeHandler";
import ClientSideSessionLifetimeHandler from "./sessionCreator/ClientSideSessionLifetimeHandler";
import ServerSideSessionLifetimeHandler from "./sessionCreator/ServerSideSessionLifetimeHandler";
import ContractToRestMapper from "./mappers/ContractToRestMapper";
import SynchronousOperationDecorator from "./domain/decorators/SynchronousOperationDecorator";

// noinspection JSUnusedGlobalSymbols
export function createClient(options: ClientOptions): IConfiguratorClient {

    options = applyDefaults(options);

    const engineApiClient = new EngineApiClient(options.hcaEngineBaseUrl!);

    const restToDomainMapper = new RestToDomainMapper();
    const domainToRestMapper = new DomainToRestMapper();
    const domainToContractMapper = new DomainToContractMapper();
    const contractToRestMapper = new ContractToRestMapper();
    const domainUpdater = new DomainUpdater(restToDomainMapper);

    const sessionLifetimeHandler: ISessionLifetimeHandler = match(options.sessionHandler)
        .with({
            create: P.any,
            close: P.any
        }, v => v)
        .with({
            accessToken: P.string
        }, v => new ClientSideSessionLifetimeHandler(engineApiClient, contractToRestMapper, restToDomainMapper, v))
        .with({
            sessionCreateUrl: P.string,
            sessionDeleteUrl: P.string
        }, v => new ServerSideSessionLifetimeHandler(contractToRestMapper, v))
        .exhaustive();

    const sessionHandler = new ConfigurationSessionHandler(
        sessionLifetimeHandler,
        engineApiClient,
        restToDomainMapper,
        domainToRestMapper,
        domainToContractMapper,
        domainUpdater
    );

    const creator: ConfigurationSessionInternalCreator = (configurationSessionHandler, session) => pipe(
        new ConfigurationSessionInternal(configurationSessionHandler, session),
        s => new ResilienceDecorator(s),
        s => new OperationOptimizerDecorator(s),
        SynchronousOperationDecorator.new,
        s => new LoggingDecorator(s, false)
    );

    return new ConfiguratorClient(sessionHandler, creator);
}