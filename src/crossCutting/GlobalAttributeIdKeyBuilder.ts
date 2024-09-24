import {GlobalAttributeId, GlobalAttributeIdKey} from "../contract/Types";
import {pipe, RA} from "@viamedici-spc/fp-ts-extensions";

export default function GlobalAttributeIdKeyBuilder(attributeId: GlobalAttributeId): GlobalAttributeIdKey {
    const model = attributeId.sharedConfigurationModelId
        ? ["shared", attributeId.sharedConfigurationModelId]
        : ["root"];
    const path = [
        ...model,
        ...(attributeId.componentPath ?? []),
        attributeId.localId
    ];

    return pipe(
        path,
        RA.map(s => s.replace("::", "|::|")),
        a => a.join("::")
    );
}