import * as O from "fp-ts/Option";
import {Interpreter} from "../../../src/domain/services/Interpreter";
import {describe, it, expect} from "vitest";
import {
    AttributeType,
    DecisionKind,
    DecisionState,
    ConfigurationModelSourceType
} from "../../../src/domain/Model";

describe("Interpreter", () => {
    const sut = new Interpreter();

    it("Should have changes", () => {
        const hasExplicitDecisions = sut.configurationSession.hasExplicitDecisions({
            configuration: {
                isSatisfied: false,
                attributes: [
                    {
                        type: AttributeType.Choice,
                        attributeId: {localId: ""},
                        isSatisfied: false,
                        values: [
                            {
                                choiceValueId: "",
                                decision: O.of({
                                    state: DecisionState.Included,
                                    kind: DecisionKind.Explicit
                                }),
                                possibleDecisionStates: [DecisionState.Included]
                            }
                        ],
                        cardinality: {
                            upperBound: 1,
                            lowerBound: 1
                        },
                        canContributeToConfigurationSatisfaction: false
                    }
                ]
            },
            context: {
                configurationModelSource: {
                    type: ConfigurationModelSourceType.Channel,
                    deploymentName: "",
                    channel: ""
                },
                decisionsToRespect: O.none,
                usageRuleParameters: {},
                allowedInExplain: O.none
            },
            sessionId: O.of(""),
            solutions: []
        });

        expect(hasExplicitDecisions).toBe(true);
    });
});