# 初回トークン取得スクリプト - 技術仕様

## 概要

Docker コンテナ内で実行される対話的な OAuth トークン取得スクリプトです。同一のコンテナイメージで「セットアップモード」と「サーバーモード」を切り替えることができます。

## ファイル構成

```
src/scripts/setup-token.ts   # メインスクリプト
package.json                  # npm run setup コマンド定義
Dockerfile                    # CMD でモード切り替え対応
```

## 実行モード

### セットアップモード（対話的）

```sh
docker run -it --rm \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

- `-it`: 対話モード（ブラウザ認証に必要）
- `npm run setup`: セットアップスクリプト実行

### サーバーモード（stdio）

```sh
docker run -i --rm \
  -v $(pwd)/credentials.json:/app/credentials.json:ro \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp
```

- `-i`: 標準入力のみ（MCP プロトコル用）
- 引数なし: デフォルトで `node dist/index.js` 実行

## スクリプトの処理フロー

```
┌─────────────────────────────────────────┐
│ 1. credentials.json の検証              │
│    - ファイル存在確認                    │
│    - JSON フォーマット確認               │
│    - installed/web プロパティ確認        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. 既存トークンのチェック                │
│    - token.json の存在確認               │
│    - 既存トークンがあれば警告表示        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. OAuth 認証フロー実行                  │
│    - @google-cloud/local-auth 使用      │
│    - ブラウザが自動起動                  │
│    - ユーザーが Google で認可            │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. トークンの保存                        │
│    - token.json に Credentials 保存     │
│    - access_token, refresh_token 含む   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 5. トークンの疎通テスト                  │
│    - Google Slides API でテスト          │
│    - プレゼンテーション作成              │
│    - URL を表示                          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ ✅ セットアップ完了                      │
└─────────────────────────────────────────┘
```

## 主要な関数

### `validateCredentials()`

```typescript
const validateCredentials = async (): Promise<void>
```

- `credentials.json` の存在確認
- JSON パース
- `installed` または `web` プロパティの検証
- エラー時は明確なメッセージを表示

### `checkExistingToken()`

```typescript
const checkExistingToken = async (): Promise<boolean>
```

- `token.json` の存在確認
- `access_token` または `refresh_token` の有無確認
- 既存トークンがあれば `true` を返す

### `authenticateUser()`

```typescript
const authenticateUser = async (): Promise<Credentials>
```

- `@google-cloud/local-auth` を使用
- OAuth フローを実行
- ブラウザで認証
- `Credentials` オブジェクトを返す

### `saveToken()`

```typescript
const saveToken = async (credentials: Credentials): Promise<void>
```

- `token.json` に JSON 形式で保存
- フォーマット: `JSON.stringify(credentials, null, 2)`

### `testToken()`

```typescript
const testToken = async (credentials: Credentials): Promise<void>
```

- Google Slides API でテスト
- プレゼンテーション作成
- 成功時は URL 表示
- 失敗時は警告（トークンは保存済み）

## スコープ設定

```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];
```

**選定理由：**

- `presentations`: Google Slides 操作
- `drive.file`: MCP で作成したファイルのみアクセス
- `spreadsheets`: Google Sheets 操作

**セキュリティ考慮：**

- `drive.readonly` や `drive` は使用しない（最小権限の原則）
- 必要なスコープのみを要求

## エラーハンドリング

### credentials.json が見つからない

```
❌ credentials.json が見つかりません: /app/credentials.json
   Google Cloud Console から OAuth 2.0 クライアント ID を作成し、
   credentials.json としてマウントしてください。
```

### 認証中のエラー

```
❌ 認証中にエラーが発生しました:
   [具体的なエラーメッセージ]
```

### トークン保存の失敗

```
❌ トークンの保存に失敗しました:
   [具体的なエラーメッセージ]
```

### API 疎通テストの失敗

```
⚠️  トークンのテスト中にエラーが発生しました:
   [具体的なエラーメッセージ]
   トークンは保存されましたが、API へのアクセスに問題がある可能性があります。
```

## Dockerfile の変更点

### 変更前（ENTRYPOINT）

```dockerfile
ENTRYPOINT ["node", "dist/index.js"]
```

- 固定されたコマンドのみ実行可能
- カスタムコマンドを渡せない

### 変更後（CMD）

```dockerfile
CMD ["node", "dist/index.js"]
```

- デフォルトは MCP サーバー起動
- `docker run ... npm run setup` で上書き可能
- `docker run ... /bin/sh` でシェル起動も可能

## セキュリティ考慮事項

### 機密情報の取り扱い

- **credentials.json**: OAuth クライアント ID（準機密）
  - 読み取り専用でマウント（`:ro`）
  - 公開リポジトリにコミットしない

- **token.json**: ユーザー固有のアクセストークン（機密）
  - 読み書き可能でマウント（自動更新に必要）
  - 絶対に共有しない
  - 他のユーザーに見せない

### Docker のセキュリティ

- コンテナは `--rm` で自動削除
- 永続化が必要なのは Volume マウントしたファイルのみ
- コンテナ内にトークンは残らない

## 運用上の利点

### ユーザー体験

1. **シンプルな操作**
   - コマンド 1 つで完結
   - ブラウザが自動で開く
   - 成功・失敗が明確に表示

2. **視覚的なフィードバック**
   - 絵文字とボックス装飾
   - 進行状況が分かりやすい
   - エラー時のガイダンス

3. **疎通テスト付き**
   - セットアップ直後に動作確認
   - 問題の早期発見

### 管理者の利点

1. **単一イメージで完結**
   - 別途セットアップツールが不要
   - 配布物が最小限

2. **標準化された手順**
   - 全ユーザーが同じ手順
   - サポート対応が容易

3. **トラブルシューティング容易**
   - 明確なエラーメッセージ
   - ログ出力が標準エラーに統一

## 今後の拡張可能性

### オプション機能

- スコープのカスタマイズ
- 複数アカウント対応
- トークンのバリデーション強化
- 自動バックアップ機能

### 環境変数サポート

```typescript
const SCOPES = process.env.GOOGLE_SCOPES?.split(',') ?? DEFAULT_SCOPES;
```

### 非対話モード

CI/CD 環境向けに、あらかじめ取得したトークンをインポートする機能。

```sh
docker run --rm \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -e GOOGLE_TOKEN="base64_encoded_token" \
  google-workspace-mcp npm run setup -- --import
```

## 関連ドキュメント

- [README.md](../README.md) - 基本的な使い方
- [docker-deployment.md](docker-deployment.md) - 社内配布ガイド
- [how-to-create-credentials.md](how-to-create-credentials.md) - OAuth クライアント作成手順

---

**作成日**: 2026年1月5日
**バージョン**: 1.0.0
