/**
 * Utility helpers for the Readiness app.
 */

/**
 * Format a date as "Monday, March 9"
 */
export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as ISO string "YYYY-MM-DD"
 */
export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to a given number of decimal places.
 */
export function round(value: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convert minutes to a human-readable duration string.
 * e.g. 487 → "8h 7m"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Return the median of an array of numbers.
 * More robust than mean for physiological baselines (ignores sick-day spikes).
 */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Compute a personal RHR baseline from an array of daily values.
 * Uses the median of the lower 80% of samples (trims high-end outliers —
 * e.g. sick days or race-day spikes — without losing the full distribution).
 * Falls back to the population default when fewer than 7 samples exist.
 */
export function computeRHRBaseline(
  samples: number[],
  populationDefault = 60,
): number {
  if (samples.length < 7) return populationDefault; // not enough data yet

  // Sort ascending, take the lower 80% to exclude illness/hard-effort spikes
  const sorted = [...samples].sort((a, b) => a - b);
  const keep = Math.ceil(sorted.length * 0.8);
  return computeMedian(sorted.slice(0, keep));
}

/**
 * Compute a personal HRV baseline from an array of daily SDNN values (ms).
 *
 * Unlike RHR, a high HRV day is genuinely positive — not an outlier to trim.
 * The outliers we want to exclude are the LOW end: sick days, heavy training
 * blocks, jet lag, alcohol — all of which temporarily suppress HRV far below
 * your healthy resting state. So we keep the upper 80% (trim bottom 20%)
 * to get a clean picture of your true recovered baseline.
 *
 * Falls back to the population default (55 ms) with fewer than 7 samples.
 */
export function computeHRVBaseline(
  samples: number[],
  populationDefault = 55,
): number {
  if (samples.length < 7) return populationDefault; // not enough data yet

  // Sort ascending, skip the bottom 20% (low-HRV sick/stress outliers)
  const sorted = [...samples].sort((a, b) => a - b);
  const startIdx = Math.floor(sorted.length * 0.2);
  return computeMedian(sorted.slice(startIdx));
}
