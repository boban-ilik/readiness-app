/**
 * readinessForecast.ts
 *
 * Produces a 3-day directional readiness forecast using the patterns already
 * detected from 30 days of history. This is intentionally directional, not
 * precise — the goal is "Thursday looks rough, shift your hard session" not
 * "you will score 61.4".
 *
 * Algorithm:
 *  1. Start from today's score
 *  2. Apply pattern-driven adjustments for each forward day
 *  3. Clamp to [15, 98] and add a ±range to communicate uncertainty
 */

import type { PatternInsight } from '@services/patternAnalysis';
import type { WorkloadResult }  from '@services/workloadAnalysis';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForecastTrend      = 'up' | 'down' | 'flat';
export type ForecastConfidence = 'high' | 'medium' | 'low';

export interface DayForecast {
  label:       string;              // "Tomorrow", "In 2 days", "In 3 days"
  dateLabel:   string;              // "Tue", "Wed", "Thu"
  score:       number;              // point estimate
  range:       [number, number];    // [low, high] shown as a band
  trend:       ForecastTrend;
  confidence:  ForecastConfidence;  // widens uncertainty & dims card on day 3
  keyFactor:   string;              // actionable one-liner driving the prediction
}

export type ReadinessForecast = [DayForecast, DayForecast, DayForecast];

// ─── Pattern weights ──────────────────────────────────────────────────────────
// How much each pattern moves the score per day (decay toward baseline)

const PATTERN_WEIGHTS: Record<string, number[]> = {
  // key                        day1  day2  day3
  consecutive_hrv_drop:      [  -8,   -5,   -2],
  consecutive_score_decline: [  -6,   -3,    0],
  hrv_improving:             [  +6,   +4,   +2],
  recovery_rebound:          [  +8,   +5,   +2],
  sleep_debt:                [  -5,   -5,   -3],
  stress_accumulation:       [  -5,   -3,   -1],
  persistent_low:            [  -4,   -3,   -2],  // was 'persistent_low_scores' — bug fixed
};

// Training load: peaks at day+1 (DOMS), then clears by day+3
const HIGH_LOAD_WEIGHTS = [-12,  -5,  +3];
const MOD_LOAD_WEIGHTS  = [ -6,  -2,  +2];

// ─── Main function ────────────────────────────────────────────────────────────

export function computeForecast(
  todayScore: number,
  patterns:   PatternInsight[],
  workload:   WorkloadResult | null,
): ReadinessForecast {
  const patternTypes = new Set(patterns.map(p => p.type));

  // Accumulate deltas for each forward day
  const deltas = [0, 0, 0];

  for (const [patternType, weights] of Object.entries(PATTERN_WEIGHTS)) {
    if (patternTypes.has(patternType)) {
      for (let d = 0; d < 3; d++) deltas[d] += weights[d];
    }
  }

  // Apply training load effect
  if (workload && workload.workouts.length > 0) {
    const loadWeights = workload.isHighLoad ? HIGH_LOAD_WEIGHTS : MOD_LOAD_WEIGHTS;
    for (let d = 0; d < 3; d++) deltas[d] += loadWeights[d];
  }

  // Clamp projected scores
  const scores = deltas.map(d =>
    Math.min(98, Math.max(15, Math.round(todayScore + d))),
  );

  return [
    buildDayForecast(todayScore, scores[0], 1, patterns, workload),
    buildDayForecast(scores[0],  scores[1], 2, patterns, workload),
    buildDayForecast(scores[1],  scores[2], 3, patterns, workload),
  ] as ReadinessForecast;
}

