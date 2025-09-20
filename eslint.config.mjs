import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Security (mainly for backend)
  securityPlugin.configs.recommended,

  // Import plugin
  {
    plugins: { import: importPlugin },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off', // Handled by TypeScript
      'import/prefer-default-export': 'off',
    },
  },

  // TypeScript-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Prettier integration
  prettierPlugin,

  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', '.eslintrc.js', 'eslint.config.mjs'],
  },

  // Disable rules conflicting with Prettier (must be last)
  prettierConfig,
];
