import {DomainUpdater} from "../../src/domain/services/Updater";
import {TestSessionLifetimeHandler} from "./TestSessionLifetimeHandler";
import ConfiguratorClient from "../../src/ConfiguratorClient";
import RestToDomainMapper from "../../src/mappers/RestToDomainMapper";
import DomainToRestMapper from "../../src/mappers/DomainToRestMapper";
import {createEngineApiClient} from "./Engine";
import {ConfigurationSessionHandler} from "../../src/domain/handler/ConfigurationSessionHandler";
import DomainToContractMapper from "../../src/mappers/DomainToContractMapper";
import {ConfigurationSessionInternalCreator} from "../../src/domain/IConfigurationSessionInternal";
import {pipe} from "@viamedici-spc/fp-ts-extensions";
import {ResilienceDecorator} from "../../src/domain/decorators/ResilienceDecorator";
import {OperationOptimizerDecorator} from "../../src/domain/decorators/OperationOptimizerDecorator";
import {LoggingDecorator} from "../../src/domain/decorators/LoggingDecorator";
import {ConfigurationSessionInternal} from "../../src/domain/ConfigurationSessionInternal";

export function createDefaultClient(baseUrl?: string): ConfiguratorClient {
    const testSessionHandler = new TestSessionLifetimeHandler(baseUrl);
    const engineApiClient = createEngineApiClient(baseUrl);
    const restToDomainMapper = new RestToDomainMapper();
    const domainToRestMapper = new DomainToRestMapper();
    const domainToContractMapper = new DomainToContractMapper();
    const domainUpdater = new DomainUpdater(restToDomainMapper);

    const configurationSessionHandler = new ConfigurationSessionHandler(testSessionHandler, engineApiClient, restToDomainMapper, domainToRestMapper, domainToContractMapper, domainUpdater);

    const creator: ConfigurationSessionInternalCreator = (configurationSessionHandler, session) => pipe(
        new ConfigurationSessionInternal(configurationSessionHandler, session),
        s => new ResilienceDecorator(s),
        s => new OperationOptimizerDecorator(s),
        s => new LoggingDecorator(s, true)
    );

    return new ConfiguratorClient(configurationSessionHandler, creator);
}