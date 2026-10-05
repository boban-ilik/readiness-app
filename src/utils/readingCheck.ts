/**
 * "Ask before judging": pure rules.
 *
 * A watch labels an out-of-range reading ("unbalanced") and stops there. A
 * reading far from the user's own usual range has many causes, good and bad,
 * and the only way to tell them apart is to ask. This module decides when a
 * reading is unusual enough to ask about, what to ask, and what each answer
 * means. It never changes the score.
 *
 * The thresholds are the app's convention, shown to the user as "your usual".
 */

import type { EventType } from '@services/lifeEvents';

export type Metric    = 'hrv' | 'rhr';
export type Direction = 'high' | 'low';

export const MIN_DAYS_FOR_RANGE = 7;    // same minimum as the score's baselines
export const ASK_AGAIN_AFTER_DAYS = 7;  // per metric and direction: a new normal isn't asked about daily

/** How far from the median a reading must also be, so a narrow range doesn't make every day "unusual". */
const MIN_GAP = {
  hrv: (median: number) => Math.max(8, median * 0.15),  // ms
  rhr: () => 5,                                         // bpm
};

export interface UsualRange {
  /** 10th and 90th percentile: the middle 80% of the user's recent days */
  low:    number;
  high:   number;
  median: number;
  days:   number;
}

function percentile(sorted: number[], p: number): number {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** The user's usual range from recent daily values, or null with fewer than 7 days. */
export function usualRange(values: number[]): UsualRange | null {
  const v = values.filter(x => typeof x === 'number' && isFinite(x)).sort((a, b) => a - b);
  if (v.length < MIN_DAYS_FOR_RANGE) return null;
  return {
    low:    Math.round(percentile(v, 0.1)),
    high:   Math.round(percentile(v, 0.9)),
    median: percentile(v, 0.5),
    days:   v.length,
  };
}

/** 'high' / 'low' when today's value is outside the usual range by a meaningful margin. */
export function unusualReading(metric: Metric, value: number, range: UsualRange): Direction | null {
  const gap = MIN_GAP[metric](range.median);
  if (value > range.high && value - range.median >= gap) return 'high';
  if (value < range.low  && range.median - value >= gap) return 'low';
  return null;
}

export interface CheckOption {
  key:      string;
  label:    string;
  /** One plain line shown after the user picks this */
  reading:  string;
  /** Saved as this life event, so History and the coach see the reason */
  tag:      EventType;
  /** Note stored with the tag when the tag alone doesn't say it */
  note?:    string;
  /** A lasting change worth the coach remembering beyond the 7 days tags are sent for */
  remember?: string;
  /** Offer the back-from-illness tracker */
  offerIllness?: boolean;
}

const NOT_SURE: CheckOption = {
  key: 'not_sure', label: 'Not sure', tag: 'other', note: 'Unusual reading, no clear reason',
  reading: "No clear reason, and that's fine. One unusual reading isn't a trend. See what tomorrow shows.",
};

const HELPING: CheckOption[] = [
  { key: 'less_alcohol', label: 'Less alcohol', tag: 'other', note: 'Cut back on alcohol',
    remember: 'Has cut back on alcohol',
    reading: 'That fits. Less alcohol often shows up as higher HRV and a lower resting heart rate.' },
  { key: 'more_rest', label: 'More rest', tag: 'other', note: 'More rest than usual',
    reading: 'That fits. Easier days let your body catch up, and the numbers follow.' },
  { key: 'better_sleep', label: 'Better sleep', tag: 'other', note: 'Sleeping better than usual',
    reading: 'That fits. Good sleep usually shows in the next morning\'s numbers.' },
];

const STRAINING: CheckOption[] = [
  { key: 'alcohol', label: 'Alcohol', tag: 'alcohol',
    reading: 'That fits. Alcohol commonly lowers HRV and raises resting heart rate for a night or two.' },
  { key: 'poor_sleep', label: 'Poor sleep', tag: 'poor_sleep',
    reading: 'That fits. A short or broken night usually shows up here first.' },
  { key: 'hard_training', label: 'Hard training', tag: 'intense_workout',
    reading: 'That fits. A hard session can hold your numbers down for a day or two while you recover.' },
  { key: 'feeling_ill', label: 'Feeling ill', tag: 'illness', offerIllness: true,
    reading: 'Noted. Readiness will track your numbers back to normal and keep training advice easy until then.' },
  { key: 'stress', label: 'Stress', tag: 'stress',
    reading: 'That fits. A stressful stretch often shows in these numbers before you notice it.' },
];

/** What to offer for each kind of unusual reading. */
export const CHECK_OPTIONS: Record<`${Metric}_${Direction}`, CheckOption[]> = {
  hrv_high: [
    ...HELPING,
    { key: 'feeling_flat', label: 'Feeling flat', tag: 'other', note: 'Unusually high HRV but feeling flat',
      reading: 'Worth knowing. A high reading with low energy can mean your body is still recovering, so go by how you feel today, not by the number.' },
    NOT_SURE,
  ],
  hrv_low: [...STRAINING, NOT_SURE],
  rhr_high: [
    ...STRAINING,
    { key: 'travel', label: 'Travel or heat', tag: 'travel',
      reading: 'That fits. Travel, heat and dehydration can all raise resting heart rate for a day or two.' },
    NOT_SURE,
  ],
  rhr_low: [
    ...HELPING,
    { key: 'fitter', label: 'Getting fitter', tag: 'other', note: 'Feels fitter lately',
      remember: 'Says their fitness has been improving',
      reading: 'That fits. Resting heart rate tends to drift down as fitness builds.' },
    NOT_SURE,
  ],
};

export interface ReadingCheck {
  metric:    Metric;
  direction: Direction;
  value:     number;
  range:     UsualRange;
}

const NAME: Record<Metric, string> = { hrv: 'HRV', rhr: 'resting heart rate' };
const UNIT: Record<Metric, string> = { hrv: 'ms',  rhr: 'bpm' };

/** The question on the card. Never calls the reading good or bad. */
export function checkQuestion(c: ReadingCheck): string {
  const where = c.direction === 'high' ? 'above' : 'below';
  const better = (c.metric === 'hrv') === (c.direction === 'high');
  const ask = better ? 'Anything different lately?' : 'Anything behind it?';
  return `Your ${NAME[c.metric]} is ${Math.round(c.value)} ${UNIT[c.metric]}, ${where} your usual ${c.range.low} to ${c.range.high}. ${ask}`;
}

/** HRV is checked first; resting heart rate only when HRV is in range or missing. */
export function findReadingCheck(input: {
  hrv: number | null; hrvHistory: number[];
  rhr: number | null; rhrHistory: number[];
}): ReadingCheck | null {
  for (const metric of ['hrv', 'rhr'] as const) {
    const value = input[metric];
    const range = usualRange(metric === 'hrv' ? input.hrvHistory : input.rhrHistory);
    if (value == null || !range) continue;
    const direction = unusualReading(metric, value, range);
    if (direction) return { metric, direction, value, range };
  }
  return null;
}
