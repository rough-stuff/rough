/* eslint-disable strict */
/* eslint-env node */

const minify = require('rollup-plugin-babel-minify');
const typescript = require('rollup-plugin-typescript');

const outFolder = 'dist';
const outName = 'rough';
const input = 'src/rough.ts';


module.exports = [
  {
    input,
    output: {
      file: `${outFolder}/rough.js`,
      format: 'iife',
      name: outName,
    },
    plugins: [typescript()]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.min.js`,
      format: 'iife',
      name: outName
    },
    plugins: [typescript(), minify({ comments: false })]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.umd.js`,
      format: 'umd',
      name: outName
    },
    plugins: [typescript()]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.umd.min.js`,
      format: 'umd',
      name: outName
    },
    plugins: [typescript(), minify({ comments: false })]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.es5.js`,
      format: 'iife',
      name: outName
    },
    plugins: [typescript({ target: "es5" })]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.es5.min.js`,
      format: 'iife',
      name: outName
    },
    plugins: [typescript({ target: "es5" }), minify({ comments: false })]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.umd.es5.js`,
      format: 'umd',
      name: outName
    },
    plugins: [typescript({ target: "es5" })]
  },
  {
    input,
    output: {
      file: `${outFolder}/rough.umd.es5.min.js`,
      format: 'umd',
      name: outName
    },
    plugins: [typescript({ target: "es5" }), minify({ comments: false })]
  }
];