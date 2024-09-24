import {AType} from "@morphic-ts/summoners";
import {
    BooleanDecision_,
    ChoiceDecision_,
    ComponentDecision_, Decision_,
    GlobalAttributeId_,
    NumericDecision_, StoredConfigurationV1_
} from "./StoredConfigurationSummonsV1";

export type GlobalAttributeId = AType<typeof GlobalAttributeId_>;
export type NumericDecision = AType<typeof NumericDecision_>;
export type BooleanDecision = AType<typeof BooleanDecision_>;
export type ChoiceDecision = AType<typeof ChoiceDecision_>;
export type ComponentDecision = AType<typeof ComponentDecision_>;
export type Decision = AType<typeof Decision_>;
export type StoredConfigurationV1 = AType<typeof StoredConfigurationV1_>;