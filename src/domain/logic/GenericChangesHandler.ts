import {Option} from "fp-ts/Option";
import memoize from "memoizee";

export default class GenericChangesHandler<V, C> {
    protected previousValue: V | null = null;
    protected currentValue: V | null = null;
    protected readonly calculateChangeSetFn: (previousValue: V | null, currentValue: V | null) => Option<C>;

    constructor(calculateChangeSetFn: (previousValue: V | null, currentValue: V | null) => Option<C>) {
        this.calculateChangeSetFn = memoize(calculateChangeSetFn);
    }

    public setValue(value: V): void {
        this.currentValue = value;
    }

    public clearChanges(): void {
        this.previousValue = this.currentValue;
    }

    public getChanges(): Option<C> {
        return this.calculateChangeSetFn(this.previousValue, this.currentValue);
    }
}