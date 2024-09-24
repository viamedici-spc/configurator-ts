import {describe, expect, it} from "vitest";
import {
    ConfigurationChanges,
    DecisionKind,
    GlobalAttributeIdKey
} from "../../../src";
import {flow, O, RM, some} from "@viamedici-spc/fp-ts-extensions";
import {getBooleanAttribute} from "../../data/AttributeGeneration";
import {HashedAttribute} from "../../../src/domain/model/HashedAttribute";
import HashedConfiguration from "../../../src/domain/model/HashedConfiguration";
import GenericChangesHandler from "../../../src/domain/logic/GenericChangesHandler";
import {calculateConfigurationChangedHandler} from "../../../src/domain/logic/HandlerChangeCalculation";
import * as RT from "fp-ts/ReadonlyTuple";
import {none} from "fp-ts/Option";

const newHandler = () => new GenericChangesHandler<HashedConfiguration, ConfigurationChanges>(flow(calculateConfigurationChangedHandler, O.map(RT.snd)));

describe("GenericChangesHandler", () => {
    it("Generates initial changes", () => {
        const configuration: HashedConfiguration = {
            isSatisfied: true,
            attributes: new Map<GlobalAttributeIdKey, HashedAttribute>()
        };


        const handlerWithChanges = newHandler();
        handlerWithChanges.setValue(configuration);
        const handlerWithoutChanges = newHandler();

        expect(handlerWithoutChanges.getChanges()).toStrictEqual(none);

        expect(handlerWithChanges.getChanges()).toStrictEqual(some({
            isSatisfied: true,
            attributes: {
                added: [],
                changed: [],
                removed: []
            }
        } satisfies ConfigurationChanges));
    });

    it("ClearChanges", () => {
        const configuration: HashedConfiguration = {
            isSatisfied: true,
            attributes: new Map<GlobalAttributeIdKey, HashedAttribute>()
        };

        const handler = newHandler();
        handler.setValue(configuration);

        handler.clearChanges();

        expect(handler.getChanges()).toStrictEqual(none);
    });

    it("Changes are memorized", () => {
        const mutableAttributeMap = new Map<GlobalAttributeIdKey, HashedAttribute>();

        const configuration: HashedConfiguration = {
            isSatisfied: true,
            attributes: mutableAttributeMap
        };

        const handler = newHandler();

        // Changes must be initial empty
        expect(handler.getChanges()).toStrictEqual(none);

        // Mutable change the Map. This isn't done during runtime, but helps to check whether the configuration is cached.
        const attribute = getBooleanAttribute("A1");
        mutableAttributeMap.set(attribute[0], attribute[1]);
        expect(RM.isEmpty(configuration.attributes)).toBeFalsy();

        // Changes must still be empty, because the handler assumes that the configuration is immutable.
        expect(handler.getChanges()).toStrictEqual(none);
    });

    describe("Attribute change calculation", () => {
        it("Changes are calculated correctly", () => {
            const initialConfiguration: HashedConfiguration = {
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1"),
                    getBooleanAttribute("A2"),
                    getBooleanAttribute("A3"),
                ])
            };

            const handler = newHandler();
            handler.setValue(initialConfiguration);
            handler.clearChanges();

            handler.setValue({
                isSatisfied: false,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1"),
                    getBooleanAttribute("A2", {
                        decision: {
                            kind: DecisionKind.Implicit,
                            state: true
                        }
                    }),
                    getBooleanAttribute("A4"),
                ])
            });

            expect(handler.getChanges()).toStrictEqual(some({
                isSatisfied: false,
                attributes: {
                    added: [
                        getBooleanAttribute("A4")[1]
                    ],
                    changed: [
                        getBooleanAttribute("A2", {
                            decision: {
                                kind: DecisionKind.Implicit,
                                state: true
                            }
                        })[1]
                    ],
                    removed: [
                        getBooleanAttribute("A3")[1].id
                    ]
                }
            } satisfies ConfigurationChanges));
        });

        it("Changes are determined by Hash only", () => {
            const initialConfiguration: HashedConfiguration = {
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1", {
                        hash: "123"
                    }),
                ])
            };

            const handler = newHandler();
            handler.setValue(initialConfiguration);
            handler.clearChanges();

            handler.setValue({
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1", {
                        decision: {
                            kind: DecisionKind.Implicit,
                            state: true
                        },
                        // The hash is still the same.
                        hash: "123"
                    }),
                ])
            });

            // The changes of attributes are only compared using the hash. Therefore, the changes to Decision are not recognized.
            expect(handler.getChanges()).toStrictEqual(none);
        });

        it("Changes are discarded when Attribute is reset", () => {
            const initialConfiguration: HashedConfiguration = {
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1"),
                ])
            };

            const handler = newHandler();
            handler.setValue(initialConfiguration);
            handler.clearChanges();

            handler.setValue({
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1", {
                        decision: {
                            kind: DecisionKind.Implicit,
                            state: true
                        }
                    }),
                ])
            });

            handler.setValue({
                isSatisfied: true,
                attributes: new Map<GlobalAttributeIdKey, HashedAttribute>([
                    getBooleanAttribute("A1"),
                ])
            });

            expect(handler.getChanges()).toStrictEqual(none);
        });
    });
});