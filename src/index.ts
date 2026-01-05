import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GoogleAuthManager } from './auth/google-auth-manager.js';
import { ServiceManager } from './manager/service-manager.js';
import { SlidesService } from './services/slides.service.js';
import type { ToolArgs } from './types/mcp.js';

async function main() {
  const server = new McpServer({
    name: 'google-workspace-mcp',
    version: '1.0.0',
  });

  try {
    const authManager = new GoogleAuthManager();
    const auth = await authManager.getAuth();

    const serviceManager = new ServiceManager();
    serviceManager.registerService('slides', new SlidesService(auth));

    const allTools = serviceManager.getTools();

    for (const tool of allTools) {
      // 3つの引数を個別に渡す形式に修正
      server.registerTool(
        tool.name, // 第1引数: 名前
        {
          // 第2引数: 設定 (スキーマ・説明)
          description: tool.description ?? 'Google Workspace tool',
          inputSchema:
            tool.name === 'slides_get_presentation'
              ? { presentationId: z.string().describe('ID of the presentation') }
              : { title: z.string().describe('Title of presentation') },
        },
        async (args: ToolArgs) => {
          // 第3引数: コールバック
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
