import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { WorkspaceService } from '@/tools/base/service.interface.js';
import type { ToolArgs, ToolDefinition } from '@/types/mcp.js';

/**
 * すべての Google Workspace サービスを統合管理するマネージャー
 */
export class ServiceManager {
  private readonly services = new Map<string, WorkspaceService>();

  /**
   * 新しいサービス（Slides, Sheets等）をマネージャーに登録する
   */
  registerService(serviceName: string, service: WorkspaceService): void {
    this.services.set(serviceName, service);
    console.error(`[ServiceManager] Registered service: ${serviceName}`);
  }

  /**
   * 登録されている全サービスからツール定義を集約する
   * MCP の ListToolsRequest で使用
   */
  getTools(): ToolDefinition[] {
    const allTools: ToolDefinition[] = [];
    for (const service of this.services.values()) {
      allTools.push(...service.getTools());
    }
    return allTools;
  }

  /**
   * ツール名に基づいて適切なサービスに処理を振り分ける
   * MCP の CallToolRequest で使用
   */
  async handleToolCall(name: string, args: ToolArgs): Promise<CallToolResult> {
    // 登録されている全サービスから該当ツールを探す
    for (const service of this.services.values()) {
      const tools = service.getTools();
      if (tools.some((t) => t.name === name)) {
        return await service.execute(name, args);
      }
    }

    // どのサービスも該当ツールを持っていない場合
    return {
      content: [
        {
          type: 'text',
          text: `Error: No service found to handle tool '${name}'`,
        },
      ],
      isError: true,
    };
  }
}
