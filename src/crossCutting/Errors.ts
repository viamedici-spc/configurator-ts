export function guardAgainstUnexpectedNullValue<T>(value?: T): T {
    if (value == null) {
        throw new Error("Implementation Error: Unexpected null value encountered");
    }

    return value;
}