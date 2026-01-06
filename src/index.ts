import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GoogleAuthManager } from './auth/google-auth-manager.js';
import { ServiceManager } from './manager/service-manager.js';
import { SlidesService } from './services/slides/slides.service.js';
import type { ToolArgs } from './types/mcp.js';

/**
 * JSON Schema を Zod スキーマに変換するヘルパー関数
 */
const convertToZodSchema = (inputSchema: Record<string, unknown>): Record<string, z.ZodType> => {
  const properties = inputSchema.properties as Record<string, { type: string; description?: string }>;
  const zodSchema: Record<string, z.ZodType> = {};

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'string') {
      zodSchema[key] = z.string().describe(prop.description ?? '');
    }
    // 今後、他の型（number, boolean 等）にも対応可能
  }

  return zodSchema;
};

async function main() {
  const server = new McpServer({
    name: 'google-workspace-mcp',
    version: '1.0.0',
  });

  try {
    const authManager = new GoogleAuthManager();
    const auth = await authManager.getAuth();

    // サービスを登録
    const serviceManager = new ServiceManager();
    serviceManager.registerService('slides', new SlidesService(auth));
    // 今後、sheets や他のサービスもここに追加
    // serviceManager.registerService('sheets', new SheetsService(auth));

    // 全サービスからツール定義を取得
    const allTools = serviceManager.getTools();

    // 各ツールを MCP サーバーに登録
    for (const tool of allTools) {
      server.registerTool(
        tool.name,
        {
          description: tool.description ?? 'Google Workspace tool',
          inputSchema: convertToZodSchema(tool.inputSchema as Record<string, unknown>),
        },
        async (args: ToolArgs) => {
          return await serviceManager.handleToolCall(tool.name, args);
        },
      );
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('🚀 Google Workspace MCP Server is running');
  } catch (error) {
    console.error('❌ Failed to start MCP Server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
