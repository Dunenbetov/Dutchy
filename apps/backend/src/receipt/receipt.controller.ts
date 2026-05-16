import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { ParseReceiptResponse } from '@dutchy/shared';
import { ReceiptService } from './receipt.service';
import { MOCK_RECEIPT } from './mock-receipt.fixture';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp)$/;
const PARSE_USER_MESSAGE =
  'Could not parse this receipt. Try a clearer photo or check back later.';

@Controller('receipt')
export class ReceiptController {
  private readonly logger = new Logger(ReceiptController.name);

  constructor(
    private readonly receiptService: ReceiptService,
    private readonly config: ConfigService,
  ) {}

  @Post('parse')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file'))
  async parse(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ParseReceiptResponse> {
    try {
      return await this.receiptService.parse(file.buffer, file.mimetype);
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Receipt parse failed: ${message}`);
      if (message.includes('OPENAI_API_KEY')) {
        throw new BadRequestException(
          'Receipt parsing is temporarily unavailable.',
        );
      }
      throw new BadRequestException(PARSE_USER_MESSAGE);
    }
  }

  @Post('parse/mock')
  parseMock(): ParseReceiptResponse {
    const env = this.config.get<string>('NODE_ENV');
    if (env === 'production') {
      throw new NotFoundException();
    }
    return MOCK_RECEIPT;
  }
}
