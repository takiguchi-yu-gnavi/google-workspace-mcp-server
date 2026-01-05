import { google, type slides_v1 } from 'googleapis';
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
      {
        name: 'slides_get_presentation',
        description: 'Read content from a presentation including text and tables to understand specifications.',
        inputSchema: {
          type: 'object',
          properties: {
            presentationId: {
              type: 'string',
              description: 'The ID of the presentation to read',
            },
          },
          required: ['presentationId'],
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
        case 'slides_get_presentation':
          return await this.getPresentation(args);
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

  /**
   * プレゼンテーションの内容を取得する内部メソッド
   */
  private async getPresentation(args: ToolArgs): ToolResult {
    const presentationId = typeof args.presentationId === 'string' ? args.presentationId : '';
    if (presentationId === '') {
      return this.createErrorResult('presentationId が指定されていません。');
    }
    const slides = google.slides({ version: 'v1', auth: this.auth });

    // API 呼び出し
    const response = await slides.presentations.get({
      presentationId,
    });

    const data = response.data;
    const presentationTitle = typeof data.title === 'string' ? data.title : 'Untitled';
    const slidePages = data.slides ?? [];

    let fullContent = `Title: ${presentationTitle}\n\n`;

    slidePages.forEach((slide, index) => {
      fullContent += `--- Slide ${String(index + 1)} ---\n`;

      slide.pageElements?.forEach((element) => {
        if (element.shape) {
          const shapeText = this.extractTextFromShape(element.shape);
          if (shapeText) {
            fullContent += `${shapeText}\n`;
          }
        }

        if (element.table) {
          const tableText = this.extractTextFromTable(element.table);
          if (tableText) {
            fullContent += `${tableText}\n`;
          }
        }
      });
      fullContent += '\n';
    });

    return {
      content: [{ type: 'text', text: fullContent }],
    };
  }

  /**
   * Shape や TableCell の text からテキストのみを抽出する共通ヘルパー
   */
  private readonly extractTextFromTextContent = (textContent?: slides_v1.Schema$TextContent): string => {
    const textElements = textContent?.textElements;
    if (!textElements) {
      return '';
    }

    const joined = textElements
      .map((element) => element.textRun?.content ?? '')
      .join('')
      .trim();

    return joined;
  };

  /**
   * テキストボックス（Shape）からテキストを抽出
   */
  private readonly extractTextFromShape = (shape: slides_v1.Schema$Shape): string => {
    return this.extractTextFromTextContent(shape.text);
  };

  /**
   * 表のセルからテキストを抽出し、行単位で連結
   */
  private readonly extractTextFromTable = (table: slides_v1.Schema$Table): string => {
    const rows = table.tableRows ?? [];

    const rowStrings = rows
      .map((row) => {
        const cells = row.tableCells ?? [];
        const cellTexts = cells
          .map((cell) => this.extractTextFromTextContent(cell.text))
          .filter((cellText) => cellText.length > 0);

        if (cellTexts.length === 0) {
          return '';
        }

        return cellTexts.join(' | ');
      })
      .filter((rowText) => rowText.length > 0);

    return rowStrings.join('\n');
  };
}
