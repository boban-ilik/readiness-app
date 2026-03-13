/**
 * correlations.ts
 *
 * Derives human-readable insight sentences from a DayHistory array.
 * Three insight types (in priority order):
 *
 *  1. Sleep duration  — compares avg scores on ≥7h vs <7h nights
 *  2. RHR elevation   — compares avg scores when RHR is at/below vs above median
 *  3. Weekly trend    — first-half vs second-half avg score movement
 *
 * Falls back to a "need more data" card when fewer than 3 valid days exist.
 *
 * PHASE 2: Replace with a Supabase Edge Function + Claude API call that
 * interprets a richer dataset (e.g. nutrition, alcohol, training load) and
 * returns AI-generated insight sentences.
 */

import type { DayHistory } from '@hooks/useHistoryData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Insight {
  icon:       string;
  headline:   string;
  detail:     string;
  direction:  'positive' | 'negative' | 'neutral';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Insight generators ───────────────────────────────────────────────────────

/** Compares avg readiness on days with ≥7h sleep vs <7h sleep. */
function sleepInsight(days: DayHistory[]): Insight | null {
  const THRESHOLD_MIN = 420; // 7 hours in minutes

  const sleepDays = days.filter(d => d.score !== null && d.sleepMinutes !== null);
  if (sleepDays.length < 4) return null; // need enough on both sides

  const longSleep  = sleepDays.filter(d => d.sleepMinutes! >= THRESHOLD_MIN).map(d => d.score!);
  const shortSleep = sleepDays.filter(d => d.sleepMinutes! <  THRESHOLD_MIN).map(d => d.score!);

  if (!longSleep.length || !shortSleep.length) return null;

  const avgLong  = avg(longSleep)!;
  const avgShort = avg(shortSleep)!;
  const diff     = Math.round(avgLong - avgShort);

  if (Math.abs(diff) < 3) return null; // not meaningful enough

  if (diff > 0) {
    return {
      icon:      '🌙',
      headline:  `${diff} pts higher on 7h+ sleep nights`,
      detail:    `≥7h nights avg ${Math.round(avgLong)} · <7h nights avg ${Math.round(avgShort)}`,
      direction: 'positive',
    };
  }

  return {
    icon:      '🌙',
    headline:  `Sleep quantity isn't the key driver this week`,
    detail:    `≥7h nights avg ${Math.round(avgLong)} · <7h nights avg ${Math.round(avgShort)}`,
    direction: 'neutral',
  };
}

/** Compares avg readiness on days where RHR ≤ median vs RHR > median. */
function rhrInsight(days: DayHistory[]): Insight | null {
  const rhrDays = days.filter(d => d.score !== null && d.rhr !== null);
  if (rhrDays.length < 3) return null;

  const rhrs      = rhrDays.map(d => d.rhr!);
  const medianRHR = median(rhrs)!;

  const lowRHR  = rhrDays.filter(d => d.rhr! <= medianRHR).map(d => d.score!);
  const highRHR = rhrDays.filter(d => d.rhr! >  medianRHR).map(d => d.score!);

  if (!lowRHR.length || !highRHR.length) return null;

  const avgLow  = avg(lowRHR)!;
  const avgHigh = avg(highRHR)!;
  const diff    = Math.round(avgLow - avgHigh);

  if (diff < 4) return null; // not meaningful enough

  return {
    icon:      '❤️',
    headline:  `${diff} pts higher when resting heart rate stays at ${Math.round(medianRHR)} bpm or below`,
    detail:    `Low heart rate days: ${Math.round(avgLow)} avg · Elevated days: ${Math.round(avgHigh)} avg`,
    direction: 'positive',
  };
}

/** Compares the first-half and second-half averages to detect a weekly trend. */
function trendInsight(days: DayHistory[]): Insight | null {
  const scoreDays = days.filter(d => d.score !== null);
  if (scoreDays.length < 4) return null;

  const half       = Math.floor(scoreDays.length / 2);
  const firstHalf  = scoreDays.slice(0, half).map(d => d.score!);
  const secondHalf = scoreDays.slice(half).map(d => d.score!);

  const avgFirst  = avg(firstHalf)!;
  const avgSecond = avg(secondHalf)!;
  const diff      = Math.round(avgSecond - avgFirst);

  if (diff >= 5) {
    return {
      icon:      '🚀',
      headline:  `Recovering well — up ${diff} pts this week`,
      detail:    `Early week avg ${Math.round(avgFirst)} → Recent avg ${Math.round(avgSecond)}`,
      direction: 'positive',
    };
  }

  if (diff <= -5) {
    return {
      icon:      '⚠️',
      headline:  `Trending down — ${Math.abs(diff)} pts lower than early week`,
      detail:    `Early week avg ${Math.round(avgFirst)} → Recent avg ${Math.round(avgSecond)}. Extra recovery may help.`,
      direction: 'negative',
    };
  }

  return {
    icon:      '➡️',
    headline:  'Stable readiness this week',
    detail:    `Score consistent around ${Math.round((avgFirst + avgSecond) / 2)} pts`,
    direction: 'neutral',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns up to 3 insights derived from the provided history.
 * Always returns at least one entry (even if it's a "need more data" card).
 */
export function computeInsights(history: DayHistory[]): Insight[] {
  const validDays = history.filter(d => d.score !== null);

  if (validDays.length < 3) {
    return [{
      icon:      '⏳',
      headline:  'More data needed',
      detail:    'Keep tracking — patterns appear after 3+ days.',
      direction: 'neutral',
    }];
  }

  const candidates: Array<Insight | null> = [
    sleepInsight(history),
    rhrInsight(history),
    trendInsight(history),
  ];

  const found = candidates.filter((i): i is Insight => i !== null);

  if (found.length > 0) return found;

  // Fallback: stable / not enough variance to draw a specific insight
  return [{
    icon:      '📊',
    headline:  'Patterns coming into focus',
    detail:    'Your data is consistent so far — keep logging for sharper insights.',
    direction: 'neutral',
  }];
}
