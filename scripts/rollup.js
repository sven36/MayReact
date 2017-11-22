import babel from "rollup-plugin-babel";

export default {
    input:'./src/May.js',
    output:{
        file:'./dist/May.js',
        format: "cjs"
    },
    plugins:[babel]
}