import {O, pipe} from "@viamedici-spc/fp-ts-extensions";
import {describe, it, expect} from "vitest";
import ReducingTaskExecutor from "../../../src/crossCutting/ReducingTaskExecutor";

export class A extends ReducingTaskExecutor<string, string> {
    protected reduce(a: O.Option<string>, c: string): O.Option<string> {
        return pipe(a, O.map(a => `${a}${c}`), O.alt(() => O.of(c)));
    }

    protected execute(param: string): Promise<string> {
        return Promise.resolve(param);
    }
}

describe("ReducingTaskExecutor", () => {

    describe("Success Cases", () => {
        it("Basic", async () => {
            const sut = new A();

            const t1 = sut.push("1");
            const t2 = sut.push("2");
            const t3 = sut.push("3");

            const r3 = await t3;
            const r2 = await t2;
            const r1 = await t1;

            expect(r3).toBe("23");
            expect(r2).toBe("23");
            expect(r1).toBe("1");
        });

        it("Basic Stuttered", async () => {
            const sut = new A();

            const t1 = sut.push("1");
            const t2 = sut.push("2");
            const t3 = sut.push("3");

            const r3 = await t3;
            const r2 = await t2;
            const r1 = await t1;

            const t4 = sut.push("4");
            const r4 = await t4;

            expect(r4).toBe("4");
            expect(r3).toBe("23");
            expect(r2).toBe("23");
            expect(r1).toBe("1");
        });
    });
});