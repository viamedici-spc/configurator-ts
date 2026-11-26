import {afterAll, describe, expect, it, mock} from "bun:test";
import {type FetchFunction, jsonResponse, setFetch} from "../../setup/Fetch";
import * as Logic from "../../../src/domain/logic/EngineLogic";
import {SessionContextWithModelWithOneMandatoryChoice} from "../../data/SessionContexts";
import {expectToBeLeft} from "../../setup/EitherExtensions";

const globalFetch = globalThis.fetch;

/** What every problem carries on the wire besides its own fields; only `title` and `detail` reach the public error. */
const wireOnly = {status: 409, instance: "/v2/session", fieldTheEngineAdded: "not copied"};
const text = {title: "Title", detail: "Detail"};
const wireAttributeId = {localId: "A", sharedConfigurationModelId: "Shared", componentPath: ["Component"]};
const attributeId = {localId: "A", sharedConfigurationModelId: "Shared", componentPath: ["Component"]};

/** One problem per error type the library maps, and the public error it must become, field by field. */
const cases: ReadonlyArray<readonly [string, Record<string, unknown>, Record<string, unknown>]> = [
    ...(
        [
            "RequestTimeout",
            "MissingTenantIdClaim",
            "MissingSessionIdClaim",
            "TenantAccessForbidden",
            "SessionIdInvalid",
            "AuthenticationFailure",
            "SideLoadingForbidden",
            "SolutionNotFeasible",
            "ConfigurationModelNotFound",
            "SolverInitializationFailure",
            "ConfigurationModelLoadFailure",
            "SolverPoolInitializationFailure",
            "SetDecisionConflict",
            "SnapshotNotFound",
            "SessionParametersInvalid",
        ] as const
    ).map(type => [type, {}, {type, ...text}] as const),
    ["RequestFailure", {exception: "E"}, {type: "RequestFailure", ...text, exception: "E"}],
    ["SerializationError", {jsonException: "J"}, {type: "SerializationError", ...text, jsonException: "J"}],
    [
        "ConfigurationModelInvalid",
        {validationMessage: "V"},
        {type: "ConfigurationModelInvalid", ...text, validationMessage: "V"},
    ],
    [
        "ConfigurationInitializationFailure",
        {deploymentId: "D"},
        {type: "ConfigurationInitializationFailure", ...text, deploymentId: "D"},
    ],
    ["SolveOperationTimeout", {timeout: "00:00:05"}, {type: "SolveOperationTimeout", ...text, timeout: "00:00:05"}],
    ["ExplainConflict", {source: "S"}, {type: "ExplainConflict", ...text, source: "S"}],
    ["ExplainFailure", {source: "S"}, {type: "ExplainFailure", ...text, source: "S"}],
    [
        "SnapshotInvalid",
        {validationMessage: "V", validationPath: ["P"]},
        {type: "SnapshotInvalid", ...text, validationMessage: "V", validationPath: ["P"]},
    ],
    [
        "ConfigurationModelNotFeasible",
        {constraintExplanations: []},
        {type: "ConfigurationModelNotFeasible", ...text, constraintExplanations: []},
    ],
    [
        "SpecifiedDeploymentForbidden",
        {channel: "release", deploymentName: "D"},
        {type: "SpecifiedDeploymentForbidden", ...text, channel: "release", deploymentName: "D"},
    ],
    ...(
        [
            "AttributeNotFound",
            "ChoiceAttributeNotFound",
            "ComponentAttributeNotFound",
            "NumericAttributeNotFound",
            "BooleanAttributeNotFound",
        ] as const
    ).map(
        type => [type, {globalAttributeId: wireAttributeId}, {type, ...text, globalAttributeId: attributeId}] as const,
    ),
    [
        "ChoiceValueNotFound",
        {globalChoiceValueId: {attributeId: wireAttributeId, choiceValueId: "V"}},
        {type: "ChoiceValueNotFound", ...text, globalAttributeId: attributeId, choiceValueId: "V"},
    ],
    [
        "NumericDecisionOutOfRange",
        {globalAttributeId: wireAttributeId, range: "[0;10]", decision: 11},
        {type: "NumericDecisionOutOfRange", ...text, globalAttributeId: attributeId, range: "[0;10]", decision: 11},
    ],
    [
        "ConflictWithConsequence",
        {globalAttributeId: wireAttributeId, choiceValueId: "V"},
        {type: "ConflictWithConsequence", ...text, globalAttributeId: attributeId, choiceValueId: "V"},
    ],
    [
        "DecisionsToRespectInvalid",
        {globalAttributeId: wireAttributeId, validationMessage: "V"},
        {type: "DecisionsToRespectInvalid", ...text, validationMessage: "V", globalAttributeId: attributeId},
    ],
    [
        "FixedDecisionsInvalid",
        {rejectedDecisions: [], validationMessage: "V"},
        {type: "FixedDecisionsInvalid", ...text, rejectedDecisions: [], validationMessage: "V"},
    ],
    ["SessionNotFound", {}, {type: "SessionNotFound"}],
    ...(
        [
            "PutManyDecisionsConflict",
            "AssignedChannelNotFound",
            "InternalServerError",
            "AttributeNotActive",
            "AProblemTypeTheLibraryDoesNotKnow",
        ] as const
    ).map(type => [type, {}, {type: "ServerError"}] as const),
];

describe("Error mapping", () => {
    afterAll(() => {
        setFetch(globalFetch);
    });

    it.each(cases)("%s", async (type, fields, expected) => {
        setFetch(
            mock<FetchFunction>(() => Promise.resolve(jsonResponse({type, ...text, ...wireOnly, ...fields}, 409))),
        );

        const result = await Logic.createSession(SessionContextWithModelWithOneMandatoryChoice)();

        expect<unknown>(expectToBeLeft(result)).toStrictEqual(expected);
    });
});