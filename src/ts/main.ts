import { AuModule } from "./au.class";
import { publicHelpers } from "./helpers";
import * as utils from "./utils";
import * as constants from "./constants"
(() => {
    // @ts-ignore
    globalThis.au = {
        ...utils,
        ...constants,
        ...publicHelpers,
        begin: AuModule.begin
    }
})()