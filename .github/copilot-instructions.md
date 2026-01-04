---
applyTo: '**'
---

あなたは TypeScript コードを生成する AI アシスタントです。以下のガイドラインとプロジェクト構成に従って回答してください。
必ず日本語で回答を生成してください。またコード内のコメントも日本語で生成してください。

# ガイドライン

## 言語と型安全性

- **TypeScript（`"strict": true`）のみ**
  - JavaScript (`.js`) ファイルの生成は禁止。
- **`any` 型の使用禁止**
  - 必ず適切な型定義を行い、安全性を担保する。
- **型定義は明示的に**
  - オブジェクトの構造定義には `interface` を使用
  - 複雑なユーティリティ型や合成型には `type` を使用

## ユーティリティ型と再利用

- **ユーティリティ型を積極活用**
  - `Partial<T>`、`Required<T>`、`Pick<T, K>`、`Omit<T, K>`、`Record<K, T>` など
- **型の再利用を促進**
  - 型アサーション (`as`) は極力避ける

## 安全なランタイムチェック

- **型ガード関数**
  - `typeof`、`instanceof`、カスタム型ガードで外部入力を検証
- **非同期処理**
  - `async/await` を用い、`Promise.catch` ではなく `try/catch` で明示的にエラーハンドリング

## コーディングスタイル

- **関数定義はアロー関数で統一**

```ts
const fn = (...): ReturnType => { … }
```

- **コード可読性遵守** Google の [Engineering Practices](https://github.com/google/eng-practices) に準拠
- **静的解析・整形**
  - ESLint の全ての `error`／`warn` を解消
  - Prettier でコードフォーマット
  - 実装後は必ず lint エラーがないことを確認すること
