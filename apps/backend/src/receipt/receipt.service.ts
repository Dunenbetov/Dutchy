import { Injectable } from '@nestjs/common';
import type { ParseReceiptResponse } from '@receipt-splitter/shared';
import { OpenAiService } from './openai.service';

@Injectable()
export class ReceiptService {
  constructor(private readonly openAi: OpenAiService) {}

  async parse(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ParseReceiptResponse> {
    return this.openAi.parseReceiptImage(buffer, mimeType);
  }
}
