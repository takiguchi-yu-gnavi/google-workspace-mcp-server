# Google Workspace MCP Server

Google Workspace MCP Server は、GitHub Copilot などの AI アシスタントから Google Workspace サービス（Slides、Drive、Sheets）を操作できるようにする MCP サーバーです。

## 主な機能

- **Google Slides**: プレゼンテーションの作成・編集
- **Google Drive**: ファイル管理
- **Google Sheets**: スプレッドシート操作

## クイックスタート

詳細なセットアップ手順は **[docs/setup.md](docs/setup.md)** を参照してください。

### 簡単な流れ

1. Google Cloud で OAuth 認証情報を作成
2. `credentials.json` をダウンロード
3. トークンを取得（初回のみ）
4. GitHub Copilot で使用開始

```sh
# 作業ディレクトリを作成
mkdir -p ~/google-workspace-mcp
cd ~/google-workspace-mcp

# credentials.json を配置して token.json を作成
touch token.json

# トークン取得（初回のみ）
docker run -it --rm \
  -p 8000:8000 \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

## GitHub Copilot との連携

`.vscode/settings.json`:

```json
{
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

## 開発者向け

### プロジェクト構造

```
src/
├── index.ts              # MCP サーバー起動
├── auth/
│   └── google-auth-manager.ts
├── manager/
│   └── service-manager.ts
├── services/
│   ├── base.service.ts
│   └── slides.service.ts
└── scripts/
    └── oauth-server.ts   # トークン取得スクリプト
```

### 開発コマンド

```sh
npm run type-check
npm run lint
npm run format
npm run build
```

## ライセンス

MIT

## 参考ドキュメント

- [docs/setup.md](docs/setup.md) - 詳細なセットアップガイド
- [docs/how-to-create-credentials.md](docs/how-to-create-credentials.md) - Google Cloud 認証情報の作成方法
- [docs/docker-deployment.md](docs/docker-deployment.md) - 社内配布向けガイド
