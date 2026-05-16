import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShareService {
  async shareSummary(text: string, title = 'Dutchy'): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text });
        return true;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return false;
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }
}
