import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolArgs, ToolDefinition } from '../../types/mcp.js';

/**
 * 各コマンドが実装すべきインターフェース
 */
export interface Command {
  /**
   * このコマンドのツール定義を返す
   */
  getToolDefinition(): ToolDefinition;

  /**
   * コマンドを実行する
   */
  execute(args: ToolArgs): Promise<CallToolResult>;
}

/**
 * エラーレスポンスを作成するヘルパー関数
 */
export const createErrorResult = (message: string): CallToolResult => ({
  content: [{ type: 'text', text: `Error: ${message}` }],
  isError: true,
});
