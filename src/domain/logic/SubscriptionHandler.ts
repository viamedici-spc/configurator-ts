import {guid} from "dyna-guid";
import {Subscription} from "../../contract/Types";
import GenericChangesHandler from "./GenericChangesHandler";
import {O} from "@viamedici-spc/fp-ts-extensions";
import {Option} from "fp-ts/Option";
import memoize from "memoizee";

export default class SubscriptionHandler<V, T extends ReadonlyArray<unknown>> {
    private readonly listeners = new Map<string, (...args: T) => void>;
    private readonly changesHandler: GenericChangesHandler<V, T>;
    private readonly calculateChangeSetFn: (previousValue: V | null, currentValue: V | null) => Option<T>;
    private currentValue: V | null = null;

    constructor(calculateChangeSetFn: (previousValue: V | null, currentValue: V | null) => Option<T>) {
        this.calculateChangeSetFn = memoize(calculateChangeSetFn);
        this.changesHandler = new GenericChangesHandler(calculateChangeSetFn);
    }

    public addListener(callback: (...args: T) => void): Subscription {
        const listenerId = guid();
        this.listeners.set(listenerId, callback);

        const newListenerChanges = this.calculateChangeSetFn(null, this.currentValue);
        if (O.isSome(newListenerChanges)) {
            callback(...newListenerChanges.value);
        }

        return {
            unsubscribe: () => {
                this.listeners.delete(listenerId);
            }
        };
    }

    public notifyListeners(value: V): void {
        this.currentValue = value;
        this.changesHandler.setValue(value);

        const changes = this.changesHandler.getChanges();
        if (O.isSome(changes)) {
            this.listeners.forEach((listener) => listener(...changes.value));
        }

        this.changesHandler.clearChanges();
    }

    public unsubscribeAllListeners(): void {
        this.listeners.clear();
    }
}