function buildDayForecast(
  prevScore:  number,
  score:      number,
  daysAhead:  number,
  patterns:   PatternInsight[],
  workload:   WorkloadResult | null,
): DayForecast {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
  const label     = daysAhead === 1 ? 'Tomorrow'
                  : daysAhead === 2 ? 'In 2 days'
                  : 'In 3 days';

  const diff  = score - prevScore;
  const trend: ForecastTrend = diff >= 3 ? 'up' : diff <= -3 ? 'down' : 'flat';

  // Confidence & uncertainty range widen further out
  const confidence: ForecastConfidence =
    daysAhead === 1 ? 'high' : daysAhead === 2 ? 'medium' : 'low';
  const uncertainty = daysAhead === 1 ? 5 : daysAhead === 2 ? 9 : 13;
  const range: [number, number] = [
    Math.max(10, score - uncertainty),
    Math.min(99, score + uncertainty),
  ];

  const keyFactor = deriveKeyFactor(daysAhead, score, diff, patterns, workload);

  return { label, dateLabel, score, range, trend, confidence, keyFactor };
}

// ─── Key factor copy ──────────────────────────────────────────────────────────
// Priority order: training load > critical patterns > moderate patterns > zone matrix
// Every message should be actionable coach-speak with a concrete recommendation.

type ScoreZone = 'peak' | 'good' | 'moderate' | 'low';
type TrendDir  = 'up' | 'flat' | 'down';

function scoreZone(score: number): ScoreZone {
  if (score >= 80) return 'peak';
  if (score >= 65) return 'good';
  if (score >= 48) return 'moderate';
  return 'low';
}

function trendDir(diff: number): TrendDir {
  if (diff >= 4)  return 'up';
  if (diff <= -4) return 'down';
  return 'flat';
}

/**
 * Rich no-signal message matrix: [zone][trend][daysAhead - 1]
 * Used when no patterns fire and no strong training load signal exists.
 * Index 0 = day 1 (tomorrow), 1 = day 2, 2 = day 3.
 */
const NO_SIGNAL: Record<ScoreZone, Record<TrendDir, [string, string, string]>> = {
  peak: {
    up:   [
      'Form building into peak territory — ideal for threshold or race-pace work',
      'Readiness climbing — press the advantage with your hardest session of the week',
      'Sustained high form ahead — plan your priority session for day 3',
    ],
    flat: [
      'Peak readiness maintained — load can stay high; quality over volume today',
      'Top-form plateau — optimal window for a second quality session this week',
      'Consistent peak form — strong week still ahead, keep the rhythm going',
    ],
    down: [
      'Small dip from peak — still well in the green; hard effort is fine',
      'Normal post-quality regression — body cycling through adaptation',
      'Gradual tapering from peak — recovery will consolidate gains; stay patient',
    ],
  },
  good: {
    up:   [
      'Readiness building — solid conditions for a quality session today',
      'Trajectory pointing up — progressive overload will pay dividends now',
      'Form climbing toward prime range — plan your biggest session for day 3',
    ],
    flat: [
      'Solid, stable readiness — execute your planned session without adjustments',
      'Good-form plateau — maintain current training load; no need to change course',
      'Consistent good readiness — week is on track; add volume before intensity',
    ],
    down: [
      'Slight softening from good base — scale intensity back 10–15% today',
      'Readiness easing — stick to aerobic base work; avoid intensity spikes',
      'Continued softening — protect sleep and dial back session volume slightly',
    ],
  },
  moderate: {
    up:   [
      'Moderate but improving — favour shorter quality work over long volume today',
      'Readiness trending up — build load carefully; body is responding',
      'Recovery building — by day 3 you should be ready for a proper training block',
    ],
    flat: [
      'Mid-range plateau — maintenance work only; avoid overreaching right now',
      'Holding in mid-range — keep sessions at 70–75% of normal intensity',
      'Stable moderate form — watch for fatigue signals before adding any new load',
    ],
    down: [
      'Continued dip — active recovery or a full rest day will serve you better',
      'Readiness sliding — protect sleep above all else; push hard sessions back',
      'Extended moderate-low range — a full deload day is the smart play',
    ],
  },
  low: {
    up:   [
      'Low but turning — light movement only; don\'t rush the recovery process',
      'Readiness starting to lift — one more easy day before resuming any load',
      'Recovery taking hold — stay patient; gains come after the rest, not during',
    ],
    flat: [
      'Persistent low readiness — rest and nutrition are the training today',
      'No improvement yet — full rest or very light movement only (walk, stretch)',
      'Extended low period — sleep, hydration, and zero intensity; body needs time',
    ],
    down: [
      'Deep fatigue territory — rest is the only high-value option right now',
      'Compounding fatigue — skip all sessions; the cost of training now is high',
      'Prolonged low readiness — consider whether illness or overtraining is a factor',
    ],
  },
};

