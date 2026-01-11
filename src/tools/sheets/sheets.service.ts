import { BaseCommandService } from '../base/service.interface.js';
import { GetSpreadsheetInfoCommand } from './commands/get-spreadsheet-info.command.js';
import { ListSpreadsheetsCommand } from './commands/list-spreadsheets.command.js';
import { ReadSheetValuesCommand } from './commands/read-sheet-values.command.js';

/**
 * Google Sheets サービス
 * コマンドパターンを使用して各操作を独立したコマンドクラスに委譲
 */
export class SheetsService extends BaseCommandService {
  /**
   * Sheets サービスが提供するすべてのコマンドを登録
   */
  protected registerCommands(): void {
    this.registerCommand(new ListSpreadsheetsCommand(this.auth));
    this.registerCommand(new GetSpreadsheetInfoCommand(this.auth));
    this.registerCommand(new ReadSheetValuesCommand(this.auth));
  }
}
