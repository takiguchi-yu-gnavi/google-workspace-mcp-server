import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs/promises';
import { google } from 'googleapis';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.file'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function getAuthenticatedClient() {
  // 1. credentials.json からクライアント情報を読み込む
  const keyContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(keyContent);
  const config = keys.installed || keys.web;

  // 2. OAuth2 クライアントを作成
  const auth = new google.auth.OAuth2(config.client_id, config.client_secret, config.redirect_uris[0]);

  // 3. token.json があれば読み込んでセット
  try {
    const tokenContent = await fs.readFile(TOKEN_PATH, 'utf8');
    const tokens = JSON.parse(tokenContent);
    auth.setCredentials(tokens);
    console.log('✅ 保存済みのトークンを読み込みました');
  } catch (err) {
    console.log('🔑 トークンがないため、新規認証を開始します...');
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    if (client.credentials) {
      await fs.writeFile(TOKEN_PATH, JSON.stringify(client.credentials));
      auth.setCredentials(client.credentials);
      console.log('✅ 新しいトークンを保存しました');
    }
  }

  return auth;
}

/**
 * Google Slides API を使って新しいプレゼンテーションを作成するサンプル（疎通確認用）
 */
async function main() {
  try {
    const auth = await getAuthenticatedClient();

    // クライアントを確実に auth オプションで初期化
    const slides = google.slides({ version: 'v1', auth });

    console.log('🚀 スライド作成リクエストを送信中...');
    const response = await slides.presentations.create({
      requestBody: {
        title: `MCP Test Slide - ${new Date().toLocaleString()}`,
      },
    });

    console.log('--- 🎉 成功しました！ ---');
    console.log(`作成されたスライド ID: ${response.data.presentationId}`);
    console.log(`URL: https://docs.google.com/presentation/d/${response.data.presentationId}/edit`);
  } catch (error: any) {
    console.error('❌ APIエラー発生:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
  }
}

main();
