import { LogLevel } from "./constants";
import { $, $$ } from "./utils";

export async function delay(time: number): Promise<void> { 
    return new Promise((resolve) => { 
        setTimeout(resolve, time) 
    });
}
        
export async function waitBy(conditionFn: () => boolean, checkEvery: number, timeout: number): Promise<void>{ 
    return new Promise((resolve, reject) => {
        const timerId = setInterval(() => {
            const condition = conditionFn();
            // @ts-ignore
            log(LogLevel.VERBOSE, this as LogLevel, `condition: ${condition}`);
            if(!condition){
                return;
            }
            clearInterval(timerId);
            resolve();
        }, checkEvery);
        setTimeout(() => {
            clearInterval(timerId);
            reject();
        }, timeout);
    });
}

export function findByText(selector: string, text: string, index: number = 0): Element | null { 
    return $$(selector)
        .filter( element => [...$$('*', element), element]
            .find(subElement => subElement.textContent.trim() === text)
        )?.[index] ?? null;
}

export type Query = string| [string, string|number, number|undefined];

export function select(query: Query ): Element | null {
    if (!Array.isArray(query)){
        return $(query);
    }
    const [selector, sub, subIndex] = query;
    if (typeof sub === 'number'){
        return $$(selector)[sub];
    }
    return findByText(selector, sub, subIndex);
}

export type Provider<T> = T | (() => T);

export function log(currentLevel: LogLevel, baseLevel: LogLevel, message: Provider<string>): void {

    if(currentLevel <= baseLevel){
        console.log(typeof message === 'function' ? message() : message );
    }
};

export const publicHelpers = {
    findByText, select 
}