import {describe, expect, it} from "vitest";
import {GlobalAttributeId, GlobalAttributeIdKeyBuilder} from "../../../src";

describe("GlobalAttributeIdKeyBuilder", () => {
    it("Escaping prevents id overlap", () => {
        const id1: GlobalAttributeId = {
            componentPath: ["A", "B", "C"],
            localId: "C"
        };
        const id2: GlobalAttributeId = {
            componentPath: ["A::B::C"],
            localId: "C"
        };

        const key1 = GlobalAttributeIdKeyBuilder(id1);
        const key2 = GlobalAttributeIdKeyBuilder(id2);

        expect(key1).not.toEqual(key2);
    });
});