export function logJson<T>(value: T, context?: string): void {
    console.log(`--------------------------------------------------------------------------------\n-- ${context ?? ""}\n--------------------------------------------------------------------------------\n${JSON.stringify(value, null, 2)}`);
}