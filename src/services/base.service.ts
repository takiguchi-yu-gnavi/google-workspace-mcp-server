import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { OAuth2Client } from 'google-auth-library';
import type { ToolArgs, ToolDefinition, ToolResult } from '../types/mcp.js';

/**
 * すべての Google サービスのインターフェース
 */
export interface WorkspaceService {
  getTools(): ToolDefinition[];
  execute(name: string, args: ToolArgs): ToolResult;
}

/**
 * Google サービスの基底抽象クラス
 */
export abstract class BaseGoogleService implements WorkspaceService {
  // 子クラス（Slides等）からのみアクセス可能な認証クライアント
  protected readonly auth: OAuth2Client;

  constructor(auth: OAuth2Client) {
    this.auth = auth;
  }

  /** 各サービスで実装すべきツール定義取得 */
  abstract getTools(): ToolDefinition[];

  /** 各サービスで実装すべき実行ロジック */
  abstract execute(name: string, args: ToolArgs): ToolResult;

  /** 共通のエラーハンドリング用ヘルパー */
  protected createErrorResult(message: string): CallToolResult {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
