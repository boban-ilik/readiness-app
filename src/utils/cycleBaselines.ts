/**
 * Cycle-phase personal baselines.
 *
 * HRV tends to dip and resting heart rate tends to rise in the luteal phase.
 * Compared with an all-month baseline, that normal change reads as poor
 * recovery. Once a user has logged at least two complete cycles, the score
 * compares today's HRV and resting HR with their own values from the same
 * phase of earlier cycles instead.
 *
 * Rules (each is shown to the user on the "How today's score was calculated"
 * screen):
 *   - Only days inside complete cycles (between two logged period starts,
 *     15 to 60 days apart) are labelled, so every past day's phase uses that
 *     cycle's real length.
 *   - At least MIN_COMPLETED_CYCLES complete cycles are needed.
 *   - A phase baseline needs at least MIN_PHASE_SAMPLES days in today's phase;
 *     HRV and resting HR qualify independently.
 *   - Phase baselines use the same trimmed median as the all-month baselines.
 *   - The correction is bounded (HRV within ±25%, resting HR within ±8 bpm of
 *     the all-month baseline) so a few odd nights can't swing the score.
 */

import { computeHRVBaseline, computeRHRBaseline } from './index';
import { phaseForDay, type CyclePhase } from './cyclePhase';

export const MIN_COMPLETED_CYCLES = 2;
export const MIN_PHASE_SAMPLES    = 5;
const MIN_CYCLE_DAYS = 15;
const MAX_CYCLE_DAYS = 60;
const HRV_MAX_RATIO  = 0.25;
const RHR_MAX_DELTA  = 8;

export interface PhaseBaselineInput {
  /** YYYY-MM-DD → nightly HRV (ms) */
  hrvByDay:         Record<string, number>;
  /** YYYY-MM-DD → resting HR (bpm) */
  rhrByDay:         Record<string, number>;
  /** Period start dates, YYYY-MM-DD, any order */
  periodStarts:     string[];
  /** Today's phase (from the cycle card), null when unknown */
  todayPhase:       CyclePhase | null;
  periodLengthDays: number;
  /** All-month baselines the correction is bounded against */
  hrvBaseline:      number;
  rhrBaseline:      number;
}

export interface PhaseBaselineResult {
  status:          'active' | 'collecting';
  phase:           CyclePhase | null;
  completedCycles: number;
  hrvSamples:      number;
  rhrSamples:      number;
  /** Phase baseline used for scoring, or null when this signal isn't ready */
  hrv:             number | null;
  rhr:             number | null;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** Phase of every day that falls inside a complete cycle. */
export function labelDaysByPhase(periodStarts: string[], periodLengthDays: number): {
  phaseByDay: Record<number, CyclePhase>;
  completedCycles: number;
} {
  const starts = [...new Set(periodStarts.map(s => s.slice(0, 10)))].map(dayNumber).sort((a, b) => a - b);
  const phaseByDay: Record<number, CyclePhase> = {};
  let completedCycles = 0;

  for (let i = 0; i + 1 < starts.length; i++) {
    const length = starts[i + 1] - starts[i];
    if (length < MIN_CYCLE_DAYS || length > MAX_CYCLE_DAYS) continue; // a missed or duplicate log
    completedCycles++;
    for (let day = 0; day < length; day++) {
      phaseByDay[starts[i] + day] = phaseForDay(day + 1, length, periodLengthDays);
    }
  }
  return { phaseByDay, completedCycles };
}

export function computePhaseBaselines(input: PhaseBaselineInput): PhaseBaselineResult {
  const { phaseByDay, completedCycles } = labelDaysByPhase(input.periodStarts, input.periodLengthDays);
  const phase = input.todayPhase;

  const inPhase = (byDay: Record<string, number>) =>
    phase === null ? [] :
    Object.entries(byDay)
      .filter(([date, v]) => Number.isFinite(v) && phaseByDay[dayNumber(date)] === phase)
      .map(([, v]) => v);

  const hrvValues = inPhase(input.hrvByDay);
  const rhrValues = inPhase(input.rhrByDay);

  const enoughCycles = completedCycles >= MIN_COMPLETED_CYCLES;
  const hrvReady = enoughCycles && hrvValues.length >= MIN_PHASE_SAMPLES;
  const rhrReady = enoughCycles && rhrValues.length >= MIN_PHASE_SAMPLES;

  const hrv = hrvReady
    ? Math.round(clamp(
        computeHRVBaseline(hrvValues, input.hrvBaseline, MIN_PHASE_SAMPLES),
        input.hrvBaseline * (1 - HRV_MAX_RATIO),
        input.hrvBaseline * (1 + HRV_MAX_RATIO),
      ))
    : null;
  const rhr = rhrReady
    ? Math.round(clamp(
        computeRHRBaseline(rhrValues, input.rhrBaseline, MIN_PHASE_SAMPLES),
        input.rhrBaseline - RHR_MAX_DELTA,
        input.rhrBaseline + RHR_MAX_DELTA,
      ))
    : null;

  return {
    status: hrv !== null || rhr !== null ? 'active' : 'collecting',
    phase,
    completedCycles,
    hrvSamples: hrvValues.length,
    rhrSamples: rhrValues.length,
    hrv,
    rhr,
  };
}
