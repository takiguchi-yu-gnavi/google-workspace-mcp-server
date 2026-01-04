import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

/** ツールへの引数の型 */
export type ToolArgs = Record<string, unknown>;

/** ツール実行結果の型 */
export type ToolResult = Promise<CallToolResult>;

/** MCPツール定義の型 */
export type ToolDefinition = Tool;
