import resolve from 'rollup-plugin-node-resolve';
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
    plugins: [resolve(), terser()]
  },
  {
    input,
    output: {
      file: 'bundled/rough.esm.js',
      format: 'esm'
    },
    plugins: [resolve(), terser()]
  },
  {
    input: 'src/rough.ts',
    output: {
      file: 'bundled/rough.cjs.js',
      format: 'cjs'
    },
    plugins: [resolve(), typescript({ target: "es5" }), terser()]
  }
];