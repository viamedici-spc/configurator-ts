import {GlobalAttributeIdKey} from "../../contract/Types";
import {AttributeConsequence, AttributeDecision, AttributeMeta} from "./PartialAttribute";

type ConfigurationRawData = {
    isSatisfied: boolean;
    canContributeToSatisfaction: ReadonlyArray<GlobalAttributeIdKey>;
    meta: ReadonlyMap<GlobalAttributeIdKey, AttributeMeta>;
    decisions: ReadonlyMap<GlobalAttributeIdKey, AttributeDecision>;
    consequences: ReadonlyMap<GlobalAttributeIdKey, AttributeConsequence>;
};

export default ConfigurationRawData;