# --- Build Stage ---
FROM node:24-slim AS builder
WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピーしてビルド
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:24-slim
WORKDIR /app

# 環境変数のデフォルト設定（必要に応じて上書き可能）
ENV GOOGLE_CREDENTIALS_PATH=/app/credentials.json
ENV GOOGLE_TOKEN_PATH=/app/token.json

# ビルド成果物と本番用依存関係のみをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production

# MCPサーバーは標準入出力を使用するため、起動コマンドを直接指定
ENTRYPOINT ["node", "dist/index.js"]
