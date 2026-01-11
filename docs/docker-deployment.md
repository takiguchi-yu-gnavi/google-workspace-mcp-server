# Docker デプロイメントガイド

このガイドでは、開発者が Google Workspace MCP サーバーを Docker コンテナとしてレジストリに登録する方法を説明します。

## 手順

### Amazon ECR リポジトリの作成（初回のみ）

```sh
aws ecr create-repository --repository-name google-workspace-mcp --profile YOUR_AWS_PROFILE
```

### Docker イメージをビルド

```sh
docker build --no-cache -t google-workspace-mcp .
```

### Docker イメージをプッシュ

```sh
# ECR にログイン (Login Succeeded が表示されれば成功)
aws ecr get-login-password --region YOUR_AWS_REGION--profile YOUR_AWS_PROFILE | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com
# Docker イメージにタグを付けてプッシュ
docker tag google-workspace-mcp:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com/google-workspace-mcp:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com/google-workspace-mcp:latest
```
