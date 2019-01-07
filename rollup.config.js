import resolve from 'rollup-plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
const typescript = require('rollup-plugin-typescript');

export default [
  {
    input: 'bin/wrappers/rough.js',
    output: {
      file: 'dist/rough.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/wrappers/rough.js',
    output: {
      file: 'dist/rough.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [terser()]
  },
  {
    input: 'bin/wrappers/rough-async.js',
    output: {
      file: 'dist/rough-async.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [resolve(), terser()]
  },
  {
    input: 'bin/wrappers/rough-async.js',
    output: {
      file: 'dist/rough-async.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [resolve(), terser()]
  },
  {
    input: 'bin/wrappers/worker.js',
    output: {
      file: 'dist/worker.js',
      format: 'iife',
      name: 'roughWorker'
    },
    plugins: [resolve(), terser()]
  },

  // es5
  {
    input: 'src/wrappers/rough.ts',
    output: {
      file: 'dist/rough.es5.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  },
  {
    input: 'src/wrappers/rough.ts',
    output: {
      file: 'dist/rough.es5.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  },
  {
    input: 'src/wrappers/rough-async.ts',
    output: {
      file: 'dist/rough-async.es5.js',
      format: 'iife',
      name: 'rough'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  },
  {
    input: 'src/wrappers/rough-async.ts',
    output: {
      file: 'dist/rough-async.es5.umd.js',
      format: 'umd',
      name: 'rough'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  },
  {
    input: 'src/wrappers/worker.ts',
    output: {
      file: 'dist/worker.es5.js',
      format: 'iife',
      name: 'roughWorker'
    },
    plugins: [typescript({ target: "es5" }), terser()]
  }
];