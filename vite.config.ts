import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import autoprefixer from 'autoprefixer';

export default defineConfig(() => {
  return {
    plugins: [vue()],
    base: '/',
    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
    },
    resolve: {
      alias: [
        {
          find: /^~(.*)$/,
          replacement: '$1',
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src'),
        },
      ],
      extensions: [
        '.mjs',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
        '.vue',
        '.scss',
      ],
    },
    server: {
      port: 4000,
    },
    build: {
      sourcemap: true,
    },
  };
});
