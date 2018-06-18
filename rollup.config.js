import minify from 'rollup-plugin-babel-minify';

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
];