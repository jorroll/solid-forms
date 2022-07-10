import typescript from "@rollup/plugin-typescript";
import jsx from "acorn-jsx";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import withSolid from "rollup-preset-solid";
import commonjs from "@rollup/plugin-commonjs";

export default withSolid([
  {
    input: "core",
    targets: ["esm", "cjs", "jsx", "tsc"],
    plugins: [commonjs()],
    external: ["fast-deep-equal/es6", "solid-js"],
    // writePackageJson: true,
    // output: {
    //   name: "core",
    // },
  },
  {
    input: "src/public-api.ts",
    targets: ["esm", "cjs", "jsx", "tsc"],
    plugins: [commonjs()],
    external: ["fast-deep-equal/es6", "solid-js", "solid-forms/core"],
  },
]);
