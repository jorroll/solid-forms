import typescript from "@rollup/plugin-typescript";
import jsx from "acorn-jsx";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import withSolid from "rollup-preset-solid";
import commonjs from "@rollup/plugin-commonjs";

export default withSolid({
  input: "src/public-api.ts",
  targets: ["esm", "cjs", "jsx", "umd", "tsc"],
  plugins: [commonjs()],
  external: ["fast-deep-equal/es6"],
});

// const external = [
//   "rxjs",
//   "rxjs/operators",
//   "solid-js",
//   "rx-controls",
//   "tslib",
//   "ts-essentials",
// ];

// export default [
//   {
//     input: "src/public-api.ts",
//     output: {
//       file: "./build/module.js",
//       format: "esm",
//     },
//     external,
//     // this is necessary because otherwise rollup removes
//     // line 68 (const Component = options.component as any;) from
//     // `with-control.tsx` which breaks the bundle
//     treeshake: false,
//     acornInjectPlugins: [jsx()],
//     plugins: [
//       typescript(),
//       getBabelOutputPlugin({
//         presets: ["babel-preset-solid"],
//       }),
//     ],
//   },
//   {
//     input: "src/public-api.ts",
//     output: {
//       file: "./build/main.js",
//       format: "cjs",
//     },
//     external,
//     // this is necessary because otherwise rollup removes
//     // line 68 (const Component = options.component as any;) from
//     // `with-control.tsx` which breaks the bundle
//     treeshake: false,
//     acornInjectPlugins: [jsx()],
//     plugins: [
//       typescript(),
//       getBabelOutputPlugin({
//         presets: ["babel-preset-solid"],
//       }),
//     ],
//   },
// ];
