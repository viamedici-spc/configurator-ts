/** Additive wire contract from the supplied Configuration Engine OpenAPI.
 * Engine.ts is generated upstream and intentionally unchanged.
 */
import type {Api, Consequences, Decisions, GlobalAttributeId, Unspecified} from "./Engine";
import {ContentType} from "./Engine";
export type ScopedConsequences = Omit<Consequences, "isConfigurationSatisfied"> & {isConfigurationSatisfied: boolean | null};
export type ActiveAttributesResponse = {consequences: ScopedConsequences; affectedDecisions: Decisions};
export async function updateActiveAttributes(api: Api<unknown>, sessionId: string, attributes: readonly GlobalAttributeId[] | null) {
    try {return await api.request<ActiveAttributesResponse, Unspecified>({
        path: "/v2/session/configuration/active-attributes",
        method: attributes === null ? "DELETE" : "POST",
        headers: {Accept: "application/json", "X-SESSION-ID": sessionId},
        ...(attributes === null ? {} : {type: ContentType.Json, body: {activeAttributes: attributes}}),
        format: "json"
    });} catch (response) {
        const failure = response as any;
        const errorType = String(failure?.error?.type ?? "");
        const missingEndpoint = failure?.status === 404 && (!errorType || /^(NotFound|RouteNotFound|EndpointNotFound|UnknownOperation|ActiveAttributesUnsupported)$/i.test(errorType));
        if (([405,501].includes(failure?.status) || missingEndpoint) && !/SessionNotFound/i.test(errorType)) {
            failure.error = {type:"ActiveAttributesUnsupported",title:"Active attributes unavailable",detail:"The engine endpoint rejected this active-attribute operation."};
        }
        throw response;
    }
}
