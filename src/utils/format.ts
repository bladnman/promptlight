/**
 * Format a number with K/M suffix for compact display
 * e.g., 1000 -> "1k", 1500 -> "1.5k", 1000000 -> "1M"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return String(num);
  }

  if (num < 1000000) {
    const k = num / 1000;
    // Show one decimal place if not a round number
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }

  const m = num / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}
