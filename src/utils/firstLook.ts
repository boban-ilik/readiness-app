/**
 * The day-0 "first look": what the last 30 days of Apple Health already say,
 * shown to a new user who has watch history instead of "come back in a week".
 *
 * Pure: takes the per-day history History already computes and returns only
 * what can be said honestly. Anything with too little data comes back null
 * and the screen leaves that section out.
 */

import { usualRange, MIN_DAYS_FOR_RANGE, type UsualRange } from './readingCheck';

export interface FirstLookDay {
  date:         string;          // YYYY-MM-DD
  score:        number | null;
  hrv:          number | null;
  rhr:          number | null;
  sleepMinutes: number | null;
}

export interface NotableDay {
  date:  string;
  score: number;
  /** Short facts about that night, e.g. "slept 7 h 40 m", "resting heart rate +6" */
  notes: string[];
}

export interface FirstLook {
  /** Nights with HRV or resting heart rate in the window, today excluded */
  nights:   number;
  hrv:      UsualRange | null;
  rhr:      UsualRange | null;
  sleep:    { avgMinutes: number; nights: number; shortNights: number } | null;
  best:     NotableDay | null;
  toughest: NotableDay | null;
  today:    { score: number; position: 'below' | 'inside' | 'above' } | null;
}

/** Under 6 hours counts as a short night. */
export const SHORT_NIGHT_MINUTES = 360;
/** Best and toughest days are only worth showing when they differ this much. */
const MIN_SCORE_SPREAD = 10;

export function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  return m ? `${h} h ${m} m` : `${h} h`;
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function describe(day: FirstLookDay, hrv: UsualRange | null, rhr: UsualRange | null): string[] {
  const notes: string[] = [];
  if (day.sleepMinutes != null) notes.push(`slept ${formatSleep(day.sleepMinutes)}`);
  if (day.rhr != null && rhr) {
    const d = Math.round(day.rhr - rhr.median);
    if (Math.abs(d) >= 3) notes.push(`resting heart rate ${signed(d)}`);
  }
  if (day.hrv != null && hrv) {
    const d = Math.round(day.hrv - hrv.median);
    if (Math.abs(d) >= Math.max(5, hrv.median * 0.1)) notes.push(`HRV ${signed(d)} ms`);
  }
  return notes;
}

/** Null when there are fewer than 7 nights of heart data before today. */
export function buildFirstLook(days: FirstLookDay[], todayDate: string, todayScore: number | null): FirstLook | null {
  const past   = days.filter(d => d.date < todayDate);
  const nights = past.filter(d => d.hrv != null || d.rhr != null).length;
  if (nights < MIN_DAYS_FOR_RANGE) return null;

  const hrv = usualRange(past.map(d => d.hrv).filter((v): v is number => v != null));
  const rhr = usualRange(past.map(d => d.rhr).filter((v): v is number => v != null));

  const slept = past.map(d => d.sleepMinutes).filter((v): v is number => v != null);
  const sleep = slept.length >= MIN_DAYS_FOR_RANGE
    ? {
        avgMinutes:  Math.round(slept.reduce((a, b) => a + b, 0) / slept.length),
        nights:      slept.length,
        shortNights: slept.filter(m => m < SHORT_NIGHT_MINUTES).length,
      }
    : null;

  const scored = past.filter((d): d is FirstLookDay & { score: number } => d.score != null);
  let best: NotableDay | null = null, toughest: NotableDay | null = null;
  if (scored.length >= MIN_DAYS_FOR_RANGE) {
    const hi = scored.reduce((a, b) => (b.score > a.score ? b : a));
    const lo = scored.reduce((a, b) => (b.score < a.score ? b : a));
    if (hi.score - lo.score >= MIN_SCORE_SPREAD) {
      best     = { date: hi.date, score: Math.round(hi.score), notes: describe(hi, hrv, rhr) };
      toughest = { date: lo.date, score: Math.round(lo.score), notes: describe(lo, hrv, rhr) };
    }
  }

  const scoreRange = usualRange(scored.map(d => d.score));
  const today = todayScore != null && todayScore > 0 && scoreRange
    ? {
        score:    Math.round(todayScore),
        position: todayScore < scoreRange.low ? 'below' as const
                : todayScore > scoreRange.high ? 'above' as const
                : 'inside' as const,
      }
    : null;

  return { nights, hrv, rhr, sleep, best, toughest, today };
}
