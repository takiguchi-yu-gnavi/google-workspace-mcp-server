import { google } from 'googleapis';
import { BaseGoogleService } from './base.service.js';
import type { ToolArgs, ToolDefinition, ToolResult } from '../types/mcp.js';

export class SlidesService extends BaseGoogleService {
  /**
   * このサービスが提供するツールの定義一覧
   */
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'slides_create_presentation',
        description: 'Create a new Google Slides presentation with a specified title.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the new presentation',
            },
          },
          required: ['title'],
        },
      },
    ];
  }

  /**
   * ツール名に応じて具体的な API 処理を実行する
   */
  async execute(name: string, args: ToolArgs): ToolResult {
    try {
      switch (name) {
        case 'slides_create_presentation':
          return await this.createPresentation(args);
        default:
          return this.createErrorResult(`Tool "${name}" not implemented in SlidesService.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(`Slides API error: ${errorMessage}`);
    }
  }

  /**
   * プレゼンテーションを新規作成する内部メソッド
   */
  private async createPresentation(args: ToolArgs): ToolResult {
    // 引数のバリデーション（型安全性の確保）
    const title = typeof args.title === 'string' ? args.title : 'Untitled Presentation';

    const slides = google.slides({ version: 'v1', auth: this.auth });

    // API 呼び出し
    const response = await slides.presentations.create({
      requestBody: { title },
    });

    const data = response.data;

    const presentationId = data.presentationId ?? 'unknown';
    const presentationTitle = data.title ?? 'Untitled';

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created presentation: "${presentationTitle}"\nID: ${presentationId}\nURL: https://docs.google.com/presentation/d/${presentationId}/edit`,
        },
      ],
    };
  }
}
