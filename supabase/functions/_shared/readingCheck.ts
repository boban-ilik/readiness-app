/**
 * Unusual-reading context for coach-chat and daily-briefing (1.0.5).
 *
 * The app flags HRV or resting heart rate well outside the user's own usual
 * range (the middle 80% of their last 30 days) and asks what changed instead
 * of judging it. This tells the model the same thing. Re-validated here; the
 * client is not trusted, and its free-text labels are never used.
 */

export interface ReadingCheckInput {
  metric:    'hrv' | 'rhr';
  direction: 'high' | 'low';
  value:     number;
  usualLow:  number;
  usualHigh: number;
  reason:    string | null;
}

// Reasons the app offers; anything else from the client is dropped.
const REASONS = new Set([
  'Less alcohol', 'More rest', 'Better sleep', 'Feeling flat', 'Alcohol', 'Poor sleep',
  'Hard training', 'Feeling ill', 'Stress', 'Travel or heat', 'Getting fitter',
]);

const int = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : null;

export function sanitiseReadingCheck(v: unknown): ReadingCheckInput | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (o.metric !== 'hrv' && o.metric !== 'rhr') return null;
  if (o.direction !== 'high' && o.direction !== 'low') return null;
  const value = int(o.value, 1, 300), low = int(o.usualLow, 1, 300), high = int(o.usualHigh, 1, 300);
  if (value == null || low == null || high == null || low > high) return null;
  return {
    metric: o.metric, direction: o.direction, value, usualLow: low, usualHigh: high,
    reason: typeof o.reason === 'string' && REASONS.has(o.reason) ? o.reason : null,
  };
}

export function readingCheckLines(c: ReadingCheckInput): string[] {
  const name = c.metric === 'hrv' ? 'HRV' : 'Resting heart rate';
  const unit = c.metric === 'hrv' ? 'ms' : 'bpm';
  const where = c.direction === 'high' ? 'above' : 'below';
  return [
    `Unusual reading today: ${name} is ${c.value} ${unit}, ${where} the user's own usual range of ${c.usualLow} to ${c.usualHigh} ${unit} (the middle 80% of their last 30 days).`,
    c.reason
      ? `  The user was asked what changed and answered: "${c.reason}".`
      : '  The user has not said what changed.',
  ];
}

export const READING_CHECK_RULE =
  'If the context flags an unusual reading and the user has not said what changed, do not call it good or bad and do not use alarming words like unbalanced or abnormal. Say in one sentence what is unusual, then ask one short question about what might be behind it (for example alcohol, sleep, training, illness, stress, or a recent change in habits). If they did give a reason, build on it. One unusual reading is not a trend.';
