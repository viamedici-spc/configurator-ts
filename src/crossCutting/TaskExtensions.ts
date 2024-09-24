import {Task} from "@viamedici-spc/fp-ts-extensions";

export type TaskType<T extends Task<any>> = T extends Task<infer R> ? R : never;