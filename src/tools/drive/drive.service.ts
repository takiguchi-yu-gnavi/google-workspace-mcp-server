import { BaseCommandService } from '@/tools/base/service.interface.js';
import { ListDriveItemsCommand } from '@/tools/drive/commands/list-drive-items.command.js';
import { SearchDriveFilesCommand } from '@/tools/drive/commands/search-drive-files.command.js';

/**
 * Google Drive サービス
 * コマンドパターンを使用して各操作を独立したコマンドクラスに委譲
 */
export class DriveService extends BaseCommandService {
  /**
   * Drive サービスが提供するすべてのコマンドを登録
   */
  protected registerCommands(): void {
    this.registerCommand(new SearchDriveFilesCommand(this.auth));
    this.registerCommand(new ListDriveItemsCommand(this.auth));
  }
}
