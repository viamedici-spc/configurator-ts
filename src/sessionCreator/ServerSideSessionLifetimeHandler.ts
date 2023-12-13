import {constVoid, O, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {IContractToRestMapper} from "../mappers/ContractToRestMapper";
import ISessionLifetimeHandler from "./ISessionLifetimeHandler";
import * as Domain from "../domain/Model";
import {SessionId, TaskEitherResult} from "../domain/Model";
import * as Contract from "../contract/Types";
import {createSessionFrom, HttpStatusCodes, ResponseWithData, request} from "../apiClient/engine/EngineApiClient";
import {interpretEngineError} from "../apiClient/engine/ErrorInterpretation";
import * as Engine from "../apiClient/engine/models/generated/Engine";
import RestToDomainMapper, {IRestToDomainMapper} from "../mappers/RestToDomainMapper";
import {ServerSideLifeTimeHandlerOptions} from "../Options";

export default class ServerSideSessionLifetimeHandler implements ISessionLifetimeHandler {
    private options: ServerSideLifeTimeHandlerOptions;
    private contractToRestMapper: IContractToRestMapper;
    private restToDomainMapper: IRestToDomainMapper = new RestToDomainMapper();

    constructor(contractToRestMapper: IContractToRestMapper, options: ServerSideLifeTimeHandlerOptions) {
        this.contractToRestMapper = contractToRestMapper;
        this.options = options;
    }

    public create(sessionContext: Contract.SessionContext): TaskEitherResult<SessionId> {

        const engineCreateSession = this.contractToRestMapper.mapToCreateSessionRequest(sessionContext);

        const session = createSessionFrom(this.options.sessionCreateUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify(engineCreateSession),
        });

        return pipe(session,
            TE.mapLeft(l => interpretEngineError(l, "ServerSideSessionLifetimeHandler - create")),
            TE.chain((r: Engine.CreateSessionSuccessResponse | Engine.CreateSessionConflictResponse): Domain.TaskEitherResult<Domain.SessionId> => {
                return this.restToDomainMapper.mapToSessionId(r);
            })
        );
    }

    public close(sessionId: SessionId): TaskEitherResult<void> {
        return pipe(
            request<{}>(this.options.sessionDeleteUrl, {
                method: "DELETE",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                    "X-SESSION-ID": sessionId
                }
            }, (r: ResponseWithData) => {
                if (r.response.status === HttpStatusCodes.NoContent) {
                    return O.some({});
                }

                return O.none;
            }),
            TE.mapLeft(l => interpretEngineError(l, "ServerSideSessionLifetimeHandler - close")),
            TE.map(constVoid)
        );
    }
}