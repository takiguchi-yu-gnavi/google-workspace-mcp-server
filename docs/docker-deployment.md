# Docker デプロイメントガイド

このガイドでは、Google Workspace MCP サーバーを Docker コンテナとして社内配布・運用する手順を説明します。

## 🎯 デプロイメント概要

### アーキテクチャ

```
┌─────────────────┐
│ Claude Desktop  │
│  / MCP Client   │
└────────┬────────┘
         │ stdio
┌────────▼────────────────────────┐
│ Docker Container                │
│ ┌─────────────────────────────┐ │
│ │ google-workspace-mcp-server │ │
│ └─────────────────────────────┘ │
│                                 │
│ Volume Mounts:                  │
│  • credentials.json (読取専用) │
│  • token.json (読書可能)        │
└────────┬────────────────────────┘
         │ HTTPS
         │
┌────────▼─────────┐
│ Google Workspace │
│      APIs        │
└──────────────────┘
```

## 📋 配布ファイル

社内メンバーに配布するファイル：

1. **Docker イメージ** (`google-workspace-mcp.tar` または Registry 経由)
2. **credentials.json** (共通の OAuth 2.0 クライアント ID)
3. **セットアップ手順書** (このドキュメント)

## 🚀 初回セットアップ（エンドユーザー向け）

### ステップ 1: Docker イメージの取得

**方法 A: tar ファイルから読み込み**

```sh
docker load -i google-workspace-mcp.tar
```

**方法 B: Registry からプル**

```sh
docker pull your-registry.com/google-workspace-mcp:latest
docker tag your-registry.com/google-workspace-mcp:latest google-workspace-mcp
```

### ステップ 2: 認証情報の配置

作業ディレクトリを作成し、`credentials.json` を配置します。

```sh
# 作業ディレクトリを作成
mkdir -p ~/google-workspace-mcp
cd ~/google-workspace-mcp

# credentials.json を配置（IT 部門から提供されたファイル）
# 例: メールで送られてきたファイルをコピー
cp ~/Downloads/credentials.json .
```

### ステップ 3: 初回トークン取得（対話的セットアップ）

```sh
docker run -it --rm \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

**画面の流れ：**

```
╔═══════════════════════════════════════════════════════════╗
║   Google Workspace MCP Server - 初回トークンセットアップ   ║
╚═══════════════════════════════════════════════════════════╝

✅ credentials.json の検証に成功しました。

🔐 Google OAuth 認証を開始します...
ブラウザが自動的に開きます。Google アカウントでログインしてください。

✅ 認証に成功しました！

💾 トークンを保存しました: /app/token.json

🧪 トークンの有効性をテストしています...
✅ トークンが有効です！Google Slides API との疎通に成功しました。
   テストスライド: https://docs.google.com/presentation/d/...

╔═══════════════════════════════════════════════════════════╗
║              🎉 セットアップが完了しました！               ║
╚═══════════════════════════════════════════════════════════╝

次のステップ:
  1. このコンテナを終了します
  2. MCP サーバーモードでコンテナを起動してください
```

### ステップ 4: MCP クライアント設定

#### Claude Desktop の場合

`~/.config/claude/mcp.json` (macOS の場合) を編集：

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "/Users/YOUR_USERNAME/google-workspace-mcp/credentials.json:/app/credentials.json:ro",
        "-v",
        "/Users/YOUR_USERNAME/google-workspace-mcp/token.json:/app/token.json",
        "google-workspace-mcp"
      ]
    }
  }
}
```

**⚠️ 注意：**

- `YOUR_USERNAME` を実際のユーザー名に置き換えてください
- パスは絶対パスで指定してください

#### VS Code の場合

`.vscode/mcp.json` を作成：

```json
{
  "servers": {
    "google-workspace": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${workspaceFolder}/google-workspace-mcp/credentials.json:/app/credentials.json:ro",
        "-v",
        "${workspaceFolder}/google-workspace-mcp/token.json:/app/token.json",
        "google-workspace-mcp"
      ]
    }
  }
}
```

### ステップ 5: 動作確認

Claude Desktop を再起動し、以下のようなプロンプトで動作確認：

```
Google Slides で「テストプレゼンテーション」というタイトルの新しいプレゼンテーションを作成してください。
```

成功すれば、プレゼンテーションの URL が返ってきます。

## 🔄 トークンの更新（自動）

`token.json` に含まれる `refresh_token` により、アクセストークンは自動的に更新されます。

