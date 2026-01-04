import type { WorkspaceService } from '../services/base.service.js';
import type { ToolArgs, ToolDefinition, ToolResult } from '../types/mcp.js';

export class ServiceManager {
  // 登録されたサービスを保持するマップ
  private services = new Map<string, WorkspaceService>();

  /**
   * 新しいサービス（Slides, Sheets等）をマネージャーに登録する
   */
  registerService(serviceName: string, service: WorkspaceService): void {
    this.services.set(serviceName, service);
    console.error(`[ServiceManager] Registered service: ${serviceName}`);
  }

  /**
   * 登録されている全サービスからツール定義を集約する
   * MCPの ListToolsRequest で使用
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
   * MCPの CallToolRequest で使用
   */
  async handleToolCall(name: string, args: ToolArgs): ToolResult {
    // ツール名からサービスを特定（例: "slides_create" なら "slides" を探す）
    // サービスをまたぐツール名の衝突を防ぐため、プレフィックスでの判定を推奨
    for (const service of this.services.values()) {
      // そのサービスが該当ツールを持っているか、
      // またはツール名がサービス名で始まっているかをチェック
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
