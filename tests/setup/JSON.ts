export function stringify(value: any): string {
    return JSON.stringify(value, replacer, 4);
}

function replacer(_key: string, value: unknown): unknown {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}