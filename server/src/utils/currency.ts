export function formatCurrency(value: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
