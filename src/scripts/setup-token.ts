#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 対話型トークン取得スクリプト
 *
 * このスクリプトは Docker コンテナ内で実行され、初回の Google OAuth 認証を対話的に行います。
 * 取得したトークンは token.json として保存され、以降の MCP サーバー起動時に使用されます。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import type { Credentials } from 'google-auth-library';
import { google } from 'googleapis';

// Google Workspace API のスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/presentations', // Google Slides
  'https://www.googleapis.com/auth/drive.file', // Google Drive (作成したファイルのみ)
  'https://www.googleapis.com/auth/spreadsheets', // Google Sheets
];

// 環境変数からパスを取得（Docker マウント対応）
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH ?? path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH ?? path.join(process.cwd(), 'token.json');

interface CredentialsConfig {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

interface CredentialsFile {
  installed?: CredentialsConfig;
  web?: CredentialsConfig;
}

/**
 * credentials.json の存在確認とバリデーション
 */
const validateCredentials = async (): Promise<void> => {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const parsed = JSON.parse(content) as CredentialsFile;

    if (!parsed.installed && !parsed.web) {
      throw new Error('credentials.json に "installed" または "web" プロパティが見つかりません。');
    }

    console.log('✅ credentials.json の検証に成功しました。');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `❌ credentials.json が見つかりません: ${CREDENTIALS_PATH}\n` +
          '   Google Cloud Console から OAuth 2.0 クライアント ID を作成し、\n' +
          '   credentials.json としてマウントしてください。',
      );
    }
    throw error;
  }
};

/**
 * 既存のトークンをチェック
 */
const checkExistingToken = async (): Promise<boolean> => {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    const tokens = JSON.parse(content) as Credentials;

    if (tokens.access_token || tokens.refresh_token) {
      console.log('⚠️  既存の token.json が見つかりました。');
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * OAuth 認証フローを実行してトークンを取得
 */
const authenticateUser = async (): Promise<Credentials> => {
  console.log('\n🔐 Google OAuth 認証を開始します...');
  console.log('ブラウザが自動的に開きます。Google アカウントでログインしてください。\n');

  try {
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    console.log('✅ 認証に成功しました！');
    return client.credentials;
  } catch (error) {
    console.error('\n❌ 認証中にエラーが発生しました:');
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      console.error(`   ${error.message}`);
    }
    throw error;
  }
};

/**
 * トークンをファイルに保存
 */
const saveToken = async (credentials: Credentials): Promise<void> => {
  try {
    await fs.writeFile(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    console.log(`\n💾 トークンを保存しました: ${TOKEN_PATH}`);
  } catch (error) {
    console.error('\n❌ トークンの保存に失敗しました:');
    throw error;
  }
};

/**
 * トークンの有効性をテスト（Google Slides API で疎通確認）
 */
const testToken = async (credentials: Credentials): Promise<void> => {
  console.log('\n🧪 トークンの有効性をテストしています...');

  try {
    // credentials.json を読み込んで OAuth2Client を初期化
    const keyContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const keys = JSON.parse(keyContent) as CredentialsFile;
    const config = keys.installed ?? keys.web;

    if (!config) {
      throw new Error('credentials.json の形式が不正です。');
    }

    const auth = new google.auth.OAuth2(config.client_id, config.client_secret, config.redirect_uris[0]);

    auth.setCredentials(credentials);

    const slides = google.slides({ version: 'v1', auth });

    // テスト用のプレゼンテーションを作成
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
    console.error('\n⚠️  トークンのテスト中にエラーが発生しました:');
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`   ${String(error.message)}`);
    }
    console.error('   トークンは保存されましたが、API へのアクセスに問題がある可能性があります。');
  }
};

/**
 * メイン処理
 */
const main = async (): Promise<void> => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Google Workspace MCP Server - 初回トークンセットアップ   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. credentials.json の検証
    await validateCredentials();

    // 2. 既存トークンのチェック
    const hasExistingToken = await checkExistingToken();
    if (hasExistingToken) {
      console.log('   再セットアップを行う場合は、既存の token.json を削除してから実行してください。');
      console.log('   続行する場合は既存のトークンが上書きされます。\n');
    }

    // 3. OAuth 認証の実行
    const credentials = await authenticateUser();

    // 4. トークンの保存
    await saveToken(credentials);

    // 5. トークンのテスト
    await testToken(credentials);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              🎉 セットアップが完了しました！               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log('次のステップ:');
    console.log('  1. このコンテナを終了します');
    console.log('  2. MCP サーバーモードでコンテナを起動してください\n');

    process.exit(0);
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
    console.error('  • リダイレクト URI が正しく設定されているか確認\n');

    process.exit(1);
  }
};

// スクリプト実行
void main();
