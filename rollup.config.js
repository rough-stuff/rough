import resolve from 'rollup-plugin-node-resolve';
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'bin/rough.js',
    output: {
      file: 'dist/rough.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: 'dist/rough.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/worker.js',
    output: {
      file: 'dist/worker.js',
      format: 'iife',
      name: 'roughWorker'
    },
    plugins: [resolve(), terser()]
  }
];