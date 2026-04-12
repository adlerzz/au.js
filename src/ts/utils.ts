export function $(selector: string, base: Document|Element = document): Element | null {
    return base.querySelector(selector);
} 

export function $$(selector: string, base: Document|Element = document): Element[] {
    return [...base.querySelectorAll(selector)];
}

export function ord(char: string): number {
    return char.codePointAt(0) ?? -1; // TODO get rid off -1
}

export function chr(i: number): string{
    return String.fromCodePoint(i);
} 

export function strSplice(string: string, from: number, delCount: number, insert: string = ""): string {
    return string.slice(0, from) + insert + string.slice(from + delCount);
} 

export function randomInt(from: number, to: number){
    return Math.floor(from + Math.random() * (to - from));
} 

function strFrom(length: number, fn: (index: number) => string): string {
    return Array.from({length}, (_, idx) => fn(idx)).join("");
} 

export function createAbc(first: string, last: string): string{
    return strFrom(ord(last) - ord(first) + 1, (i) => chr(i + ord(first)));
} 

export function randomStr(length: number, abc: string): string {
    return strFrom(length, () => abc[randomInt(0, abc.length)]);
}
