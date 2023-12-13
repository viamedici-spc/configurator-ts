import {O, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import IConfiguratorClient from "./IConfiguratorClient";
import IConfigurationSession from "./IConfigurationSession";
import ConfigurationSession from "./ConfigurationSession";
import ContractToDomainMapper from "./mappers/ContractToDomainMapper";
import DomainToContractMapper from "./mappers/DomainToContractMapper";
import {ConfigurationSessionHandler} from "./domain/handler/ConfigurationSessionHandler";
import {ConfigurationSessionState} from "./domain/Model";
import {SessionContext} from "./contract/Types";
import {ConfigurationSessionInternalCreator} from "./domain/IConfigurationSessionInternal";

export default class ConfiguratorClient implements IConfiguratorClient {
    private readonly sessionHandler: ConfigurationSessionHandler;
    private readonly contractToDomainMapper = new ContractToDomainMapper();
    private readonly domainToContractMapper = new DomainToContractMapper();
    private readonly internalConfigurationSessionCreator: ConfigurationSessionInternalCreator;

    constructor(sessionHandler: ConfigurationSessionHandler, internalConfigurationSessionCreator: ConfigurationSessionInternalCreator) {
        this.sessionHandler = sessionHandler;
        this.internalConfigurationSessionCreator = internalConfigurationSessionCreator;
    }

    public async createSession(sessionContext: SessionContext): Promise<IConfigurationSession> {
        const newConfigurationSession = this.configurationSessionFrom(sessionContext);

        return await pipe(this.sessionHandler.recreate(newConfigurationSession),
            TE.map(session => {
                const sessionInternal = this.internalConfigurationSessionCreator(this.sessionHandler, session);

                return new ConfigurationSession(sessionInternal, this.contractToDomainMapper, this.domainToContractMapper);
            }),
            TE.match(f => {
                const contractFailure = this.domainToContractMapper.mapToFailureResult(f);

                return Promise.reject(contractFailure);
            }, r => Promise.resolve(r))
        )();
    }

    private configurationSessionFrom(sessionContext: SessionContext): ConfigurationSessionState {
        return {
            context: this.contractToDomainMapper.mapToSessionContext(sessionContext),
            sessionId: O.none,
            configuration: {
                isSatisfied: false,
                attributes: []
            },
            solutions: []
        };
    }
}