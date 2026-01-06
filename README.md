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

### 簡単な流れ

1. Google Cloud で OAuth 認証情報を作成（初回のみ）
2. `credentials.json` をダウンロード（初回のみ）
3. トークンを取得（初回のみ）
4. GitHub Copilot で使用開始

詳細なセットアップ手順は **[docs/setup.md](docs/setup.md)** を参照してください。

## プロジェクト構成

```
src/
├── index.ts                # MCP サーバー起動
├── auth/                   # OAuth 認証管理
├── manager/                # サービス統合管理
└── tools/                  # Google Workspace ツール実装
    ├── sheets/
    ├── slides/
    └── drive/
```

## クラス設計

このプロジェクトは複数のデザインパターンを組み合わせて、拡張性と保守性の高いアーキテクチャを実現しています。

### 採用しているデザインパターン

- **ストラテジーパターン**: 各 Google Workspace サービス（Sheets, Slides, Drive）を独立した戦略として実装
- **コマンドパターン**: 各ツールの操作を独立したコマンドクラスとしてカプセル化
- **ファクトリーパターン**: `ServiceManager` がサービスを統合管理し、適切なサービスに処理を振り分け
- **テンプレートメソッドパターン**: `BaseCommandService` が共通処理を提供し、サブクラスで具体的なコマンド登録を実装

```mermaid
classDiagram
    %% 認証管理
    class GoogleAuthManager {
        -auth: OAuth2Client
        -credentialsPath: string
        -tokenPath: string
        +getAuth() Promise~OAuth2Client~
    }

    %% コアインターフェース
    class Command {
        <<interface>>
        +getToolDefinition() ToolDefinition
        +execute(args) Promise~CallToolResult~
    }

    class WorkspaceService {
        <<interface>>
        +getTools() ToolDefinition[]
        +execute(toolName, args) Promise~CallToolResult~
    }

    %% 基底クラスとマネージャー
    class BaseCommandService {
        <<abstract>>
        #auth: OAuth2Client
        #commands: Map~string, Command~
        #registerCommands()* void
        +getTools() ToolDefinition[]
        +execute(toolName, args) Promise~CallToolResult~
    }

    class ServiceManager {
        -services: Map~string, WorkspaceService~
        +registerService(service) void
        +getTools() ToolDefinition[]
        +handleToolCall(name, args) Promise~CallToolResult~
    }

    %% 具体例（代表）
    class SheetsService {
        +registerCommands() void
    }

    class ListSpreadsheetsCommand {
        -auth: OAuth2Client
        +getToolDefinition() ToolDefinition
        +execute(args) Promise~CallToolResult~
    }

    %% 関係性
    GoogleAuthManager ..> BaseCommandService : provides OAuth2Client
    WorkspaceService <|.. BaseCommandService : implements
    BaseCommandService <|-- SheetsService : extends
    ServiceManager o-- WorkspaceService : manages
    Command <|.. ListSpreadsheetsCommand : implements
    BaseCommandService o-- Command : uses
    SheetsService ..> ListSpreadsheetsCommand : creates

    note for GoogleAuthManager "シングルトン的な\n認証管理"
    note for ServiceManager "ファクトリーパターン"
    note for BaseCommandService "テンプレートメソッド"
    note for SheetsService "ストラテジー"
    note for ListSpreadsheetsCommand "コマンド"
```

> **Note**: 図は代表的なクラスのみを表示しています。実際には Slides/Drive サービスや各種コマンドクラスも同様のパターンで実装されています。

## 参考にしたプロジェクト

- [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp)
