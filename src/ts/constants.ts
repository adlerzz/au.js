import { createAbc } from "./utils";

export const UPPER_CHARS = createAbc("A", "Z");
export const LOWER_CHARS = createAbc("a", "z");
export const DIGITS = createAbc("0", "9");

export enum LogLevel {
    VERBOSE = 100,
    TRACE = 10,
    OFF = 1,
};