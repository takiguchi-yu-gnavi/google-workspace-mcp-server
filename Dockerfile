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
# 自己署名証明書環境向け（本番環境では0に設定しないこと）
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# OAuth コールバック用ポートを公開
EXPOSE 8000

# ビルド成果物と本番用依存関係のみをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production

# デフォルトは MCP サーバー起動
# setup モード: docker run -it ... npm run setup
# サーバーモード: docker run -i ... (引数なし)
CMD ["node", "dist/index.js"]
