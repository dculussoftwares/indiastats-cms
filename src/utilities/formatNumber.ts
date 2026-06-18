/**
 * Formats a number into compact Indian notation.
 * 10,000,000+ → "1.0 Cr"
 * 100,000+ → "1.0 L"
 * 1,000+ → "1.0 K"
 * <1,000 → raw number string
 */
export function formatNumber(num: number): string {
  if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(1)} Cr`
  if (num >= 100_000) return `${(num / 100_000).toFixed(1)} L`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)} K`
  return num.toString()
}
