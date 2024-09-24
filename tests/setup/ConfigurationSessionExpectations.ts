import {expect} from "vitest";
import IConfigurationSession from "../../src/IConfigurationSession";
import {
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ChoiceValueId,
    GlobalAttributeId,
    NumericAttribute
} from "../../src";
import * as Interpreter from "../../src/contract/interpreter/ConfigurationInterpreter";
import ConfigurationSession from "../../src/ConfigurationSession";
import {fromRawData} from "../../src/domain/logic/Configuration";
import {configurationEq, hashedConfigurationEq} from "../../src/contract/Eqs";

type ApFirstResult<T extends Function> = T extends (p1: any, ...args: infer P) => infer R ? (...args: P) => R : never;

function apFirst<P1, P extends ReadonlyArray<unknown>, R>(fn: (p1: P1, ...args: P) => R, p1: P1): ApFirstResult<typeof fn> {
    return ((...args: P): R => fn(p1, ...args)) as unknown as ApFirstResult<typeof fn>;
}

function expectChoiceAttribute(session: IConfigurationSession) {
    return (id: GlobalAttributeId, additionalExpectations?: (sut: ChoiceAttribute, expectations: {
        expectChoiceValue: ApFirstResult<ReturnType<typeof expectChoiceValue>>
    }) => void) => {
        const attribute = Interpreter.getChoiceAttribute(session.getConfiguration(), id);
        expect(attribute).toBeTruthy();

        if (additionalExpectations) {
            additionalExpectations(attribute!, {
                expectChoiceValue: apFirst(expectChoiceValue(session), id)
            });
        }

        return attribute!;
    };
}

function expectNumericAttribute(session: IConfigurationSession) {
    return (id: GlobalAttributeId, additionalExpectations?: (sut: NumericAttribute) => void) => {
        const attribute = Interpreter.getNumericAttribute(session.getConfiguration(), id);
        expect(attribute).toBeTruthy();

        if (additionalExpectations) {
            additionalExpectations(attribute!);
        }

        return attribute!;
    };
}

function expectBooleanAttribute(session: IConfigurationSession) {
    return (id: GlobalAttributeId, additionalExpectations?: (sut: BooleanAttribute) => void) => {
        const attribute = Interpreter.getBooleanAttribute(session.getConfiguration(), id);
        expect(attribute).toBeTruthy();

        if (additionalExpectations) {
            additionalExpectations(attribute!);
        }

        return attribute!;
    };
}

function expectChoiceValue(session: IConfigurationSession) {
    return (id: GlobalAttributeId, choiceValueId: ChoiceValueId, additionalExpectations?: (sut: ChoiceValue) => void) => {
        const choiceValue = Interpreter.getChoiceValue(session.getConfiguration(), id, choiceValueId);
        expect(choiceValue).toBeTruthy();

        if (additionalExpectations) {
            additionalExpectations(choiceValue!);
        }

        return choiceValue!;
    };
}

function expectSatisfaction(session: IConfigurationSession): (isSatisfied: boolean) => void {
    return isSatisfied => {
        expect(session.getConfiguration().isSatisfied).toBe(isSatisfied);
    };
}

function expectRawDataToBeSameAsConfiguration(session: IConfigurationSession): () => void {
    return () => {
        const configurationSession = session as ConfigurationSession;
        const configurationFromRawData = fromRawData(configurationSession.sessionState.configurationRawData);

        expect(hashedConfigurationEq.equals(configurationFromRawData, configurationSession.sessionState.configuration)).toBeTruthy();
        expect(configurationEq.equals(configurationFromRawData, session.getConfiguration())).toBeTruthy();
    };
}


export default function getConfigurationSessionExpectations(session: IConfigurationSession) {
    return {
        expectChoiceAttribute: expectChoiceAttribute(session),
        expectSatisfaction: expectSatisfaction(session),
        expectChoiceValue: expectChoiceValue(session),
        expectNumericAttribute: expectNumericAttribute(session),
        expectBooleanAttribute: expectBooleanAttribute(session),
        expectRawDataToBeSameAsConfiguration: expectRawDataToBeSameAsConfiguration(session),
    };
}