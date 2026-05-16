import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ParseReceiptResponse } from '@receipt-splitter/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReceiptApiService {
  private readonly http = inject(HttpClient);

  async parseReceipt(file: File): Promise<ParseReceiptResponse> {
    const path = environment.useMockParse
      ? `${environment.apiUrl}/receipt/parse/mock`
      : `${environment.apiUrl}/receipt/parse`;

    if (environment.useMockParse) {
      return firstValueFrom(this.http.post<ParseReceiptResponse>(path, {}));
    }

    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(this.http.post<ParseReceiptResponse>(path, form));
  }
}
