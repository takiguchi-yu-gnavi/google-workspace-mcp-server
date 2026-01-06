import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importXPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // グローバル無視設定
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/cdk.out/**',
      '**/*.js.map',
    ],
  },

  // 基本セットアップ（js.configs.recommendedは単一オブジェクト）
  js.configs.recommended,

  // 共通の言語オプション
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
      },
    },
  },

  // TypeScript - 構文チェック のみ（型チェック無し）
  ...tseslint.configs.recommended,

  // TypeScript ファイル固有の設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Import/Export
  {
    plugins: {
      'import-x': importXPlugin,
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'object'],
          pathGroups: [
            {
              pattern: '{.,..}/**/*.css',
              group: 'object',
              position: 'after',
            },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never',
          distinctGroup: false,
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // 設定ファイルの除外
  {
    files: ['**/*.config.{js,mjs,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Prettier
  prettierConfig,
];
