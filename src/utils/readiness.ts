/**
 * Readiness Score Algorithm
 *
 * Score = (Recovery × 0.45) + (Sleep × 0.40) + (Stress × 0.15)
 *
 * Each component is scored 0–100, then weighted and summed.
 * Lifestyle modifiers (journal tags) are applied as final adjustments.
 */

import { clamp } from '@utils/index';
import type { HealthData, ReadinessScore } from '@types/index';

// ─── Baseline defaults (used when no personal baseline is established yet) ────

const DEFAULTS = {
  HRV_BASELINE: 55,       // ms — population average
  HRV_SD: 15,             // standard deviation
  RHR_BASELINE: 60,       // bpm
  OPTIMAL_SLEEP: 480,     // minutes (8h)
  MIN_SLEEP: 300,         // minutes (5h) — floor for scoring
  OPTIMAL_DEEP_PCT: 0.20, // 20% of total sleep
  OPTIMAL_REM_PCT: 0.25,  // 25% of total sleep
};

// ─── Recovery component (45%) ─────────────────────────────────────────────────

function scoreRecovery(
  hrv: number | null,
  rhr: number | null,
  hrvBaseline = DEFAULTS.HRV_BASELINE,
  rhrBaseline = DEFAULTS.RHR_BASELINE
): number {
  const scores: number[] = [];

  if (hrv !== null) {
    // HRV score: deviation from personal baseline, normalised
    // Higher HRV than baseline → better recovery
    const zScore = (hrv - hrvBaseline) / DEFAULTS.HRV_SD;
    const hrvScore = clamp(50 + zScore * 20, 0, 100);
    scores.push(hrvScore);
  }

  if (rhr !== null) {
    // RHR score: lower than baseline → better recovery
    const rhrDelta = rhrBaseline - rhr; // positive = lower than baseline = good
    const rhrScore = clamp(50 + rhrDelta * 3, 0, 100);
    scores.push(rhrScore);
  }

  if (scores.length === 0) return 50; // neutral when no data

  // Weight HRV more heavily than RHR (60/40 within recovery component)
  if (scores.length === 2) {
    return clamp(scores[0] * 0.6 + scores[1] * 0.4, 0, 100);
  }
  return scores[0];
}

// ─── Sleep component (40%) ────────────────────────────────────────────────────

function scoreSleep(
  duration: number | null,
  deep: number | null,
  rem: number | null,
  efficiency: number | null
): number {
  if (duration === null) return 50;

  // Duration score (50% of sleep component)
  const durationScore = duration >= DEFAULTS.OPTIMAL_SLEEP
    ? 100
    : clamp((duration / DEFAULTS.OPTIMAL_SLEEP) * 100, 0, 100);

  const subScores = [durationScore];

  // Deep sleep score (20% of sleep component)
  if (deep !== null && duration > 0) {
    const deepPct = deep / duration;
    const deepScore = clamp((deepPct / DEFAULTS.OPTIMAL_DEEP_PCT) * 80, 0, 100);
    subScores.push(deepScore);
  }

  // REM score (20% of sleep component)
  if (rem !== null && duration > 0) {
    const remPct = rem / duration;
    const remScore = clamp((remPct / DEFAULTS.OPTIMAL_REM_PCT) * 80, 0, 100);
    subScores.push(remScore);
  }

  // Efficiency score (10% of sleep component)
  if (efficiency !== null) {
    const effScore = clamp((efficiency / 85) * 80, 0, 100);
    subScores.push(effScore);
  }

  return clamp(subScores.reduce((a, b) => a + b, 0) / subScores.length, 0, 100);
}

// ─── Stress component (15%) ───────────────────────────────────────────────────

