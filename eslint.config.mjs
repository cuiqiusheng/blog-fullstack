import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/generated/**',
    '**/graphql/__generated__/**',
    'apps/blog/public/**',
    'apps/server/prisma/**',
    'eslint.config.mjs',
    'commitlint.config.js',
    '.lintstagedrc.js',
  ]),

  // All TS files: base JS + TypeScript recommended + shared rules
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Client: React plugins + browser globals
  {
    files: ['apps/blog/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Server: Node.js globals
  {
    files: ['apps/server/**/*.{ts,js,cjs,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // CJS files: Node.js globals + allow require()
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Prettier compat (disables conflicting formatting rules)
  prettier,

  // Single quotes enforcement (after prettier to re-enable)
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    },
  },
]);
