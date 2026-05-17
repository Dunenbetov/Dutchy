import { Injectable } from '@angular/core';

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

@Injectable({ providedIn: 'root' })
export class ImageCompressionService {
  async compress(file: File): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
      );
      if (!blob) return file;

      const base = file.name.replace(/\.[^.]+$/, '') || 'receipt';
      return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
    } catch {
      // HEIC / older WebViews may fail createImageBitmap — use original for preview + upload
      return file;
    }
  }
}
