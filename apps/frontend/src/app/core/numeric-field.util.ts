/** Display value for a numeric input — empty string instead of 0 while editing. */
export function formatNumericInput(value: number, emptyWhenZero = true): string {
  if (emptyWhenZero && value === 0) return '';
  return String(value);
}

/** Parse user input; returns null when the field is cleared (do not write 0). */
export function parseNumericInput(raw: string | number): number | null {
  const trimmed = String(raw).trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}
