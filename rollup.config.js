import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';

const input = 'bin/rough.js';

export default [
  {
    input,
    output: {
      file: 'bundled/rough.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input,
    output: {
      file: 'bundled/rough.esm.js',
      format: 'esm'
    },
    plugins: [terser()]
  },
  {
    input: 'src/rough.ts',
    output: {
      file: 'bundled/rough.cjs.js',
      format: 'cjs'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  }
];