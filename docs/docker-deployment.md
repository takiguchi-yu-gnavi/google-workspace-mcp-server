# Docker デプロイメントガイド

このガイドでは、開発者が Google Workspace MCP サーバーを Docker コンテナとしてレジストリに登録する方法を説明します。

## 前提条件

- Docker がインストールされていること
- AWS アカウントへのアクセス権限があること
- シェル環境: `bash` または `zsh`（macOS のデフォルトシェル）

---

## 手順

### 1. AWS 設定（環境変数の設定）

コマンドをコピペで実行できるように、AWS 関連の情報を環境変数として設定します。

```sh
# AWS 設定を環境変数に設定（実際の値に置き換えてください）
export AWS_REGION="ap-northeast-1"    # 例: ap-northeast-1
export AWS_PROFILE="your-profile"     # 例: default
export AWS_ACCOUNT_ID="123456789012"  # 例: 123456789012
```

> **注**: これらの値はターミナルセッション中のみ有効です。永続化したい場合は `~/.zshrc` や `~/.bashrc` に追加してください。

### 2. Amazon ECR リポジトリの作成（初回のみ）

```sh
aws ecr create-repository --repository-name google-workspace-mcp --profile $AWS_PROFILE
```

### 3. Docker イメージをビルド

```sh
docker build --no-cache -t google-workspace-mcp .
```

### 4. Docker イメージをプッシュ

```sh
# ECR にログイン (Login Succeeded が表示されれば成功)
aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Docker イメージにタグを付けてプッシュ
docker tag google-workspace-mcp:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/google-workspace-mcp:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/google-workspace-mcp:latest
```

---

## 確認

イメージが正常にプッシュされたか確認するには、以下のコマンドを実行してください：

```sh
aws ecr describe-images --repository-name google-workspace-mcp --profile $AWS_PROFILE --region $AWS_REGION
```
