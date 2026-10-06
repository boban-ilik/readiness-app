/**
 * Water context for coach-chat and daily-briefing (1.0.4).
 *
 * The app logs water to Apple Health and reads back today's total from any
 * app, against a target the user set. Re-validated here; the client is not
 * trusted.
 */

export interface WaterInput {
  todayLitres:  number;
  targetLitres: number;
  localHour:    number;
}

const num = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;

export function sanitiseWater(v: unknown): WaterInput | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const today  = num(o.todayLitres, 0, 20);
  const target = num(o.targetLitres, 0.5, 6);
  const hour   = num(o.localHour, 0, 23);
  if (today == null || target == null || hour == null) return null;
  return { todayLitres: Math.round(today * 100) / 100, targetLitres: target, localHour: Math.round(hour) };
}

export function waterLines(w: WaterInput): string[] {
  if (w.todayLitres === 0) {
    return [
      `Water today: nothing logged yet (local time about ${w.localHour}:00; their own target is ${w.targetLitres.toFixed(1)} l). This only means nothing has been logged in Apple Health, not that the user has had nothing to drink.`,
    ];
  }
  return [
    `Water today: ${w.todayLitres.toFixed(1)} l logged so far, against the user's own target of ${w.targetLitres.toFixed(1)} l (local time about ${w.localHour}:00). Logged in Apple Health, so it may be incomplete if they don't log every drink.`,
  ];
}

export const WATER_RULE =
  'If a water total is given, mention hydration only when it matters: a long or hard session, a hot day, a raised resting heart rate, or intake well behind the target late in the day. A low total early in the day is normal. The total is only what was logged: never call the user dehydrated or under-hydrated because of it, never make water the headline, and at most suggest drinking and logging it. Never say water explains the score, and never give a medical fluid prescription.';
