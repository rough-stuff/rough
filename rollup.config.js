import minify from 'rollup-plugin-babel-minify';
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import 'babel-polyfill/dist/polyfill.js';

const outFolder = 'dist';

export default [
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.js`,
      format: 'iife',
      name: 'rough'
    }
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.min.js`,
      format: 'iife',
      name: 'rough'
    },
    plugins: [minify({ comments: false })]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.umd.js`,
      format: 'umd',
      name: 'rough'
    }
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.umd.min.js`,
      format: 'umd',
      name: 'rough'
    },
    plugins: [minify({ comments: false })]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.es5.js`,
      format: 'iife',
      name: 'rough'
    },
    plugins: [babel(babelrc())]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.es5.min.js`,
      format: 'iife',
      name: 'rough'
    },
    plugins: [babel(babelrc()), minify({ comments: false })]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.umd.es5.js`,
      format: 'umd',
      name: 'rough'
    },
    plugins: [babel(babelrc())]
  },
  {
    input: 'bin/rough.js',
    output: {
      file: `${outFolder}/rough.umd.es5.min.js`,
      format: 'umd',
      name: 'rough'
    },
    plugins: [babel(babelrc()), minify({ comments: false })]
  }
];