function scoreStress(
  stressScore:  number | null,
  hrv:          number | null,
  daytimeAvgHR: number | null,
  rhrBaseline:  number,
  hrvBaseline = DEFAULTS.HRV_BASELINE,
): number {
  // Tier 1: Garmin proprietary stress score (0 = calm, 100 = high stress)
  if (stressScore !== null) {
    return clamp(100 - stressScore, 0, 100);
  }

  // Tier 2: HRV SDNN proxy — Apple Watch or Garmin (when it syncs)
  if (hrv !== null) {
    const zScore = (hrv - hrvBaseline) / DEFAULTS.HRV_SD;
    return clamp(50 + zScore * 15, 0, 100);
  }

  // Tier 3: Daytime HR elevation proxy — works with any device that syncs HR
  // to Apple Health (including Garmin). An elevated average HR during waking
  // rest periods above the personal RHR baseline signals physiological stress.
  if (daytimeAvgHR !== null && rhrBaseline > 0) {
    const elevation = daytimeAvgHR - rhrBaseline;
    // elevation ≤ 3 bpm → low stress  (~80)
    // elevation 3–8 bpm → typical     (~60)
    // elevation 8–15 bpm → moderate   (~45)
    // elevation > 15 bpm → elevated   (~30)
    return clamp(75 - elevation * 3, 20, 90);
  }

  return 50; // neutral — no stress signal at all
}

// ─── Data quality ─────────────────────────────────────────────────────────────

export type DataConfidence = 'high' | 'medium' | 'low';

export interface DataQuality {
  hasHRV:         boolean;
  hasRHR:         boolean;
  hasSleep:       boolean;
  confidence:     DataConfidence;
  /** Human-readable list of absent sensors, e.g. ['HRV', 'sleep'] */
  missingSignals: string[];
  /** One-line message shown in the confidence banner. Null when confidence is high. */
  warningMessage: string | null;
}

function assessDataQuality(data: HealthData): DataQuality {
  const hasHRV   = data.hrv !== null;
  const hasRHR   = data.restingHeartRate !== null;
  const hasSleep = data.sleepDuration !== null;

  const missingSignals: string[] = [];
  if (!hasHRV)   missingSignals.push('HRV');
  if (!hasRHR)   missingSignals.push('resting heart rate');
  if (!hasSleep) missingSignals.push('sleep');

  // Confidence tiers:
  //   high   — HRV (primary recovery signal) + sleep both present
  //   medium — one recovery signal OR sleep present, but not both
  //   low    — no Apple Watch data at all (all signals defaulted to 50)
  let confidence: DataConfidence;
  if (hasHRV && hasSleep) {
    confidence = 'high';
  } else if ((hasHRV || hasRHR) && hasSleep) {
    confidence = 'medium';
  } else if (hasSleep || hasHRV || hasRHR) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  let warningMessage: string | null = null;
  if (confidence === 'low') {
    warningMessage = 'No Apple Watch data detected — score is estimated. Wear your watch overnight for accurate results.';
  } else if (confidence === 'medium') {
    if (!hasHRV && !hasRHR) {
      warningMessage = 'Sleep detected, but no heart rate data — wear your Apple Watch snugly overnight for HRV tracking.';
    } else if (!hasSleep) {
      warningMessage = 'Heart rate tracked, but sleep wasn\'t detected — wearing your watch to bed improves accuracy.';
    } else if (!hasHRV) {
      warningMessage = 'HRV not detected — ensure your Apple Watch fits snugly and is worn during sleep.';
    }
  }

  return { hasHRV, hasRHR, hasSleep, confidence, missingSignals, warningMessage };
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export interface ReadinessResult {
  score: number;
  components: {
    recovery: number;
    sleep: number;
    stress: number;
  };
  healthData:  HealthData;
  dataQuality: DataQuality;
}

export function calculateReadiness(
  healthData: HealthData,
  hrvBaseline?: number,
  rhrBaseline?: number
): ReadinessResult {
  const recovery = scoreRecovery(
    healthData.hrv,
    healthData.restingHeartRate,
    hrvBaseline,
    rhrBaseline
  );

  const sleep = scoreSleep(
    healthData.sleepDuration,
    healthData.deepSleep,
    healthData.remSleep,
    healthData.sleepEfficiency
  );

  const stress = scoreStress(
    healthData.stressScore,
    healthData.hrv,
    healthData.daytimeAvgHR ?? null,
    rhrBaseline ?? DEFAULTS.RHR_BASELINE,
    hrvBaseline,
  );

  const rawScore = recovery * 0.45 + sleep * 0.40 + stress * 0.15;
  const score = Math.round(clamp(rawScore, 0, 100));

  return {
    score,
    components: {
      recovery: Math.round(recovery),
      sleep: Math.round(sleep),
      stress: Math.round(stress),
    },
    healthData,
    dataQuality: assessDataQuality(healthData),
  };
}
