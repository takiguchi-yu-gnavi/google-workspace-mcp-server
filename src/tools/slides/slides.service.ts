import { BaseCommandService } from '@/tools/base/service.interface.js';
import { CreatePresentationCommand } from '@/tools/slides/commands/create-presentation.command.js';
import { GetPageCommand } from '@/tools/slides/commands/get-page.command.js';
import { GetPresentationCommand } from '@/tools/slides/commands/get-presentation.command.js';
import { ListPresentationsCommand } from '@/tools/slides/commands/list-presentations.command.js';

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
    this.registerCommand(new ListPresentationsCommand(this.auth));
    this.registerCommand(new GetPageCommand(this.auth));
  }
}
