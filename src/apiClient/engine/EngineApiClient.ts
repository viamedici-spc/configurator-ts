import {O, pipe, T, TaskEither, TE} from "@viamedici-spc/fp-ts-extensions";
import {LocalErrorType} from "./ErrorInterpretation";
import {
    Consequences,
    CreateSessionConflictResponse,
    CreateSessionRequest,
    CreateSessionSuccessResponse,
    Decisions,
    ExplainResult,
    ExplicitDecision,
    ExplicitDecisions,
    ProblemDetails,
    PutDecisionResponse,
    PutManyDecisionsConflictResponse,
    PutManyDecisionsSuccessResponse,
    WhyNotSatisfiedRequest,
    WhyStateNotPossibleRequest
} from "./models/generated/Engine";
import {match} from "ts-pattern";
import urlJoin from "url-join";

export type EngineTaskEitherResponse<T> = TaskEither<ProblemDetails, T>;

export enum HttpStatusCodes {
    Ok = 200,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    Conflict = 409,
}

export type ResponseWithData = {
    readonly response: Response,
    readonly data: any
};

export function request<T>(urlSegments: string[] | string, options: RequestInit, responseHandler: (r: ResponseWithData) => O.Option<T>): TE.TaskEither<ProblemDetails, T> {
    // Normalize each segment and join with a single slash
    const url = pipe(
        Array.isArray(urlSegments) ? urlSegments : [urlSegments],
        urlJoin
    );

    return pipe(
        TE.tryCatch(() => fetch(url, options), (r): Response => {
            return {
                type: "error"
            } as Response;
        }),
        TE.chain(response => pipe(
            TE.tryCatch(async () => {
                    const data = await response.json();
                    return {response, data};
                }, (): Response =>
                    (response)
            )
        )),
        // Responses that can not be deserialized end up here and get handled based on their status code
        TE.orElse((r) => {

            if (r.status === HttpStatusCodes.Unauthorized) {
                return TE.left({
                    type: LocalErrorType.ConfigurationEngineRestApiUnauthorized,
                    status: HttpStatusCodes.Unauthorized
                });
            }

            // TODO: Not working. Maybe an exception is thrown for 401 errors
            if (r.status === HttpStatusCodes.NoContent){
                return TE.right({response: r, data: {}});
            }

            if (r.type === "error"){
                return TE.left({
                    type: LocalErrorType.LowLevelCommunicationError
                })
            }

            return TE.left({
                type: LocalErrorType.UnhandledResponseStatus
            });
        }),
        // Responses that can be deserialized are assumed to be ProblemDetails unless handled otherwise
        TE.chain(r => {
            return pipe(
                responseHandler(r),
                TE.fromOption((): ProblemDetails => {
                    return r.data;
                })
            );
        })
    );
}

export function createSessionFrom(urlSegments: string[] | string, options: RequestInit): EngineTaskEitherResponse<CreateSessionSuccessResponse | CreateSessionConflictResponse> {
    return request<CreateSessionSuccessResponse | CreateSessionConflictResponse>(urlSegments, options, (r: ResponseWithData) => {
        if (r.response.status === HttpStatusCodes.Ok) {
            return O.of(r.data as CreateSessionSuccessResponse);
        }

        if (r.response.status === HttpStatusCodes.Conflict) {
            const data = r.data as CreateSessionConflictResponse;
            return match(data)
                .with({
                    type: "ConfigurationModelInvalid"
                }, _ => O.of(data))
                .with({
                    type: "ConfigurationModelNotFeasible"
                }, _ => O.of(data))
                .otherwise(() => O.none);
        }

        return O.none;
    });
}

export class EngineApiClient {

    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public createSessionUsingApiKey(r: CreateSessionRequest, apiKey: string): EngineTaskEitherResponse<CreateSessionSuccessResponse | CreateSessionConflictResponse> {
        const options = {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-API-KEY": apiKey
            },
            body: JSON.stringify(r),
        };

        return createSessionFrom([this.baseUrl, "v2/session"], options);
    }

    public createSessionUsingJwtBearer(r: CreateSessionRequest, jwtBearer: string): EngineTaskEitherResponse<CreateSessionSuccessResponse | CreateSessionConflictResponse> {
        const options = {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${jwtBearer}`
            },
            body: JSON.stringify(r),
        };

        return createSessionFrom([this.baseUrl, "v2/session"], options);
    }

    public setMany(sessionId: string, explicitDecisions: ExplicitDecisions): EngineTaskEitherResponse<PutManyDecisionsSuccessResponse | PutManyDecisionsConflictResponse> {
        const options = {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            },
            body: JSON.stringify(explicitDecisions),
        };

        return request<PutManyDecisionsSuccessResponse | PutManyDecisionsConflictResponse>([this.baseUrl, "v2/session/configuration/decision/many"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as PutManyDecisionsSuccessResponse);
            }

            if (r.response.status === HttpStatusCodes.Conflict) {
                return O.some(r.data as PutManyDecisionsConflictResponse);
            }

            return O.none;
        });
    }

    public makeDecision(sessionId: string, explicitDecision: ExplicitDecision): EngineTaskEitherResponse<PutDecisionResponse> {
        const options = {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            },
            body: JSON.stringify(explicitDecision),
        };

        return request<PutDecisionResponse>([this.baseUrl, "v2/session/configuration/decision"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as PutDecisionResponse);
            }

            return O.none;
        });
    }

    public getDecisions(sessionId: string): EngineTaskEitherResponse<Decisions> {
        const options = {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            }
        };

        return request<Decisions>([this.baseUrl, "v2/session/configuration/decision"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as Decisions);
            }

            return O.none;
        });
    }

    public getWhyStateNotPossible(sessionId: string, explain: WhyStateNotPossibleRequest): EngineTaskEitherResponse<ExplainResult> {
        const options : RequestInit = {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            },
            body: JSON.stringify(explain),
        };

        return request<ExplainResult>([this.baseUrl, "v2/session/configuration/consequence/explain/why-state-not-possible"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as ExplainResult);
            }

            return O.none;
        });
    }

    public getWhyNotSatisfied(sessionId: string, explain: WhyNotSatisfiedRequest): EngineTaskEitherResponse<ExplainResult> {
        const options = {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            },
            body: JSON.stringify(explain),
        };

        return request<ExplainResult>([this.baseUrl, "v2/session/configuration/consequence/explain/why-not-satisfied"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as ExplainResult);
            }

            return O.none;
        });
    }

    public getConsequence(sessionId: string): EngineTaskEitherResponse<Consequences> {
        const options = {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "X-SESSION-ID": sessionId
            }
        };

        return request<Consequences>([this.baseUrl, "v2/session/configuration/consequence"], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.Ok) {
                return O.some(r.data as Consequences);
            }

            return O.none;
        });
    }

    public deleteSessionUsingJwtBearer(sessionId: string, jwtBearer: string): EngineTaskEitherResponse<{}> {
        const options = {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${jwtBearer}`
            }
        };

        return request<{}>([this.baseUrl, `v2/session/${sessionId}`], options, (r: ResponseWithData) => {
            if (r.response.status === HttpStatusCodes.NoContent) {
                return O.some({});
            }

            return O.none;
        });
    }
}