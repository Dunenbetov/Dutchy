import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ParseReceiptResponse, ReceiptItem } from '@dutchy/shared';
import {
  computeItemsSubtotal,
  normalizeParsedTotals,
  receiptTotalLooksLikeSubtotalOnly,
  totalsMatch,
} from '@dutchy/shared';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ParseReceiptResponseDto } from './parse-receipt.dto';

const PARSE_SYSTEM = `You extract data from Kazakhstan restaurant receipts (KZT, Kazakh/Russian text).
Return JSON only:
{
  "currency": "KZT",
  "items": [{ "id": "item_1", "name": string, "quantity": number, "price": number }],
  "receiptTotal": number,
  "serviceCharge": { "present": boolean, "percent": number | null, "amount": number | null }
}
Rules:
- currency must be "KZT"
- id: item_1, item_2, ... in order
- price = UNIT price per piece in KZT (not line total)
- quantity = count of units (pieces, portions)
- receiptTotal = FINAL amount to pay (Итого к оплате / Итого / Барлығы к оплате) AFTER service/tax lines
- If receipt shows both "Всего" (pre-service subtotal) and "Итого" (grand total), use Итого for receiptTotal
- Sum of quantity*price for food items should match "Всего", NOT receiptTotal when service is separate
- serviceCharge.present = true ONLY if receipt explicitly shows service/obsluzhivanie/обслуживание/чаевые/10%
- If service is 10%, set percent: 10 and amount to the PRINTED service line (may differ slightly from 10% math)
- Do NOT include service/tax lines as food items
- Ignore payment method lines
- Names: best-effort Cyrillic/Latin from receipt`;

const REFINE_SYSTEM = `You refine a draft Kazakhstan restaurant receipt parse.
Fix garbled Cyrillic item names using menu context and the receipt image.
Fix unit prices (KZT) when line totals imply a different unit price.
Ensure quantity * unit price sums match each printed line total on the receipt.
Return the SAME JSON schema as the initial parse.`;

