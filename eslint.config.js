import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules', '.next', 'dist', 'build', 'public']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        process: 'readonly',
        NodeJS: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }]
    }
  }
];


