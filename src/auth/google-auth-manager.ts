import * as fs from 'fs/promises';
import path from 'path';
import type { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

interface CredentialsConfig {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
}

interface CredentialsFile {
  installed?: CredentialsConfig;
  web?: CredentialsConfig;
}

export class GoogleAuthManager {
  private auth: OAuth2Client | null = null;
  private readonly credentialsPath: string;
  private readonly tokenPath: string;

  constructor() {
    // Dockerコンテナ内のパスを想定。環境変数で変更可能にするとより柔軟です。
    this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH ?? path.join(process.cwd(), 'credentials.json');
    this.tokenPath = process.env.GOOGLE_TOKEN_PATH ?? path.join(process.cwd(), 'token.json');
  }

  /**
   * 認証済みクライアントを取得する
   */
  async getAuth(): Promise<OAuth2Client> {
    // すでに初期化済みの場合は再利用（簡易シングルトン）
    if (this.auth) {
      return this.auth;
    }

    try {
      // credentials.json の読み込み
      const keyContent = await fs.readFile(this.credentialsPath, 'utf8');
      const keys = JSON.parse(keyContent) as CredentialsFile;
      const config = keys.installed ?? keys.web;

      if (!config) {
        throw new Error('Invalid credentials.json format. "installed" or "web" property is required.');
      }

      // クライアントの初期化
      const auth = new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        config.redirect_uris?.[0] ?? 'http://localhost',
      );

      // token.json の読み込み
      try {
        const tokenContent = await fs.readFile(this.tokenPath, 'utf8');
        const tokens = JSON.parse(tokenContent) as Credentials;
        auth.setCredentials(tokens);

        // トークンの有効期限が切れている場合に自動リフレッシュを試みる設定
        auth.on('tokens', (newTokens) => {
          console.error('🔄 Access token refreshed. Updating token.json...');
          void fs.writeFile(this.tokenPath, JSON.stringify({ ...tokens, ...newTokens }));
        });
      } catch {
        throw new Error(
          `Authentication token not found at ${this.tokenPath}.\n` +
            'Please run the local auth script first and mount the resulting token.json to the Docker container.',
        );
      }

      this.auth = auth;
      return auth;
    } catch (error) {
      console.error('❌ Failed to initialize Google Auth:', error);
      throw error;
    }
  }
}
