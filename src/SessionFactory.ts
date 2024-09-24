import ISessionFactory from "./ISessionFactory";
import IConfigurationSession from "./IConfigurationSession";
import ConfigurationSession from "./ConfigurationSession";
import {SessionContext} from "./contract/Types";
import {createSession} from "./domain/logic/EngineLogic";
import {E, pipe, T, TE} from "@viamedici-spc/fp-ts-extensions";

const sessionFactory: ISessionFactory = {
    async createSession(sessionContext: SessionContext): Promise<IConfigurationSession> {
        return pipe(
            createSession(sessionContext),
            TE.map(state => new ConfigurationSession(state)),
            T.chain(E.match(l => () => Promise.reject(l), r => () => Promise.resolve(r)))
        )();
    }
};

export default sessionFactory;