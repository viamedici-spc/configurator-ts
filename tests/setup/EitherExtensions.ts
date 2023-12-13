import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {expect} from "vitest";
import {ProblemDetails} from "../../src/apiClient/engine/models/generated/Engine";
import {FailureResult} from "../../src";

export type Failure = FailureResult | ProblemDetails
export const expectToBeRight = <R>(e: E.Either<Failure, R>): R => {
    if (E.isRight(e)) {
        return e.right;
    }
    console.error(e.left.type);
    expect(E.isRight(e)).toBeTruthy();
    throw new Error("never");
};

export const expectToBeLeft = (e: E.Either<Failure, any>): Failure => {
    if (E.isLeft(e)) {
        return e.left;
    }
    console.error(e.right);
    expect(E.isLeft(e)).toBeTruthy();
    throw new Error("never");
};

export const expectToBeSome = <T>(o: O.Option<T>): T => {
    expect(O.isSome(o)).toBeTruthy();
    if (!O.isSome(o)) {
        throw new Error("invalid");
    }
    return o.value;
};