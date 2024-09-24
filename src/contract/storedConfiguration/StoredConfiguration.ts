import {AType} from "@morphic-ts/summoners";
import {summonFor} from "@morphic-ts/batteries/lib/summoner-ESBAST";
import {StoredConfigurationV1_} from "./StoredConfigurationSummonsV1";

const {summon} = summonFor<{}>({});

export const StoredConfiguration_ = summon(F => F.taggedUnion("type", {
    [1]: StoredConfigurationV1_(F)
}, "StoredConfiguration"));
export type StoredConfiguration = AType<typeof StoredConfiguration_>;