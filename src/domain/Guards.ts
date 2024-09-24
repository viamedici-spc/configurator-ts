import {
    ExplicitDecision,
    SetManyDropExistingDecisionsMode,
    SetManyKeepExistingDecisionsMode
} from "../contract/Types";
import GlobalAttributeIdKeyBuilder from "../crossCutting/GlobalAttributeIdKeyBuilder";
import {getExplicitDecisionsForAttribute} from "./logic/ConfigurationRawData";
import {O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {explicitDecisionByIdEq, explicitDecisionEq} from "../contract/Eqs";
import configurationRawData from "./model/ConfigurationRawData";

export function shouldSkipMakeDecision(explicitDecision: ExplicitDecision, rawData: configurationRawData): boolean {
    const existingDecision = rawData.decisions.get(GlobalAttributeIdKeyBuilder(explicitDecision.attributeId));

    const explicitDecisionsForAttribute = existingDecision ? getExplicitDecisionsForAttribute(existingDecision) : [];
    const doesDecisionAlreadyExist = pipe(
        explicitDecisionsForAttribute,
        // Find the equivalent in the existing Decisions.
        RA.findFirst(d => explicitDecisionByIdEq.equals(d, explicitDecision)),
        O.match(
            // If there is no existing decision but the new decision is null, it is assumed to be equal.
            () => explicitDecision.state == null,
            // If there is an existing decision, it must be equal.
            d => explicitDecisionEq.equals(d, explicitDecision)
        )
    );

    return doesDecisionAlreadyExist;
}

export function shouldSkipSetMany(manyDecisions: ReadonlyArray<ExplicitDecision>, mode: SetManyKeepExistingDecisionsMode["type"] | SetManyDropExistingDecisionsMode["type"]): boolean {
    return RA.isEmpty(manyDecisions) && mode === "KeepExistingDecisions";
}