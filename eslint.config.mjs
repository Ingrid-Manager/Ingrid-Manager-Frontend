import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },

  ...eslintPluginVue.configs['flat/essential'],

  {
    files: ['src/**/*.vue'],

    languageOptions: {
      parser: vueParser,

      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
    },

    rules: {
      ...tseslint.configs.recommended.rules,

      'vue/multi-word-component-names': 'off',

      'vue/html-self-closing': 'off',

      'vue/max-attributes-per-line': 'off',

      'vue/singleline-html-element-content-newline': 'off',

      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-unused-vars': ['error'],

      '@typescript-eslint/explicit-function-return-type': 'off',

      '@typescript-eslint/explicit-module-boundary-types': 'off',

      'no-unused-vars': 'off',

      'require-await': 'off',
    },
  },

  {
    files: ['src/**/*.ts'],

    languageOptions: {
      parser: tsParser,

      ecmaVersion: 'latest',

      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
    },

    rules: {
      ...tseslint.configs.recommended.rules,

      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-unused-vars': ['error'],

      '@typescript-eslint/explicit-function-return-type': 'off',

      '@typescript-eslint/explicit-module-boundary-types': 'off',

      'no-unused-vars': 'off',

      'require-await': 'off',
    },
  },

  {
    files: ['src/**/*.{js,vue}'],

    languageOptions: {
      ecmaVersion: 'latest',

      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  prettier,
];
