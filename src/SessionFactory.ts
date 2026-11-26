import type ISessionFactory from "./ISessionFactory";
import type IConfigurationSession from "./IConfigurationSession";
import ConfigurationSession from "./ConfigurationSession";
import type {SessionContext} from "./contract/Types";
import {createSession} from "./domain/logic/EngineLogic";
import {E, pipe} from "@viamedici-spc/fp-ts-extensions";

const sessionFactory: ISessionFactory = {
    async createSession(sessionContext: SessionContext): Promise<IConfigurationSession> {
        return pipe(
            await createSession(sessionContext)(),
            E.match(
                (l): Promise<IConfigurationSession> => Promise.reject(l),
                r => Promise.resolve(new ConfigurationSession(r)),
            ),
        );
    }
};

export default sessionFactory;