# Google Workspace MCP Server - セットアップガイド

Google Workspace MCP Server 利用者が Docker コンテナとしてサーバーを起動し、GitHub Copilot から Google Workspace サービスを操作できるようにするためのセットアップ手順を説明します。

## 前提条件

- Docker がインストールされていること
- MacOS 環境

## セットアップ手順（初回のみ）

### OAuth 認証情報の準備

[how-to-create-credentials.md](how-to-create-credentials.md) を参照してください。

### 作業ディレクトリの準備

```sh
# 任意の作業ディレクトリを作成
mkdir -p ~/google-workspace-mcp
cd ~/google-workspace-mcp

# ダウンロードした credentials.json をこのディレクトリに配置
# 空の token.json ファイルを作成
touch token.json
```

### Docker イメージの取得

```sh
# ECR にログイン (Login Succeeded が表示されれば成功)
aws ecr get-login-password --region YOUR_AWS_REGION --profile YOUR_AWS_PROFILE | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com
# Docker イメージを取得
docker pull YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com/google-workspace-mcp:latest
```

### トークンの取得

```sh
cd ~/google-workspace-mcp

docker run -it --rm \
  -p 8000:8000 \
  -v $(pwd)/credentials.json:/app/credentials.json \
  -v $(pwd)/token.json:/app/token.json \
  google-workspace-mcp npm run setup
```

コンソールに表示された URL を開き、Google アカウントで認証してください。

## GitHub Copilot との連携

VS Code の設定ファイル `.vscode/mcp.json` を編集：

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
        "/absolute/path/to/google-workspace-mcp/credentials.json:/app/credentials.json",
        "-v",
        "/absolute/path/to/google-workspace-mcp/token.json:/app/token.json",
        "YOUR_AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/google-workspace-mcp:latest"
      ]
    }
  }
}
```

**重要**: `/absolute/path/to/` の部分を実際の絶対パスに置き換えてください。

以上でセットアップは完了です。GitHub Copilot から Google Workspace の操作が可能になります。
