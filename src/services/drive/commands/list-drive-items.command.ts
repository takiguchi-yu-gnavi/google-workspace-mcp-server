import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { ToolArgs, ToolDefinition } from '../../../types/mcp.js';
import type { Command } from '../../base/command.interface.js';
import { createErrorResult } from '../../base/command.interface.js';

/**
 * Google Drive のフォルダ内のファイル一覧を取得するコマンド
 */
export class ListDriveItemsCommand implements Command {
  constructor(private readonly auth: OAuth2Client) {}

  getToolDefinition(): ToolDefinition {
    return {
      name: 'drive_list_items',
      description: 'List files and folders within a specific Drive folder.',
      inputSchema: {
        type: 'object',
        properties: {
          folderId: {
            type: 'string',
            description: 'The ID of the folder to list items from. Use "root" for the root folder.',
            default: 'root',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of items to return. Defaults to 100.',
            default: 100,
          },
        },
        required: [],
      },
    };
  }

  async execute(args: ToolArgs): Promise<CallToolResult> {
    const folderId = typeof args.folderId === 'string' ? args.folderId : 'root';
    const maxResults = typeof args.maxResults === 'number' ? args.maxResults : 100;

    const drive = google.drive({ version: 'v3', auth: this.auth });

    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size)',
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = response.data.files ?? [];

      if (files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `フォルダ ID "${folderId}" 内にファイルまたはフォルダが見つかりませんでした。`,
            },
          ],
        };
      }

      let result = `フォルダ ID "${folderId}" 内の ${String(files.length)} 件のアイテム:\n\n`;

      // フォルダとファイルを分けて表示
      const folders = files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
      const regularFiles = files.filter((f) => f.mimeType !== 'application/vnd.google-apps.folder');

      if (folders.length > 0) {
        result += `📁 フォルダ (${String(folders.length)} 件):\n`;
        for (const folder of folders) {
          result += `  - ${folder.name ?? '名前なし'} (ID: ${folder.id ?? '不明'})\n`;
        }
        result += `\n`;
      }

      if (regularFiles.length > 0) {
        result += `📄 ファイル (${String(regularFiles.length)} 件):\n`;
        for (const file of regularFiles) {
          const fileName = file.name ?? '名前なし';
          const fileId = file.id ?? '不明';
          const mimeType = file.mimeType ?? '不明';
          const modifiedTime = file.modifiedTime ?? '不明';
          const size = file.size ? `${String(Math.round(parseInt(file.size, 10) / 1024))} KB` : 'N/A';

          result += `  - ${fileName}\n`;
          result += `    ID: ${fileId}\n`;
          result += `    種類: ${mimeType}\n`;
          result += `    更新日時: ${modifiedTime}\n`;
          result += `    サイズ: ${size}\n`;
          result += `    リンク: ${file.webViewLink ?? 'なし'}\n\n`;
        }
      }

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      return createErrorResult(
        `フォルダ内容の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
