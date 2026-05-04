/**
 * ESLint flat config — neostandard with semicolons + TypeScript.
 * Same shape as hds-lib-js for cross-repo consistency.
 */
const neostandard = require('neostandard');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'js/**',
      'dist/**',
      '**/*.cjs'
    ]
  },

  ...neostandard({ semi: true, noStyle: false }),

  ...tseslint.configs.recommended,

  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },

  {
    files: ['**/tests/**/*.js', '**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
];
