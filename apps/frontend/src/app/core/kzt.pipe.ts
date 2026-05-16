import { Pipe, PipeTransform } from '@angular/core';
import { formatKzt } from '@receipt-splitter/shared';

@Pipe({ name: 'kzt', standalone: true })
export class KztPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatKzt(value ?? 0);
  }
}