const VERIFY_SYSTEM = `You verify and correct a Kazakhstan restaurant receipt parse against the image.
Check EVERY line: quantity × unit price must equal the printed line "Сумма".
Check totals: items subtotal = "Всего"; receiptTotal = "Итого к оплате" (after service, not Всего).
If service line exists, serviceCharge.present=true with printed percent and amount.
Do NOT include service/obsluzhivanie as a food item.
Fix Cyrillic names character-by-character from the receipt.
Return the SAME JSON schema only.`;

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  constructor(private readonly config: ConfigService) {}

  private client(): OpenAI {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY is not configured');
    }
    return new OpenAI({ apiKey });
  }

  async parseReceiptImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ParseReceiptResponse> {
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const initial = await this.requestParse(PARSE_SYSTEM, dataUrl, [
      'Parse this receipt. All amounts in KZT.',
    ]);

    let result = initial;

    if (this.needsRefine(result)) {
      this.logger.log('Running refinement pass for receipt parse');
      try {
        result = await this.requestParse(REFINE_SYSTEM, dataUrl, [
          'Refine this draft parse. Correct names and prices.',
          JSON.stringify(initial, null, 2),
        ]);
      } catch (err) {
        this.logger.warn('Refinement pass failed, using initial parse', err);
        result = initial;
      }
    }

    if (this.needsVerify(result)) {
      this.logger.log('Running verification pass for receipt parse');
      try {
        result = await this.requestParse(VERIFY_SYSTEM, dataUrl, [
          'Verify and correct this parse against the receipt image.',
          JSON.stringify(result, null, 2),
        ]);
      } catch (err) {
        this.logger.warn('Verification pass failed, using previous parse', err);
      }
    }

    return this.applyPostProcess(result);
  }

  private needsRefine(response: ParseReceiptResponse): boolean {
    const sub = computeItemsSubtotal(response.items);
    return (
      !totalsMatch(
        response.items,
        response.receiptTotal,
        response.serviceCharge,
        5,
      ) ||
      receiptTotalLooksLikeSubtotalOnly(
        response.receiptTotal,
        sub,
        response.serviceCharge,
        5,
      ) ||
      this.hasSuspiciousNames(response.items)
    );
  }

  private needsVerify(response: ParseReceiptResponse): boolean {
    const sub = computeItemsSubtotal(response.items);
    return (
      !totalsMatch(
        response.items,
        response.receiptTotal,
        response.serviceCharge,
        2,
      ) ||
      receiptTotalLooksLikeSubtotalOnly(
        response.receiptTotal,
        sub,
        response.serviceCharge,
        2,
      ) ||
      this.hasSuspiciousNames(response.items)
    );
  }

  private applyPostProcess(response: ParseReceiptResponse): ParseReceiptResponse {
    const { receiptTotal, serviceCharge } = normalizeParsedTotals(
      response.items,
      response.receiptTotal,
      response.serviceCharge,
    );
    return { ...response, receiptTotal, serviceCharge };
  }

  private hasSuspiciousNames(items: ReceiptItem[]): boolean {
    return items.some((item) => {
      const n = item.name.trim();
      if (n.length < 2) return true;
      if (/^[^a-zA-Zа-яА-ЯёЁіғқңөұүһІҒҚҢӨҰҮҺ0-9\s\-.,()]+$/u.test(n)) return true;
      return false;
    });
  }

  private async requestParse(
    system: string,
    dataUrl: string,
    userTexts: string[],
  ): Promise<ParseReceiptResponse> {
    const completion = await this.client().chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            ...userTexts.map((text) => ({ type: 'text' as const, text })),
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new BadRequestException('Empty response from OpenAI');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.error('Failed to parse OpenAI JSON');
      throw new BadRequestException('Invalid JSON from vision model');
    }

    return this.normalizeResponse(parsed);
  }

  private normalizeResponse(parsed: unknown): ParseReceiptResponse {
    const coerced = this.coerceParsedShape(parsed);
    const dto = plainToInstance(ParseReceiptResponseDto, coerced);
    const errors = validateSync(dto, { whitelist: true });
    const response =
      errors.length === 0
        ? this.toResponse(dto)
        : this.normalizeLoose(coerced);

    if (response.items.length === 0) {
      throw new BadRequestException(
        'No line items could be read from this receipt. Try a clearer photo.',
      );
    }

    return this.applyPostProcess(response);
  }

  /** Map common LLM field aliases onto the canonical schema. */
  private coerceParsedShape(parsed: unknown): Record<string, unknown> {
    const obj =
      parsed && typeof parsed === 'object'
        ? ({ ...(parsed as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const itemsRaw =
      obj['items'] ?? obj['lineItems'] ?? obj['line_items'] ?? obj['products'];
    if (itemsRaw != null) {
      obj['items'] = itemsRaw;
    }

    const totalRaw =
      obj['receiptTotal'] ??
      obj['receipt_total'] ??
      obj['grandTotal'] ??
      obj['grand_total'] ??
      obj['total'];
    if (totalRaw != null) {
      obj['receiptTotal'] = totalRaw;
    }

    const scRaw = obj['serviceCharge'] ?? obj['service_charge'];
    if (scRaw && typeof scRaw === 'object') {
      obj['serviceCharge'] = scRaw;
    }

    if (obj['currency'] == null) {
      obj['currency'] = 'KZT';
    }

    return obj;
  }

  private normalizeLoose(obj: Record<string, unknown>): ParseReceiptResponse {
    this.logger.warn('OpenAI response validation failed, normalizing');
    const itemsRaw = obj['items'];
    if (!Array.isArray(itemsRaw)) {
      throw new BadRequestException('Receipt items missing from model response');
    }

    const items: ReceiptItem[] = itemsRaw
      .map((row, i) => {
        const r = row as Record<string, unknown>;
        const name = String(r['name'] ?? r['title'] ?? '').trim();
        if (!name) return null;
        const quantity = Math.max(1, Math.floor(Number(r['quantity'] ?? r['qty'] ?? 1)));
        const price = Math.max(
          0,
          Number(r['price'] ?? r['unitPrice'] ?? r['unit_price'] ?? 0),
        );
        return {
          id: String(r['id'] ?? `item_${i + 1}`),
          name,
          quantity,
          price,
        };
      })
      .filter((item): item is ReceiptItem => item != null);

    const sc = (obj['serviceCharge'] as Record<string, unknown>) ?? {};
    const serviceCharge = {
      present: Boolean(sc['present']),
      percent: sc['percent'] != null ? Number(sc['percent']) : undefined,
      amount: sc['amount'] != null ? Number(sc['amount']) : undefined,
    };

    let receiptTotal = Number(obj['receiptTotal'] ?? 0);
    if (!receiptTotal) {
      const sub = computeItemsSubtotal(items);
      const svc = serviceCharge.present
        ? serviceCharge.amount ??
          (serviceCharge.percent
            ? Math.round((sub * serviceCharge.percent) / 100)
            : 0)
        : 0;
      receiptTotal = sub + svc;
    }

    return {
      currency: 'KZT',
      items,
      receiptTotal: Math.round(receiptTotal),
      serviceCharge,
    };
  }

  private toResponse(dto: ParseReceiptResponseDto): ParseReceiptResponse {
    const items = dto.items
      .map((item) => ({
        id: item.id,
        name: item.name?.trim() ?? '',
        quantity: Math.max(1, Math.floor(item.quantity)),
        price: Math.max(0, item.price),
      }))
      .filter((item) => item.name.length > 0);

    return {
      currency: 'KZT',
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      receiptTotal: Math.round(dto.receiptTotal),
      serviceCharge: {
        present: dto.serviceCharge.present,
        percent: dto.serviceCharge.percent,
        amount: dto.serviceCharge.amount,
      },
    };
  }
}