function deriveKeyFactor(
  daysAhead: number,
  score:     number,
  diff:      number,
  patterns:  PatternInsight[],
  workload:  WorkloadResult | null,
): string {
  const p   = new Set(patterns.map(p => p.type));
  const idx = daysAhead - 1; // 0, 1, or 2

  // ── Training load (dominant near-term driver) ─────────────────────────────
  if (workload?.isHighLoad) {
    return [
      'DOMS peak — active recovery only; a hard session now deepens fatigue',
      'Training stress clearing — readiness recovering; easy movement is fine',
      'Full recovery expected by day 3 — ready to rebuild training load',
    ][idx];
  }
  if (workload && workload.dailyLoad > 20 && !workload.isHighLoad) {
    return [
      `Moderate load yesterday (${workload.dailyLoad}/100) — sub-maximal effort today`,
      'Training residue easing — readiness recovering toward normal range',
      'Load cleared — recovery on track; resume normal training intensity',
    ][idx];
  }

  // ── Negative patterns ─────────────────────────────────────────────────────
  if (p.has('persistent_low')) {
    return [
      'Extended low readiness — a full deload week is likely overdue; rest now',
      'Slow recovery — prioritise 8+ hours of sleep and caloric sufficiency',
      'Readiness rebuilding gradually — resist the urge to return to full load',
    ][idx];
  }

  if (p.has('consecutive_hrv_drop')) {
    return [
      'HRV declining 3 days straight — protect sleep tonight, skip all intensity',
      'HRV recovery in progress — light aerobic activity only, no strength work',
      diff > 0
        ? 'HRV stabilising — recovery on track; easy sessions are fine now'
        : 'HRV still catching up — another easy day before resuming load',
    ][idx];
  }

  if (p.has('consecutive_score_decline') && diff < -3) {
    return [
      'Fatigue compounding for 3 days — a rest day now prevents a longer setback',
      'Recovery beginning — keep intensity low; aerobic base work only',
      diff > 0
        ? 'Trend reversing — readiness recovering; easy session is fine'
        : 'Decline continuing — extend the recovery window another day',
    ][idx];
  }

  if (p.has('sleep_debt') && diff < 3) {
    return [
      'Sleep debt compounding — an early night is the single best training tool now',
      'Sleep recovery takes time — consistent sleep schedule will unlock improvement',
      diff > 2
        ? 'Sleep rebounding — readiness will follow; quality session possible day 3'
        : 'Sleep debt still showing — protect sleep over any training decision',
    ][idx];
  }

  if (p.has('stress_accumulation') && diff < 4) {
    return [
      'Stress load carrying forward — today is a recovery window, not a training one',
      'Autonomic stress easing — body adapting; light aerobic work is fine',
      diff > 2
        ? 'Stress signals clearing — green light to resume moderate training'
        : 'Stress accumulation ongoing — high intensity still not advised',
    ][idx];
  }

  // ── Positive patterns ─────────────────────────────────────────────────────
  if (p.has('recovery_rebound') && diff > 3) {
    return [
      'Recovery rebound underway — excellent window for a quality session today',
      'Momentum building — training load can increase; body is responding well',
      'Strong recovery window sustained — green light to push your hardest effort',
    ][idx];
  }

  if (p.has('hrv_improving') && diff > 2) {
    return [
      'HRV climbing — green light for harder efforts; autonomic system is primed',
      'HRV trend strong — adaptation in full swing; progressive load recommended',
      'HRV at a seasonal high — capitalise with your most demanding training day',
    ][idx];
  }

  // ── No strong signal — use zone × trend matrix ────────────────────────────
  return NO_SIGNAL[scoreZone(score)][trendDir(diff)][idx];
}
