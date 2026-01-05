import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importXPlugin from 'eslint-plugin-import-x'; // 代替: 高速版
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

  // 基本セットアップ
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked, // recommendedより厳しいstrictを推奨
  ...tseslint.configs.stylisticTypeChecked,

  // 共通の言語オプション
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // TypeScript 詳細設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Import/Export (import-xを使用)
  {
    plugins: {
      'import-x': importXPlugin,
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js組み込みモジュール
            'external', // node_modulesの外部ライブラリ
            'internal', // 内部エイリアス（例: @/）
            ['parent', 'sibling'], // 相対パス（../や./）
            'index', // ./index
            'object', // import log = console.log のようなオブジェクトimport
          ],
          pathGroups: [
            {
              pattern: '{.,..}/**/*.css',
              group: 'object',
              position: 'after',
            },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never',
          distinctGroup: false, // type importを通常のimportと同じグループ内で扱う
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // 型チェック不要な設定ファイルへの適用除外
  {
    files: ['**/*.config.{js,mjs,ts}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 最後にPrettier
  prettierConfig,
];
