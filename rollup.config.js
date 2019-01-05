import resolve from 'rollup-plugin-node-resolve';
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'bin/root/rough.js',
    output: {
      file: 'dist/rough.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/root/rough.js',
    output: {
      file: 'dist/rough.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/root/worker.js',
    output: {
      file: 'dist/worker.js',
      format: 'iife',
      name: 'roughWorker'
    },
    plugins: [resolve(), terser()]
  }
];