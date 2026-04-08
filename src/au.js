(() => {
    const utils = {
        $: (selector, base = document) => base.querySelector(selector),
        $$: (selector, base = document) => [...base.querySelectorAll(selector)],
        ord: (char) => char.codePointAt(),
        chr: (i) => String.fromCodePoint(i),
        strSplice: (string, from, delCount, insert) => string.slice(0, from) + insert + string.slice(from + delCount),
        randomInt: (from, to) => from + Math.random() * (to - from) | 0,
        strFrom: (length, f) => Array.from({length}, (_, i) => f(i)).join(""),
        abc: (first, last) => utils.strFrom(utils.ord(last) - utils.ord(first) + 1, (i) => utils.chr(i + utils.ord(first))),
        randomStr: (length, abc) => utils.strFrom(length, () => abc[utils.randomInt(0, abc.length)]),
    };
    utils.UPPER_CHARS = utils.abc("A", "Z");
    utils.LOWER_CHARS = utils.abc("a", "z");
    utils.DIGITS = utils.abc("0", "9");

    const internal = {
        delay: async (time) => new Promise((resolve) => { setTimeout(resolve, time) }),
        waitBy: async (condition, checkEvery, timeout) => 
            new Promise((resolve, reject) => {
                const timerId = setInterval(() => {
                    console.log("condition", condition());
                    if(condition()){
                        clearInterval(timerId);
                        resolve();
                    }
                }, checkEvery);
                setTimeout(() => {
                    clearInterval(timerId);
                    reject();
                }, timeout);
            }),

        findByText: (selector, text, index = 0) => 
            utils.$$(selector)
                .filter( element => utils.$$('*', element)
                    .find(subElement => subElement.textContent.trim() === text)
                )?.[index],

        select: (query) => {
            if (!Array.isArray(query)){
                return utils.$(query);
            }
            const [selector, sub, subIndex] = query;
            if (typeof sub === 'number'){
                return utils.$$(selector)[sub];
            }
            return internal.findByText(selector, sub, subIndex);
        },
        
        getContext: (name) => AuModule.context[name],
    }

    class AuModule {

        static context = {};

        static begin(basicDelay = 500){
            const id = utils.randomInt(0, 1024);
            const actionsList = [];
            AuModule.context = {};
            class Builder {

                static doAction( func ) {
                    const action = async () => {
                        func();
                    };
                    actionsList.push( [action, []]);
                    return Builder;
                }
                
                static setContext(name, producer) {
                    const action = async () => {
                        AuModule.context[name] = producer();
                    };
                    actionsList.push( [action, []]);
                    return Builder;
                }

                static delay(time) {
                    const action = async (time) => {
                        await internal.delay(time);
                    }
                    actionsList.push( [action, [time]]);
                    return Builder;
                }

                static clickOn(query, time = basicDelay){
                    const action = async (query, time) => {
                        console.info(`click on "${query}"`);
                        const element = internal.select(query);
                        element?.click();
                        console.info(`wait for ${time}ms`);
                        await internal.delay(time);
                    };
                    actionsList.push([action, [query, time]]);
                    return Builder;
                }

                static typeText(query, text, time = basicDelay){
                    const action = async (query, text, time) => {
                        console.info(`input into "${query}"`);
                        console.info(`text: "${text}"`);
                        const wrapper = internal.select(query);
                        const felement = utils.$("*>label", wrapper);
                        const ielement = utils.$("input", wrapper);
                        felement.click();
                        ielement.value = typeof text === 'function' ? text() : text;
                        ielement.dispatchEvent(new Event('input', {bubbles: true}));
                        console.info(`wait for ${time}ms`);
                        await internal.delay(time);
                    };
                    actionsList.push([action, [query, text, time]]);
                    return Builder;
                }

                static waitFor(query, checkEvery = basicDelay, timeout = checkEvery * 60){
                    const action = async (query, checkEvery, timeout) => 
                        internal.waitBy(() => !!internal.select(query), checkEvery, timeout);
                    actionsList.push([action, [query, checkEvery, timeout]])
                    return Builder;
                }

                static waitUntil(query, checkEvery = basicDelay, timeout = checkEvery * 60){
                    const action = async (query, checkEvery, timeout) => 
                        internal.waitBy(() => !internal.select(query), checkEvery, timeout);
                    actionsList.push([action, [query, checkEvery, timeout]])
                    return Builder;
                }

                static async end(){
                    console.log({actionsList});
                    console.log(`${id}, inner Builder.end();`);
                    for(const [action, args] of actionsList){
                        await action.apply(null, args);
                    };
                }
            }
            
            console.log("Au.begin()");
            return Builder;
        }

    }

    globalThis.au = {
        ...utils,
        ...internal,
        begin: AuModule.begin,
    }
})();