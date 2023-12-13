import {createEngineApiClient, getEngineToken} from "./Engine";
import {constVoid, E, pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import ISessionLifetimeHandler from "../../src/sessionCreator/ISessionLifetimeHandler";
import ContractToRestMapper from "../../src/mappers/ContractToRestMapper";
import * as Engine from "../../src/apiClient/engine/models/generated/Engine";
import {ProblemDetails} from "../../src/apiClient/engine/models/generated/Engine";
import {interpretEngineError} from "../../src/apiClient/engine/ErrorInterpretation";
import * as Domain from "../../src/domain/Model";
import {SessionId, TaskEitherResult} from "../../src/domain/Model";
import {SessionContext} from "../../src";
import RestToDomainMapper from "../../src/mappers/RestToDomainMapper";
import {EngineApiClient} from "../../src/apiClient/engine/EngineApiClient";

export class TestSessionLifetimeHandler implements ISessionLifetimeHandler {
    private readonly engineApiClient: EngineApiClient;
    private readonly contractToRestMapper = new ContractToRestMapper();
    private readonly restToDomainMapper = new RestToDomainMapper();

    constructor(baseUrl?: string) {
        this.engineApiClient = createEngineApiClient(baseUrl);
    }

    public create(sessionContext: SessionContext): TaskEitherResult<SessionId> {
        const request = this.contractToRestMapper.mapToCreateSessionRequest(sessionContext);

        return pipe(
            this.engineApiClient.createSessionUsingJwtBearer(request, getEngineToken()),
            TE.mapLeft(l => interpretEngineError(l, "TestSessionLifetimeHandler - create")),
            TE.chain((r: Engine.CreateSessionSuccessResponse | Engine.CreateSessionConflictResponse): Domain.TaskEitherResult<Domain.SessionId> => {
                return this.restToDomainMapper.mapToSessionId(r);
            }),
        );
    }

    close(sessionId: SessionId): TaskEitherResult<void> {
        return pipe(
            this.engineApiClient.deleteSessionUsingJwtBearer(sessionId, getEngineToken()),
            TE.mapLeft(l => interpretEngineError(l, "TestSessionLifetimeHandler - close")),
            TE.map(constVoid)
        );
    }
}