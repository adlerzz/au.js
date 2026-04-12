import { $, randomInt } from "./utils";
import { LogLevel } from "./constants";
import { delay, log, Provider, Query, select, waitBy } from "./helpers";

export class AuModule {

    static context: Record<string, unknown>;
    static loglevel = LogLevel.TRACE; 

    static getContext(key: string): unknown {
        return AuModule.context[key];
    }

    static log(logLevel: LogLevel, message: Provider<string>): void {
        log(logLevel, AuModule.loglevel, message);
    }

    static begin(basicDelay = 500){
        const id = randomInt(0, 1024);
        const actionsList: Array<[Function, Array<unknown>]> = [];
        AuModule.context = {};
        class Builder {

            static doAction( func: Function ): Builder {
                const action = async () => {
                    await func();
                };
                actionsList.push( [action, []]);
                return Builder;
            }
            
            static setContext(key: string, producer: () => unknown): Builder  {
                const action = async (key: string, producer: () => unknown) => {
                    const value = await producer();
                    AuModule.log(LogLevel.VERBOSE, `set "${key}" as '${value}'`);
                    AuModule.context[key] = value;
                };
                actionsList.push( [action, [key, producer]]);
                return Builder;
            }

            static setLogLevel(loglevel: LogLevel): Builder  {
                const action = async () => {
                    AuModule.loglevel = loglevel;
                }
                actionsList.push( [action, []]);
                return Builder;
            }

            static delay(time: number): Builder  {
                const action = async (time: number) => {
                    AuModule.log(LogLevel.VERBOSE, `delay ${time}ms...`);
                    await delay(time);
                    AuModule.log(LogLevel.VERBOSE, `...done`);
                }
                actionsList.push( [action, [time]]);
                return Builder;
            }

            static clickOn(query: Query, time = basicDelay): Builder {
                const action = async (query: Query, time: number) => {
                    AuModule.log(LogLevel.VERBOSE, `click on [${query}]`);
                    const element = select(query) as HTMLElement;
                    element?.click();
                    AuModule.log(LogLevel.VERBOSE, `wait for ${time}ms...`);
                    await delay(time);
                    AuModule.log(LogLevel.VERBOSE, `...done`);
                };
                actionsList.push([action, [query, time]]);
                return Builder;
            }

            static typeText(query: Query, text: Provider<string>, time: number = basicDelay): Builder {
                const action = async (query: Query, text: Provider<string>, time: number) => {
                    typeof text === "function" && (text = text());
                    AuModule.log(LogLevel.VERBOSE, `type text: "${text}" into [${query}]`);
                    const wrapper = select(query);
                    if(!wrapper){
                        return;
                    }
                    const felement = $("*>label", wrapper) as HTMLElement;
                    const ielement = $("input", wrapper) as HTMLInputElement;
                    felement?.click();
                    
                    ielement.value = text;
                    ielement.dispatchEvent(new Event('input', {bubbles: true}));

                    AuModule.log(LogLevel.VERBOSE, `wait for ${time}ms`);
                    await delay(time);
                    AuModule.log(LogLevel.VERBOSE, `...done`);
                };
                actionsList.push([action, [query, text, time]]);
                return Builder;
            }

            static waitFor(query: Query, checkEvery = basicDelay, timeout = checkEvery * 60): Builder {
                const action = async (query: Query, checkEvery: number, timeout: number) => {
                    AuModule.log(LogLevel.VERBOSE, "wait for");
                    return waitBy.call(AuModule.getContext, () => !!select(query), checkEvery, timeout);
                }
                actionsList.push([action, [query, checkEvery, timeout]])
                return Builder;
            }

            static waitUntil(query: Query, checkEvery = basicDelay, timeout = checkEvery * 60): Builder {
                const action = async (query: Query, checkEvery: number, timeout: number) => {
                    AuModule.log(LogLevel.VERBOSE, "wait until");
                    return waitBy.call (AuModule.getContext, () => !select(query), checkEvery, timeout);
                }
                actionsList.push([action, [query, checkEvery, timeout]])
                return Builder;
            }

            static async end(): Promise<void> {
                AuModule.log(LogLevel.VERBOSE, JSON.stringify(actionsList));
                AuModule.log(LogLevel.VERBOSE, `au execute id:${id}`);
                for(const [action, args] of actionsList){
                    try {
                        await action.apply(null, args);
                    } catch (error){
                        console.error(error);
                        break;
                    }
                };
            }
        }
        
        AuModule.log(LogLevel.VERBOSE, "au start");
        return Builder;
    }

}