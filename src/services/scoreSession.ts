/**
 * The most recent score and the working behind it, kept in memory so the
 * "How today's score was calculated" screen shows exactly what Today used
 * without a second HealthKit fetch.
 */

import type { ReadinessResult, ScoreExplanation } from '@utils/readiness';
import type { PhaseBaselineResult } from '@utils/cycleBaselines';

export interface ScoreSnapshot {
  readiness:   ReadinessResult;
  explanation: ScoreExplanation;
  /** Baselines the score used (phase baselines when the cycle correction is active) */
  hrvBaseline: number;
  rhrBaseline: number;
  /** All-month personal baselines */
  hrvBaselineAllMonth: number;
  rhrBaselineAllMonth: number;
  /** null when cycle tracking is off */
  cycle:       PhaseBaselineResult | null;
  /** Score with the all-month baselines, set only when the cycle correction changed the inputs */
  uncorrectedScore: number | null;
  computedAt:  number;
}

let latest: ScoreSnapshot | null = null;
const listeners = new Set<(s: ScoreSnapshot | null) => void>();

export function setScoreSnapshot(s: ScoreSnapshot | null): void {
  latest = s;
  listeners.forEach(l => l(s));
}

export function getScoreSnapshot(): ScoreSnapshot | null {
  return latest;
}

export function subscribeScoreSnapshot(l: (s: ScoreSnapshot | null) => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
