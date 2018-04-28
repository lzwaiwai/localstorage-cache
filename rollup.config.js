// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  entry: './libs/index.js',
  format: 'umd',
  dest: 'localstorage-cache.js', // equivalent to --output
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  // external: ['sizeof'],
  // globals: {
  //   sizeof: 'sizeof'
  // },
  moduleName: 'localstorage-cache',
  sourceMap: true
};
