import * as E from "fp-ts/Either";
import {expect} from "vitest";
import {stringify} from "./JSON";

export const expectToBeRight = <L, R>(e: E.Either<L, R>): R => {
    if (E.isRight(e)) {
        return e.right;
    }

    console.log(stringify(e.left));
    expect(E.isRight(e)).toBeTruthy();
    return null as never;
};

export const expectToBeLeft = <L, R>(e: E.Either<L, R>): L => {
    if (E.isLeft(e)) {
        return e.left;
    }

    console.log(stringify(e.right));
    expect(E.isLeft(e)).toBeTruthy();
    return null as never;
};