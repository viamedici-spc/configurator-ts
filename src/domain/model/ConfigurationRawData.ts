import type {GlobalAttributeIdKey} from "../../contract/Types";
import type {AttributeConsequence, AttributeDecision, AttributeMeta} from "./PartialAttribute";

type ConfigurationRawData = {
    isSatisfied: boolean;
    canContributeToSatisfaction: ReadonlyArray<GlobalAttributeIdKey>;
    meta: ReadonlyMap<GlobalAttributeIdKey, AttributeMeta>;
    decisions: ReadonlyMap<GlobalAttributeIdKey, AttributeDecision>;
    consequences: ReadonlyMap<GlobalAttributeIdKey, AttributeConsequence>;
};

export type {ConfigurationRawData as default};