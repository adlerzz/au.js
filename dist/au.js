(function () {
    'use strict';

    function $(selector, base = document) {
        return base.querySelector(selector);
    }
    function $$(selector, base = document) {
        return [...base.querySelectorAll(selector)];
    }
    function ord(char) {
        return char.codePointAt(0) ?? -1; // TODO get rid off -1
    }
    function chr(i) {
        return String.fromCodePoint(i);
    }
    function strSplice(string, from, delCount, insert = "") {
        return string.slice(0, from) + insert + string.slice(from + delCount);
    }
    function randomInt(from, to) {
        return Math.floor(from + Math.random() * (to - from));
    }
    function strFrom(length, fn) {
        return Array.from({ length }, (_, idx) => fn(idx)).join("");
    }
    function createAbc(first, last) {
        return strFrom(ord(last) - ord(first) + 1, (i) => chr(i + ord(first)));
    }
    function randomStr(length, abc) {
        return strFrom(length, () => abc[randomInt(0, abc.length)]);
    }

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        $: $,
        $$: $$,
        chr: chr,
        createAbc: createAbc,
        ord: ord,
        randomInt: randomInt,
        randomStr: randomStr,
        strSplice: strSplice
    });

    const UPPER_CHARS = createAbc("A", "Z");
    const LOWER_CHARS = createAbc("a", "z");
    const DIGITS = createAbc("0", "9");
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["VERBOSE"] = 100] = "VERBOSE";
        LogLevel[LogLevel["TRACE"] = 10] = "TRACE";
        LogLevel[LogLevel["OFF"] = 1] = "OFF";
    })(LogLevel || (LogLevel = {}));

    var constants = /*#__PURE__*/Object.freeze({
        __proto__: null,
        DIGITS: DIGITS,
        LOWER_CHARS: LOWER_CHARS,
        get LogLevel () { return LogLevel; },
        UPPER_CHARS: UPPER_CHARS
    });

    async function delay(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    }
    async function waitBy(conditionFn, checkEvery, timeout) {
        return new Promise((resolve, reject) => {
            const timerId = setInterval(() => {
                const condition = conditionFn();
                // @ts-ignore
                log(LogLevel.VERBOSE, this, `condition: ${condition}`);
                if (!condition) {
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
    function findByText(selector, text, index = 0) {
        return $$(selector)
            .filter(element => [...$$('*', element), element]
            .find(subElement => subElement.textContent.trim() === text))?.[index] ?? null;
    }
    function select(query) {
        if (!Array.isArray(query)) {
            return $(query);
        }
        const [selector, sub, subIndex] = query;
        if (typeof sub === 'number') {
            return $$(selector)[sub];
        }
        return findByText(selector, sub, subIndex);
    }
    function log(currentLevel, baseLevel, message) {
        if (currentLevel <= baseLevel) {
            console.log(typeof message === 'function' ? message() : message);
        }
    }
    const publicHelpers = {
        findByText, select
    };

    class AuModule {
        static context;
        static loglevel = LogLevel.TRACE;
        static getContext(key) {
            return AuModule.context[key];
        }
        static log(logLevel, message) {
            log(logLevel, AuModule.loglevel, message);
        }
        static begin(basicDelay = 500) {
            const id = randomInt(0, 1024);
            const actionsList = [];
            AuModule.context = {};
            class Builder {
                static doAction(func) {
                    const action = async () => {
                        await func();
                    };
                    actionsList.push([action, []]);
                    return Builder;
                }
                static setContext(key, producer) {
                    const action = async (key, producer) => {
                        const value = await producer();
                        AuModule.log(LogLevel.VERBOSE, `set "${key}" as '${value}'`);
                        AuModule.context[key] = value;
                    };
                    actionsList.push([action, [key, producer]]);
                    return Builder;
                }
                static setLogLevel(loglevel) {
                    const action = async () => {
                        AuModule.loglevel = loglevel;
                    };
                    actionsList.push([action, []]);
                    return Builder;
                }
                static delay(time) {
                    const action = async (time) => {
                        AuModule.log(LogLevel.VERBOSE, `delay ${time}ms...`);
                        await delay(time);
                        AuModule.log(LogLevel.VERBOSE, `...done`);
                    };
                    actionsList.push([action, [time]]);
                    return Builder;
                }
                static clickOn(query, time = basicDelay) {
                    const action = async (query, time) => {
                        AuModule.log(LogLevel.VERBOSE, `click on [${query}]`);
                        const element = select(query);
                        element?.click();
                        AuModule.log(LogLevel.VERBOSE, `wait for ${time}ms...`);
                        await delay(time);
                        AuModule.log(LogLevel.VERBOSE, `...done`);
                    };
                    actionsList.push([action, [query, time]]);
                    return Builder;
                }
                static typeText(query, text, time = basicDelay) {
                    const action = async (query, text, time) => {
                        typeof text === "function" && (text = text());
                        AuModule.log(LogLevel.VERBOSE, `type text: "${text}" into [${query}]`);
                        const wrapper = select(query);
                        if (!wrapper) {
                            return;
                        }
                        const felement = $("*>label", wrapper);
                        const ielement = $("input", wrapper);
                        felement?.click();
                        ielement.value = text;
                        ielement.dispatchEvent(new Event('input', { bubbles: true }));
                        AuModule.log(LogLevel.VERBOSE, `wait for ${time}ms`);
                        await delay(time);
                        AuModule.log(LogLevel.VERBOSE, `...done`);
                    };
                    actionsList.push([action, [query, text, time]]);
                    return Builder;
                }
                static waitFor(query, checkEvery = basicDelay, timeout = checkEvery * 60) {
                    const action = async (query, checkEvery, timeout) => {
                        AuModule.log(LogLevel.VERBOSE, "wait for");
                        return waitBy.call(AuModule.getContext, () => !!select(query), checkEvery, timeout);
                    };
                    actionsList.push([action, [query, checkEvery, timeout]]);
                    return Builder;
                }
                static waitUntil(query, checkEvery = basicDelay, timeout = checkEvery * 60) {
                    const action = async (query, checkEvery, timeout) => {
                        AuModule.log(LogLevel.VERBOSE, "wait until");
                        return waitBy.call(AuModule.getContext, () => !select(query), checkEvery, timeout);
                    };
                    actionsList.push([action, [query, checkEvery, timeout]]);
                    return Builder;
                }
                static async end() {
                    AuModule.log(LogLevel.VERBOSE, JSON.stringify(actionsList));
                    AuModule.log(LogLevel.VERBOSE, `au execute id:${id}`);
                    for (const [action, args] of actionsList) {
                        try {
                            await action.apply(null, args);
                        }
                        catch (error) {
                            console.error(error);
                            break;
                        }
                    }
                }
            }
            AuModule.log(LogLevel.VERBOSE, "au start");
            return Builder;
        }
    }

    (() => {
        // @ts-ignore
        globalThis.au = {
            ...utils,
            ...constants,
            ...publicHelpers,
            begin: AuModule.begin
        };
    })();

})();
