import { BaseCommandService } from '../base/service.interface.js';
import { CreatePresentationCommand } from './commands/create-presentation.command.js';
import { GetPresentationCommand } from './commands/get-presentation.command.js';

/**
 * Google Slides サービス
 * コマンドパターンを使用して各操作を独立したコマンドクラスに委譲
 */
export class SlidesService extends BaseCommandService {
  /**
   * Slides サービスが提供するすべてのコマンドを登録
   */
  protected registerCommands(): void {
    this.registerCommand(new CreatePresentationCommand(this.auth));
    this.registerCommand(new GetPresentationCommand(this.auth));
  }
}
