import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';

/** Angular strips blob: URLs from img [src]; this pipe allows receipt previews. */
@Pipe({ name: 'safeUrl' })
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeUrl | null {
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
