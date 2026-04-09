(() => {
    
    const $ = (selector, base = document) => base.querySelector(selector);
    const $$ = (selector, base = document) => [...base.querySelectorAll(selector)];
    const ord = (char) => char.codePointAt();
    const chr = (i) => String.fromCodePoint(i);
    const strSplice = (string, from, delCount, insert) => string.slice(0, from) + insert + string.slice(from + delCount);
    const randomInt = (from, to) => Math.floor(from + Math.random() * (to - from));
    const strFrom = (length, f) => Array.from({length}, (_, i) => f(i)).join("");
    const createAbc = (first, last) => strFrom(ord(last) - ord(first) + 1, (i) => chr(i + ord(first)));
    const randomStr = (length, abc) => strFrom(length, () => abc[randomInt(0, abc.length)]);

    const UPPER_CHARS = createAbc("A", "Z");
    const LOWER_CHARS = createAbc("a", "z");
    const DIGITS = createAbc("0", "9");

    const delay = async (time) => 
        new Promise((resolve) => { 
            setTimeout(resolve, time) 
        });
        
    const waitBy = async (conditionFn, checkEvery, timeout) => 
        new Promise((resolve, reject) => {
            const timerId = setInterval(() => {
                const condition = conditionFn();
                log(LogLevel.VERBOSE, `condition: ${condition}`);
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

    const findByText = (selector, text, index = 0) => 
        $$(selector)
            .filter( element => $$('*', element)
                .find(subElement => subElement.textContent.trim() === text)
            )?.[index];

    const select = (query) => {
        if (!Array.isArray(query)){
            return $(query);
        }
        const [selector, sub, subIndex] = query;
        if (typeof sub === 'number'){
            return $$(selector)[sub];
        }
        return findByText(selector, sub, subIndex);
    }
        
    const getContext = (name) => AuModule.context[name];

    const log = (level, message) => {
        if(level <= AuModule.loglevel){
            console.log(typeof message === 'function' ? message() : message );
        }
    };
    
    const LogLevel = {
        VERBOSE: 100,
        TRACE: 10,
        OFF: 1,
    };

    class AuModule {

        static context = {};
        static loglevel = LogLevel.TRACE; 

        static begin(basicDelay = 500){
            const id = randomInt(0, 1024);
            const actionsList = [];
            AuModule.context = {};
            class Builder {

                static doAction( func ) {
                    const action = async () => {
                        await func();
                    };
                    actionsList.push( [action, []]);
                    return Builder;
                }
                
                static setContext(name, producer) {
                    const action = async () => {
                        AuModule.context[name] = await producer();
                    };
                    actionsList.push( [action, []]);
                    return Builder;
                }

                static setLogLevel(loglevel) {
                    const action = async () => {
                        AuModule.loglevel = loglevel;
                    }
                    actionsList.push( [action, []]);
                    return Builder;
                }

                static delay(time) {
                    const action = async (time) => {
                        await delay(time);
                    }
                    actionsList.push( [action, [time]]);
                    return Builder;
                }

                static clickOn(query, time = basicDelay){
                    const action = async (query, time) => {
                        log(LogLevel.VERBOSE, `click on [${query}]`);
                        const element = select(query);
                        element?.click();
                        log(LogLevel.VERBOSE, `wait for ${time}ms`);
                        await delay(time);
                    };
                    actionsList.push([action, [query, time]]);
                    return Builder;
                }

                static typeText(query, text, time = basicDelay){
                    const action = async (query, text, time) => {
                        typeof text === "function" && (text = text());
                        log(LogLevel.VERBOSE, `type text: "${text}" into [${query.join(", ")}]`);
                        const wrapper = select(query);
                        const felement = $("*>label", wrapper);
                        const ielement = $("input", wrapper);
                        felement.click();
                        
                        ielement.value = text;
                        ielement.dispatchEvent(new Event('input', {bubbles: true}));

                        log(LogLevel.VERBOSE, `wait for ${time}ms`);
                        await delay(time);
                    };
                    actionsList.push([action, [query, text, time]]);
                    return Builder;
                }

                static waitFor(query, checkEvery = basicDelay, timeout = checkEvery * 60){
                    const action = async (query, checkEvery, timeout) => {
                        log(LogLevel.VERBOSE, "wait")
                            return waitBy(() => !!select(query), checkEvery, timeout);
                        }
                    actionsList.push([action, [query, checkEvery, timeout]])
                    return Builder;
                }

                static waitUntil(query, checkEvery = basicDelay, timeout = checkEvery * 60){
                    const action = async (query, checkEvery, timeout) => 
                        waitBy(() => !select(query), checkEvery, timeout);
                    actionsList.push([action, [query, checkEvery, timeout]])
                    return Builder;
                }

                static async end(){
                    log(LogLevel.VERBOSE, {actionsList});
                    log(LogLevel.VERBOSE, `au execute id:${id}`);
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
            
            log(LogLevel.VERBOSE, "au start");
            return Builder;
        }

    }

    globalThis.au = {
        $, $$, strSplice, randomInt, randomStr, strFrom,
        createAbc, findByText, select, getContext, log, 
        DIGITS, UPPER_CHARS, LOWER_CHARS,
        LogLevel,
        begin: AuModule.begin,
    }
})();