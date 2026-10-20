/**
 * getNutritionRecommendation
 *
 * Generates a data-driven nutrition plan based on:
 *   - Today's overall readiness score
 *   - HRV vs personal baseline
 *   - Sleep duration and quality
 *   - Recovery & stress sub-scores
 *
 * No external API calls — fully deterministic so it works offline.
 */

import { baselinePhrase, type ReadinessResult } from '@utils/readiness';
import type { HealthData }       from '@/types/index';

// ─── Output type ──────────────────────────────────────────────────────────────

export interface NutritionRecommendation {
  /** Short headline, e.g. "Performance fuel" */
  headline:     string;
  /** One-line context sentence */
  context:      string;
  /** Accent colour matching readiness tier */
  color:        string;
  /** Today's water amount, e.g. "3 l" or "2.5–3 L" */
  hydration:    string;
  /** 3–4 short lines to act on, shown on the card. The rest sits behind "Why?" */
  actions:      string[];
  /** Daily protein range, scaled to bodyweight. Null when no weight is on file. */
  protein:      string | null;
  /** Foods to favour today (plain food suggestions, no health claims) */
  prioritise:   string[];
  /** Things to go easy on today */
  moderate:     string[];
  /** Meal timing tip */
  timing:       string;
  /** Short rationale (why these choices) */
  rationale:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Hydration and protein are the two recommendations here that genuinely scale
 * with body size, so a flat "2.5–3 L" is wrong at both ends of the range — the
 * same target is generous for a 55 kg person and short for a 105 kg one.
 *
 * Protein uses g/kg, the standard way the sports-nutrition literature expresses
 * it. Hydration uses ml/kg, which is a rule of thumb rather than a firm
 * requirement, so it is presented as a target to aim at, not a prescription.
 *
 * Returns null when no weight is on file — callers keep their generic copy.
 */
function weightTargets(weightKg: number | undefined, tier: 'A' | 'B' | 'C') {
  if (!weightKg || weightKg <= 0) return null;

  const mlPerKg  = tier === 'A' ? 40  : tier === 'C' ? 36  : 33;
  const [lo, hi] = tier === 'A' ? [1.8, 2.2]
                 : tier === 'C' ? [1.8, 2.0]
                 :                [1.6, 1.8];

  return {
    litres:    Math.round((weightKg * mlPerKg) / 100) / 10,   // one decimal place
    proteinLo: Math.round((weightKg * lo) / 5) * 5,           // nearest 5 g
    proteinHi: Math.round((weightKg * hi) / 5) * 5,
  };
}

function proteinLine(t: ReturnType<typeof weightTargets>): string | null {
  return t ? `${t.proteinLo}–${t.proteinHi} g across the day` : null;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function getNutritionRecommendation(
  score:       number,
  components:  ReadinessResult['components'],
  healthData:  HealthData | null,
  hrvBaseline: number,
  weightKg?:   number,
  /** The user's own Hydration target, already formatted ("3 l", "101 fl oz"). When set it replaces the
   *  bodyweight estimate so the card never shows a second, different water number. */
  waterTarget?: string,
): NutritionRecommendation {

  const hrv          = healthData?.hrv          ?? null;
  const sleepMins    = healthData?.sleepDuration ?? null;
  const sleepH       = sleepMins !== null ? sleepMins / 60 : null;
  const deepSleepMin = healthData?.deepSleep     ?? null;

  // ── Derived signals ──────────────────────────────────────────────────────────
  const clampedScore = clamp(score, 0, 100);

  // HRV delta from baseline (positive = above baseline = good)
  const hrvDelta = hrv !== null && hrvBaseline > 0
    ? Math.round(hrv - hrvBaseline)
    : null;

  // Sleep debt flag: < 6.5 h total OR deep sleep < 45 min
  const hasSleepDebt =
    (sleepH !== null && sleepH < 6.5) ||
    (deepSleepMin !== null && deepSleepMin < 45);

  // High-stress flag: stress sub-score < 45
  const highStress = components.stress < 45;

  // ── Tier decision ────────────────────────────────────────────────────────────
  // Tier A  (score ≥ 75) — Performance day
  // Tier B  (score 50–74) — Maintenance / steady
  // Tier C  (score < 50)  — Recovery priority
  //
  // Wording rule: plain, checkable advice. No mechanisms ("anti-inflammatory",
  // "gut integrity", "cortisol is lower at lunch") that the app can't source,
  // and the rationale states only the user's own numbers.

  const hrvLine = hrv !== null && hrvDelta !== null
    ? `HRV ${hrv} ms, ${hrvDelta >= 0 ? '+' : ''}${hrvDelta} vs ${baselinePhrase('hrv', hrvBaseline)}.`
    : '';
  const sleepLine = sleepH !== null ? `${sleepH.toFixed(1)} h of sleep last night.` : '';

  if (clampedScore >= 75) {
    // ── Tier A — Performance fuelling ─────────────────────────────────────────
    const targets   = weightTargets(weightKg, 'A');
    const hydration = waterTarget ?? (targets ? `${targets.litres} L` : '2.5–3 L');
    const protein   = proteinLine(targets);

    return {
      headline:  'Fuel for performance',
      context:   'You are well recovered. Eat to train.',
      color:     '#4ADE80',
      hydration,
      actions: [
        `Water: ${hydration}`,
        protein ? `Protein: ${protein}` : 'Protein at every meal',
        'Carbs before and after training',
        'Electrolytes if training over 60 min',
      ],
      protein,
      prioritise: [
        'Carbs: oats, sweet potato, rice',
        'Lean protein: chicken, eggs, Greek yoghurt',
        'Vegetables and fruit',
      ],
      moderate: ['Heavy, fatty meals in the 2 h before training'],
      timing:   'A carb-based meal 2 to 3 h before training, and protein with carbs after.',
      rationale: [`Readiness ${score}, in the performance range.`, hrvLine, sleepLine].filter(Boolean).join(' '),
    };
  }

  if (clampedScore >= 50) {
    // ── Tier B — Maintenance / steady ─────────────────────────────────────────
    const targets   = weightTargets(weightKg, 'B');
    const hydration = waterTarget ?? (targets ? `${targets.litres} L` : hasSleepDebt ? '2.5 L' : '2–2.5 L');
    const protein   = proteinLine(targets);

    return {
      headline:  'Steady and balanced',
      context:   'A normal day. Eat well, no special fuelling.',
      color:     '#FBBF24',
      hydration,
      actions: [
        `Water: ${hydration}`,
        protein ? `Protein: ${protein}` : 'Protein at every meal',
        hasSleepDebt ? 'No caffeine after 2 pm' : 'Three balanced meals',
        'Keep alcohol minimal tonight',
      ],
      protein,
      prioritise: [
        'Lean protein at every meal',
        'Oily fish, walnuts or flaxseed',
        'Vegetables, nuts and seeds',
      ],
      moderate: [
        'Caffeine after 2 pm',
        'Alcohol tonight',
      ],
      timing: highStress
        ? 'On a busy or stressful day, plan your meals so you do not skip them.'
        : 'Three balanced meals and a snack if you need one. No need to time carbs today.',
      rationale: [`Readiness ${score}, a steady day.`, hrvLine, sleepLine].filter(Boolean).join(' '),
    };
  }

  // ── Tier C — Recovery priority (score < 50) ─────────────────────────────────
  const targetsC  = weightTargets(weightKg, 'C');
  const hydration = waterTarget ?? (targetsC ? `${targetsC.litres} L` : '2.5–3 L');
  const protein   = proteinLine(targetsC);

  return {
    headline:  'Eat for recovery',
    context:   'A low day. Simple meals, enough protein, no alcohol.',
    color:     '#F87171',
    hydration,
    actions: [
      `Water: ${hydration}`,
      protein ? `Protein: ${protein}` : 'Protein at every meal',
      'Skip alcohol tonight',
      'Finish dinner 2–3 h before bed',
    ],
    protein,
    prioritise: [
      'Protein at every meal',
      'Oily fish or walnuts',
      'Leafy greens and vegetables',
    ],
    moderate: [
      'Alcohol tonight',
      'Sugary and ultra-processed snacks',
      'Caffeine after noon',
    ],
    timing:    'Keep dinner lighter and finish eating 2 to 3 h before bed.',
    rationale: [`Readiness ${score}, a recovery day.`, hrvLine, sleepLine].filter(Boolean).join(' '),
  };
}
