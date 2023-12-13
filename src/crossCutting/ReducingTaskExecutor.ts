import {flow, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";

export default abstract class ReducingTaskExecutor<TR, TA> {

    private queue: DeferredPromise<TA, TR>[] = [];
    private operating: O.Option<Promise<void>> = O.none;

    protected abstract reduce(a: O.Option<TA>, c: TA): O.Option<TA>;

    protected abstract execute(param: TA): Promise<TR>;

    public push(a: TA) {

        const taskPromise = new DeferredPromise<TA, TR>(a);

        this.queue.push(taskPromise);

        this.operating = pipe(
            this.operating,
            O.getOrElse(() => {
                return this.start();
            }),
            O.of
        );

        return taskPromise.promise;
    }

    public async start() {

        while (this.queue.length) {
            const items = [...this.queue];
            this.queue = [];

            const task = pipe(items,
                RA.map(i => i.argument),
                RA.reduce(O.none, (a: O.Option<TA>, c) => {
                    return this.reduce(a, c);
                }),
                O.map(
                    flow(argument => {
                            return this.execute(argument);
                        },
                        t => t.then(r => {
                            pipe(items, RA.map(dp => {
                                dp.resolve(r);
                            }));
                        }).catch(e => {
                            pipe(items, RA.map(dp => {
                                dp.reject(e);
                            }));
                        }))),
                O.toUndefined
            );

            if (task) {
                await task;
            }
        }

        this.operating = O.none;
    }

    public async flush() {
        return this.operating || Promise.resolve();
    }

    public size() {
        return this.queue.length;
    }
}

class DeferredPromise<TA, TR = void, E = any> {
    public argument: TA;

    promise: Promise<TR>;

    constructor(argument: TA) {
        this.argument = argument;

        this.promise = new Promise<TR>((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }

    resolve: (x: TR | PromiseLike<TR>) => void = () => {
    };

    reject: (x: E) => void = () => {
    };
}