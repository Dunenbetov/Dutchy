import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ParseReceiptResponse } from '@receipt-splitter/shared';
import { ReceiptService } from './receipt.service';
import { MOCK_RECEIPT } from './mock-receipt.fixture';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp)$/;

@Controller('receipt')
export class ReceiptController {
  constructor(
    private readonly receiptService: ReceiptService,
    private readonly config: ConfigService,
  ) {}

  @Post('parse')
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
      const message =
        err instanceof Error ? err.message : 'Receipt parse failed';
      if (message.includes('OPENAI_API_KEY')) {
        throw new BadRequestException(
          'OpenAI API key is not configured on the server.',
        );
      }
      throw new BadRequestException(message);
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
