import { nodeResolve } from '@rollup/plugin-node-resolve';
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
    plugins: [nodeResolve(), terser({
      output: {
        comments: false
      }
    })]
  },
  {
    input,
    output: {
      file: 'bundled/rough.esm.js',
      format: 'esm'
    },
    plugins: [nodeResolve(), terser({
      output: {
        comments: false
      }
    })]
  },
  {
    input: 'src/rough.ts',
    output: {
      file: 'bundled/rough.cjs.js',
      format: 'cjs'
    },
    plugins: [nodeResolve(), typescript({ target: "es5", importHelpers: true }), terser({
      output: {
        comments: false
      }
    })]
  }
];