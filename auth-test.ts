import * as fs from 'fs/promises';
import * as path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.file'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

interface CredentialsConfig {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

interface CredentialsFile {
  installed?: CredentialsConfig;
  web?: CredentialsConfig;
}

const getAuthenticatedClient = async () => {
  // 1. credentials.json からクライアント情報を読み込む
  const keyContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(keyContent) as CredentialsFile;
  const config = keys.installed ?? keys.web;

  if (!config) {
    throw new Error('Invalid credentials.json format');
  }

  // 2. OAuth2 クライアントを作成
  const auth = new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    config.redirect_uris[0] ?? 'http://localhost',
  );

  // 3. token.json があれば読み込んでセット
  try {
    const tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
    const tokens = JSON.parse(tokenContent) as Credentials;
    auth.setCredentials(tokens);
    console.error('✅ 保存済みのトークンを読み込みました');
  } catch {
    console.error('🔑 トークンがないため、新規認証を開始します...');
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    await fs.writeFile(TOKEN_PATH, JSON.stringify(client.credentials));
    auth.setCredentials(client.credentials);
    console.error('✅ 新しいトークンを保存しました');
  }

  return auth;
};

/**
 * Google Slides API を使って新しいプレゼンテーションを作成するサンプル（疎通確認用）
 */
const main = async () => {
  try {
    const auth = await getAuthenticatedClient();

    // クライアントを確実に auth オプションで初期化
    const slides = google.slides({ version: 'v1', auth });

    console.error('🚀 スライド作成リクエストを送信中...');
    const response = await slides.presentations.create({
      requestBody: {
        title: `MCP Test Slide - ${new Date().toLocaleString()}`,
      },
    });

    console.error('--- 🎉 成功しました！ ---');
    console.error(`作成されたスライド ID: ${response.data.presentationId ?? 'unknown'}`);
    console.error(`URL: https://docs.google.com/presentation/d/${response.data.presentationId ?? 'unknown'}/edit`);
  } catch (error) {
    console.error('❌ APIエラー発生:');
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response: { data: unknown } };
      console.error(JSON.stringify(errorWithResponse.response.data, null, 2));
    } else {
      console.error(error);
    }
  }
};

void main();
