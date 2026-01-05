import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importXPlugin from 'eslint-plugin-import-x'; // 代替: 高速版
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. グローバル無視設定
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/cdk.out/**',
      '**/*.js.map',
      'auth-test.ts',
    ],
  },

  // 2. 基本セットアップ
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked, // recommendedより厳しいstrictを推奨
  ...tseslint.configs.stylisticTypeChecked,

  // 3. 共通の言語オプション
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025, // 最新のJS機能を許可
      },
      parserOptions: {
        projectService: true, // TS v8以降の推奨：tsconfigの自動解決
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 4. TypeScript 詳細設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-exports': 'error', // 型エクスポートの強制
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // 5. React (webパッケージ)
  {
    files: ['packages/web/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': fixupPluginRules(reactHooksPlugin), // Flat Config互換性対応
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // 6. Import/Export (import-xを使用)
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

  // 7. 型チェック不要な設定ファイルへの適用除外
  {
    files: ['**/*.config.{js,mjs,ts}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 8. 最後にPrettier
  prettierConfig,
);
