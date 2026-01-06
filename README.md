# Google Workspace MCP Server

Google Workspace MCP Server は、GitHub Copilot などの AI アシスタントから Google Workspace サービス（Slides、Sheets、Drive）を操作できるようにする MCP サーバーです。

## 主な機能

### 📊 Google Sheets

- **sheets_list_spreadsheets** - スプレッドシート一覧を取得
- **sheets_get_spreadsheet_info** - スプレッドシートの詳細情報（シート一覧、プロパティ）を取得
- **sheets_read_sheet_values** - セル範囲のデータを読み取り

### 🖼️ Google Slides

- **slides_create_presentation** - プレゼンテーションを作成
- **slides_get_presentation** - プレゼンテーションの内容を取得
- **slides_list_presentations** - プレゼンテーション一覧を取得
- **slides_get_page** - 特定スライドの詳細情報を取得

### 📁 Google Drive

- **drive_search_files** - ファイルを検索（クエリ構文対応）
- **drive_list_items** - フォルダ内のファイル一覧を取得

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
    }      # MCP サーバー起動
├── auth/
│   └── google-auth-manager.ts  # OAuth 認証管理
├── manager/
│   └── service-manager.ts      # サービス統合管理
├── services/
│   ├── base/
│   │   ├── command.interface.ts
│   │   └── service.interface.ts
│   ├── sheets/
│   │   ├── sheets.service.ts
│   │   └── commands/
│   │       ├── list-spreadsheets.command.ts
│   │       ├── get-spreadsheet-info.command.ts
│   │       └── read-sheet-values.command.ts
│   ├── slides/
│   │   ├── slides.service.ts
│   │   └── commands/
│   │       ├── create-presentation.command.ts
│   │       ├── get-presentation.command.ts
│   │       ├── list-presentations.command.ts
│   │       └── get-page.command.ts
│   └── drive/
│       ├── drive.service.ts
│       └── commands/
│           ├── search-drive-files.command.ts
│           └── list-drive-items.command.ts
└── scripts/
    └── oauth-server.ts         # トークン取得スクリプト
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

## 参考プロジェクト

- [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp)
