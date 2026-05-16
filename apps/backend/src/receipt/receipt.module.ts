import { Module } from '@nestjs/common';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';
import { OpenAiService } from './openai.service';

@Module({
  controllers: [ReceiptController],
  providers: [ReceiptService, OpenAiService],
})
export class ReceiptModule {}
