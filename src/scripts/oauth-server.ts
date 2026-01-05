#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ミニ OAuth コールバックサーバー
 *
 * Docker コンテナ内で HTTP サーバーを起動し、ブラウザからの OAuth コールバックを受け取ります。
 * stdio モードでも認証フローを完結させるための軽量サーバーです。
 */

import * as fs from 'fs/promises';
import * as http from 'http';
import path from 'path';
import * as url from 'url';
import type { Credentials } from 'google-auth-library';
import { google } from 'googleapis';

const PORT = 8000;
const REDIRECT_URI = `http://localhost:${String(PORT)}/oauth2callback`;

// 環境変数からパスを取得
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH ?? path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH ?? path.join(process.cwd(), 'token.json');

// Google Workspace API のスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

interface CredentialsConfig {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
}

interface CredentialsFile {
  installed?: CredentialsConfig;
  web?: CredentialsConfig;
}

/**
 * credentials.json を読み込む
 */
const loadCredentials = async (): Promise<CredentialsConfig> => {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const parsed = JSON.parse(content) as CredentialsFile;
  const config = parsed.installed ?? parsed.web;

  if (!config) {
    throw new Error('credentials.json に "installed" または "web" プロパティが見つかりません。');
  }

  return config;
};

/**
 * OAuth2 認証 URL を生成
 */
const generateAuthUrl = async (): Promise<string> => {
  const config = await loadCredentials();

  const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  return authUrl;
};

/**
 * 認証コードをトークンに交換
 */
const exchangeCodeForToken = async (code: string): Promise<Credentials> => {
  const config = await loadCredentials();

  const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, REDIRECT_URI);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  return tokens;
};

/**
 * トークンを保存
 */
const saveToken = async (credentials: Credentials): Promise<void> => {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(credentials, null, 2));
  console.log(`✅ トークンを保存しました: ${TOKEN_PATH}`);
};

/**
 * トークンの有効性をテスト
 */
const testToken = async (credentials: Credentials): Promise<void> => {
  console.log('🧪 トークンの有効性をテストしています...');

  try {
    const config = await loadCredentials();
    const auth = new google.auth.OAuth2(config.client_id, config.client_secret, REDIRECT_URI);
    auth.setCredentials(credentials);

    const slides = google.slides({ version: 'v1', auth });
    const response = await slides.presentations.create({
      requestBody: {
        title: `MCP Setup Test - ${new Date().toLocaleString()}`,
      },
    });

    if (response.data.presentationId) {
      console.log('✅ トークンが有効です！Google Slides API との疎通に成功しました。');
      console.log(`   テストスライド: https://docs.google.com/presentation/d/${response.data.presentationId}/edit`);
    }
  } catch (error) {
    console.error('⚠️  トークンのテスト中にエラーが発生しました:');
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`   ${String(error.message)}`);
    }
    console.error('   トークンは保存されましたが、API へのアクセスに問題がある可能性があります。');
  }
};

/**
 * 成功ページの HTML
 */
const getSuccessHtml = (): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>認証成功</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 500px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      margin: 0 0 16px 0;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .success {
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      display: inline-block;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>認証に成功しました！</h1>
    <p>Google アカウントの認証が完了しました。<br>このウィンドウを閉じて、ターミナルに戻ってください。</p>
    <div class="success">セットアップ完了</div>
  </div>
</body>
</html>
`;
};

/**
 * エラーページの HTML
 */
const getErrorHtml = (errorMessage: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>認証エラー</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 500px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      margin: 0 0 16px 0;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
      font-family: monospace;
      font-size: 14px;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>認証に失敗しました</h1>
    <p>Google アカウントの認証中にエラーが発生しました。</p>
    <p>ターミナルに戻ってエラーメッセージを確認してください。</p>
    <div class="error-message">${errorMessage}</div>
  </div>
</body>
</html>
`;
};

/**
 * HTTP サーバーの起動
 */
const startServer = async (): Promise<void> => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Google Workspace MCP Server - 初回トークンセットアップ   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // credentials.json の検証
    console.log('🔍 credentials.json を検証しています...');
    await loadCredentials();
    console.log('✅ credentials.json の検証に成功しました。\n');

    // 認証 URL の生成
    const authUrl = await generateAuthUrl();

    // HTTP サーバーの起動
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url ?? '', true);

      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.query.code as string | undefined;
        const error = parsedUrl.query.error as string | undefined;

        if (error) {
          console.error(`\n❌ 認証エラー: ${error}`);
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(getErrorHtml(`認証が拒否されました: ${error}`));
          return;
        }

        if (!code) {
          console.error('\n❌ 認証コードが見つかりません');
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(getErrorHtml('認証コードが見つかりませんでした。'));
          return;
        }

        // 非同期処理を void でラップ
        void (async () => {
          try {
            console.log('\n🔄 認証コードをトークンに交換しています...');
            const credentials = await exchangeCodeForToken(code);

            console.log('💾 トークンを保存しています...');
            await saveToken(credentials);

            await testToken(credentials);

            console.log('\n╔═══════════════════════════════════════════════════════════╗');
            console.log('║              🎉 セットアップが完了しました！               ║');
            console.log('╚═══════════════════════════════════════════════════════════╝\n');
            console.log('次のステップ:');
            console.log('  1. このサーバーは自動的に終了します');
            console.log('  2. MCP サーバーモードでコンテナを起動してください\n');

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getSuccessHtml());

            // サーバーを終了
            setTimeout(() => {
              void server.close(() => {
                process.exit(0);
              });
            }, 1000);
          } catch (err) {
            console.error('\n❌ トークンの取得に失敗しました:');
            if (err && typeof err === 'object' && 'message' in err) {
              console.error(`   ${String(err.message)}`);
            }

            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getErrorHtml(err instanceof Error ? err.message : '不明なエラー'));
          }
        })();
      } else {
        // その他のパスは 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(PORT, () => {
      console.log(`🚀 OAuth サーバーを起動しました: http://localhost:${String(PORT)}`);
      console.log('');
      console.log('📋 次の手順に従ってください:');
      console.log('');
      console.log('  1. 以下の URL をブラウザで開いてください:');
      console.log('');
      console.log(`     ${authUrl}`);
      console.log('');
      console.log('  2. Google アカウントでログインして、アクセスを許可してください');
      console.log('  3. 認証が完了すると、自動的にこのサーバーに戻ります');
      console.log('');
      console.log('⏳ 認証完了を待っています...\n');
    });

    // エラーハンドリング
    server.on('error', (err) => {
      if ('code' in err && err.code === 'EADDRINUSE') {
        console.error(`\n❌ ポート ${String(PORT)} は既に使用されています。`);
        console.error('   他のアプリケーションを終了してから再試行してください。\n');
        process.exit(1);
      } else {
        console.error('\n❌ サーバーエラー:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('\n╔═══════════════════════════════════════════════════════════╗');
    console.error('║           ❌ セットアップに失敗しました                    ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');

    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`エラー詳細: ${String(error.message)}\n`);
    }

    console.error('トラブルシューティング:');
    console.error('  • credentials.json が正しくマウントされているか確認');
    console.error('  • Google Cloud Console で OAuth 2.0 が有効化されているか確認');
    console.error('  • リダイレクト URI が http://localhost:8000/oauth2callback に設定されているか確認\n');

    process.exit(1);
  }
};

// サーバー起動
void startServer();
