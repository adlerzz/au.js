import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const plugins = [
    resolve({ browser: true }),
    //commonjs()
];

const treeshake = {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
};

export default [
    /*{
        input: "src/au.js",
        output: {
            file: "dist/index.js",
            format: "es"
        },
        plugins,
        treeshake
    },
    // Global standalone (IIFE)
    {
        input: "src/au.js",
        output: {
            file: "dist/au.global.js",
            format: "iife",
            name: "au"
        },
        plugins: [...plugins, terser()],
        treeshake
    }, */
    {
        input: "src/ts/main.ts",
        output: {
            file: "dist/au.js",
            format: "iife",
            name: "au",
        },
        plugins: [typescript()]
    },
    {
        input: "src/ts/main.ts",
        output: {
            file: "dist/au.min.js",
            format: "iife",
            name: "au"
        },
        plugins: [typescript(), terser()]
    }
]