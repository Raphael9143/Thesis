import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsdoc from 'eslint-plugin-jsdoc';
import promise from 'eslint-plugin-promise';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  // include legacy/shareable configs converted to flat format via FlatCompat
  ...compat.extends('plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      prettier,
      promise,
      jsdoc,
    },
    // note: some shareable configs are included via compat.extends above
    extends: [js.configs.recommended],
    rules: {
      // ✅ Code style
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'arrow-spacing': ['warn', { before: true, after: true }],
      'object-shorthand': ['warn', 'always'],
      'prefer-arrow-callback': ['warn'],
      'no-console': 'off',

      // ✅ React
      'react/react-in-jsx-scope': 'off', // Không cần với React 17+
      'react/prop-types': 'off',

      // ✅ Prettier
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
          semi: true,
          printWidth: 100,
          trailingComma: 'es5',
          endOfLine: 'auto',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);
