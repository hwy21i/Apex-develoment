/** Formats all financial values in Ethiopian Birr for a consistent ERP UI. */
export function formatCurrency(amount: number | null | undefined, compact = false): string {
  const value = Number.isFinite(amount) ? Number(amount) : 0;
  if (compact && Math.abs(value) >= 1_000_000) {
    return `ETB ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `ETB ${new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value)}`;
}

export function percentage(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}