- **有効期限**: アクセストークンは 1 時間
- **自動更新**: MCP サーバーが自動的に更新
- **手動対応不要**: 通常は何もする必要なし

## 🔧 トラブルシューティング

### トークンの再取得が必要な場合

以下のエラーが出た場合は再認証が必要です：

```
❌ Authentication token not found at /app/token.json.
```

**対処方法：**

```sh
cd ~/google-workspace-mcp

# 既存のトークンを削除
rm token.json

# セットアップを再実行
docker run -it --rm \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

### credentials.json が見つからない

```
❌ credentials.json が見つかりません
```

**対処方法：**

1. ファイルが正しいディレクトリにあるか確認
2. ファイル名が正確か確認（大文字小文字を含む）
3. IT 部門に再度ファイルを依頼

### Docker が起動しない

```
Cannot connect to the Docker daemon
```

**対処方法：**

1. Docker Desktop が起動しているか確認
2. Docker Desktop を再起動

### 権限エラー

```
permission denied while trying to connect to the Docker daemon
```

**対処方法：**

```sh
# Docker グループに追加（Linux の場合）
sudo usermod -aG docker $USER

# ログアウト・ログインして反映
```

## 🔐 セキュリティ考慮事項

### credentials.json の取り扱い

- **配布方法**: セキュアなチャネル（社内ポータル、暗号化メール等）
- **保管場所**: ホームディレクトリ配下（他ユーザーからアクセス不可の場所）
- **共有禁止**: 他の組織に credentials.json を共有しない

### token.json の取り扱い

- **個人専用**: token.json は各ユーザーが個別に取得
- **共有禁止**: 他のユーザーと token.json を共有しない
- **バックアップ**: 必要に応じてバックアップ（暗号化推奨）

### Docker イメージのセキュリティ

- **定期更新**: セキュリティパッチ適用のため定期的に更新
- **脆弱性スキャン**: `docker scan` コマンドで脆弱性チェック

```sh
docker scan google-workspace-mcp
```

## 📦 管理者向け: イメージ配布手順

### 方法 1: tar ファイルでの配布

```sh
# イメージをビルド
docker build -t google-workspace-mcp .

# tar ファイルにエクスポート
docker save google-workspace-mcp -o google-workspace-mcp.tar

# 圧縮（オプション）
gzip google-workspace-mcp.tar

# 配布
# → google-workspace-mcp.tar.gz を社内ポータルにアップロード
```

**エンドユーザー側での読み込み：**

```sh
gunzip google-workspace-mcp.tar.gz
docker load -i google-workspace-mcp.tar
```

### 方法 2: Private Registry での配布

```sh
# タグ付け
docker tag google-workspace-mcp your-registry.com/google-workspace-mcp:1.0.0
docker tag google-workspace-mcp your-registry.com/google-workspace-mcp:latest

# プッシュ
docker push your-registry.com/google-workspace-mcp:1.0.0
docker push your-registry.com/google-workspace-mcp:latest
```

**エンドユーザー側でのプル：**

```sh
docker pull your-registry.com/google-workspace-mcp:latest
docker tag your-registry.com/google-workspace-mcp:latest google-workspace-mcp
```

## 📊 運用監視

### ログの確認

```sh
# コンテナのログを表示（デバッグ用）
docker run -i --rm \
  -v $(pwd)/credentials.json:/app/credentials.json:ro \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp 2>&1 | tee mcp-server.log
```

### トークンの有効期限確認

```sh
# token.json の内容を確認
cat token.json | jq .
```

**expiry_date** フィールドで有効期限が確認できます。

## 🔄 アップデート手順

新しいバージョンがリリースされた場合：

```sh
# 1. 新しいイメージを取得
docker load -i google-workspace-mcp-v2.tar
# または
docker pull your-registry.com/google-workspace-mcp:2.0.0
docker tag your-registry.com/google-workspace-mcp:2.0.0 google-workspace-mcp

# 2. 動作確認
docker run -i --rm \
  -v $(pwd)/credentials.json:/app/credentials.json:ro \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp

# 3. Claude Desktop を再起動
```

**注意**: 既存の `token.json` はそのまま使用可能です。再認証は不要です。

## 💬 サポート

問題が解決しない場合は、以下の情報を添えて IT サポートに連絡してください：

- エラーメッセージの全文
- `docker version` の出力
- OS とバージョン
- 実行したコマンド

---

**最終更新**: 2026年1月5日
