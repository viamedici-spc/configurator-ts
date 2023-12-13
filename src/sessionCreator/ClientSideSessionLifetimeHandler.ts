import {constVoid, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import * as Engine from "../apiClient/engine/models/generated/Engine";
import {filterNullOrElse} from "../crossCutting/TaskEitherExtensions";
import {IContractToRestMapper} from "../mappers/ContractToRestMapper";
import ISessionLifetimeHandler from "./ISessionLifetimeHandler";
import * as Domain from "../domain/Model";
import {FailureResult, FailureType, SessionId, TaskEitherResult} from "../domain/Model";
import {EngineApiClient} from "../apiClient/engine/EngineApiClient";
import {interpretEngineError} from "../apiClient/engine/ErrorInterpretation";
import {SessionContext} from "../contract/Types";
import {IRestToDomainMapper} from "../mappers/RestToDomainMapper";
import {ClientSideLifeTimeHandlerOptions} from "../Options";

export default class ClientSideSessionLifetimeHandler implements ISessionLifetimeHandler {
    private engineApiClient: EngineApiClient;

    private contractToRestMapper: IContractToRestMapper;
    private restToDomainMapper: IRestToDomainMapper;

    private options: ClientSideLifeTimeHandlerOptions;

    constructor(engineApiClient: EngineApiClient, contractToRestMapper: IContractToRestMapper, restToDomainMapper: IRestToDomainMapper, options: ClientSideLifeTimeHandlerOptions) {
        this.engineApiClient = engineApiClient;
        this.contractToRestMapper = contractToRestMapper;
        this.restToDomainMapper = restToDomainMapper;

        this.options = options;
    }

    public create(sessionContext: SessionContext): TaskEitherResult<SessionId> {
        const request: Engine.CreateSessionRequest = this.contractToRestMapper.mapToCreateSessionRequest(sessionContext);

        return pipe(
            this.engineApiClient.createSessionUsingJwtBearer(request, this.options.accessToken),
            TE.mapLeft(l => interpretEngineError(l, "ClientSideSessionLifetimeHandler - create")),
            TE.chain((r: Engine.CreateSessionSuccessResponse | Engine.CreateSessionConflictResponse): Domain.TaskEitherResult<Domain.SessionId> => {
                return this.restToDomainMapper.mapToSessionId(r);
            }),
            filterNullOrElse((): FailureResult => ({
                type: FailureType.ConfigurationUnauthenticated
            }))
        );
    }

    public close(sessionId: SessionId): TaskEitherResult<void> {
        return pipe(
            this.engineApiClient.deleteSessionUsingJwtBearer(sessionId, this.options.accessToken),
            TE.mapLeft(l => interpretEngineError(l, "ClientSideSessionLifetimeHandler - close")),
            TE.map(() => constVoid())
        );
    }
}