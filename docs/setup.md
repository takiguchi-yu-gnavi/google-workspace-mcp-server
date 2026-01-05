# Google Workspace MCP Server - セットアップガイド

このガイドに従って、Google Workspace MCP Server をセットアップします。

## 前提条件

- Docker がインストールされていること
- Google Cloud プロジェクトの OAuth 2.0 認証情報（`credentials.json`）

## セットアップ手順

### 1. OAuth 認証情報の準備

Google Cloud Console で OAuth 2.0 クライアント ID を作成し、`credentials.json` をダウンロードします。

**必須設定：**

- **アプリケーションタイプ**: デスクトップアプリ
- **リダイレクト URI**: `http://localhost:8000/oauth2callback`

詳細な手順は [how-to-create-credentials.md](how-to-create-credentials.md) を参照してください。

### 2. 作業ディレクトリの準備

```sh
# 任意の作業ディレクトリを作成
mkdir -p ~/google-workspace-mcp
cd ~/google-workspace-mcp

# ダウンロードした credentials.json をこのディレクトリに配置
# 空の token.json ファイルを作成
touch token.json
```

### 3. トークンの取得（初回のみ）

```sh
docker run -it --rm \
  -p 8000:8000 \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

ブラウザで表示された URL を開き、Google アカウントで認証してください。

### 4. MCP サーバーの起動確認

```sh
docker run -i --rm \
  -v $(pwd)/credentials.json:/app/credentials.json:ro \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp
```

正常に起動すれば、セットアップ完了です！

## GitHub Copilot との連携

VS Code の設定ファイル `.vscode/settings.json` を編集：

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "Use Google Workspace MCP Server for Google Slides, Drive, and Sheets operations"
    }
  ],
  "mcp.servers": {
    "google-workspace": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "/absolute/path/to/credentials.json:/app/credentials.json:ro",
        "-v",
        "/absolute/path/to/token.json:/app/token.json",
        "google-workspace-mcp"
      ]
    }
  }
}
```

**重要**: `/absolute/path/to/` の部分を実際の絶対パスに置き換えてください。

## トラブルシューティング

### ポート 8000 が使用中

```sh
# 使用中のプロセスを確認
lsof -i :8000

# プロセスを終了してから再実行
```

### 認証エラー

- Google Cloud Console でリダイレクト URI が `http://localhost:8000/oauth2callback` に設定されているか確認
- `credentials.json` が正しいプロジェクトのものか確認

### トークンが無効

```sh
# token.json を削除して再取得
rm token.json
touch token.json

# セットアップを再実行
docker run -it --rm \
  -p 8000:8000 \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

## サポートされている API

- Google Slides API
- Google Drive API
- Google Sheets API

以上でセットアップは完了です。GitHub Copilot から Google Workspace の操作が可能になります。
