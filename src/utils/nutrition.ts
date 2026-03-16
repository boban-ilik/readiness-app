/**
 * getNutritionRecommendation
 *
 * Generates a data-driven nutrition plan based on:
 *   - Today's overall readiness score
 *   - HRV vs personal baseline (recovery / inflammation signal)
 *   - Sleep duration and quality
 *   - Recovery & stress sub-scores
 *
 * No external API calls — fully deterministic so it works offline.
 */

import type { ReadinessResult } from '@utils/readiness';
import type { HealthData }       from '@types/index';

// ─── Output type ──────────────────────────────────────────────────────────────

export interface NutritionRecommendation {
  /** Short headline, e.g. "Performance fuel" */
  headline:     string;
  /** One-line context sentence */
  context:      string;
  /** Accent colour matching readiness tier */
  color:        string;
  /** Hydration target */
  hydration:    string;
  /** 2–4 key foods to prioritise today */
  prioritise:   string[];
  /** 1–2 things to moderate today */
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

// ─── Main function ────────────────────────────────────────────────────────────

export function getNutritionRecommendation(
  score:       number,
  components:  ReadinessResult['components'],
  healthData:  HealthData | null,
  hrvBaseline: number,
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

  // Inflammation flag: HRV ≥ 15% below baseline OR recovery score < 45
  const hasInflammation =
    (hrvDelta !== null && hrv !== null && hrv < hrvBaseline * 0.85) ||
    components.recovery < 45;

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

  if (clampedScore >= 75) {
    // ── Tier A — Performance fuelling ─────────────────────────────────────────
    const hydration = 'Target 2.5–3 L today. Add electrolytes if training > 60 min.';

    const prioritise = [
      'Complex carbs — oats, sweet potato, brown rice (fuel for hard work)',
      'Lean protein — chicken, eggs, Greek yoghurt (muscle repair & satiety)',
      'Leafy greens & colourful veg (micronutrients for peak output)',
      'Berries or citrus — antioxidants to counter exercise-induced oxidative stress',
    ];

    const moderate = [
      'Avoid heavy fats in the 2 h before your main session (slows gastric emptying)',
    ];

    const timing = hrv !== null && hrvDelta !== null && hrvDelta > 5
      ? 'HRV is above your baseline — carb timing is flexible. A bigger carb meal 2–3 h pre-workout and a protein + carb snack within 30 min post works well.'
      : 'Eat a balanced breakfast within 60 min of waking. Front-load carbs around your training window.';

    const rationale = [
      `Readiness ${score} puts you in the performance tier.`,
      hrv !== null
        ? `HRV ${hrv} ms (${hrvDelta !== null && hrvDelta >= 0 ? '+' : ''}${hrvDelta ?? '—'} vs your ${hrvBaseline} ms baseline) confirms low systemic stress.`
        : '',
      sleepH !== null
        ? `You got ${sleepH.toFixed(1)} h sleep — ${sleepH >= 7 ? 'solid recovery base.' : 'slightly short, so lean into protein and anti-oxidants.'}`
        : '',
    ].filter(Boolean).join(' ');

    return {
      headline:  'Performance fuel',
      context:   'Your body is well-recovered — eat to perform.',
      color:     '#4ADE80',
      hydration,
      prioritise,
      moderate,
      timing,
      rationale,
    };
  }

  if (clampedScore >= 50) {
    // ── Tier B — Maintenance / steady ─────────────────────────────────────────
    const hydration = hasSleepDebt
      ? 'Aim for 2.5 L. Prioritise water before coffee — dehydration amplifies fatigue from poor sleep.'
      : 'Aim for 2–2.5 L. Steady sips throughout the day.';

    const prioritise: string[] = [
      'Lean protein at every meal — helps blunt cortisol rise during moderate stress',
      'Omega-3 rich foods — salmon, walnuts, flaxseed (supports HRV recovery)',
      'Magnesium-rich foods — pumpkin seeds, dark chocolate, spinach (sleep quality)',
    ];
    if (hasSleepDebt) {
      prioritise.push('Tart cherry juice or kiwi in the evening (natural melatonin support)');
    }
    if (hasInflammation) {
      prioritise.push('Turmeric + black pepper, ginger, or tart cherries (anti-inflammatory)');
    }

    const moderate = [
      'Limit caffeine after 2 pm — especially if sleep was short last night',
      hasInflammation ? 'Reduce refined sugar and ultra-processed foods today' : 'Keep alcohol minimal — even one drink blunts HRV recovery overnight',
    ].filter(Boolean) as string[];

    const timing = highStress
      ? 'Stress hormones suppress appetite — set a reminder to eat balanced meals even if you\'re not hungry. Skipping meals compounds cortisol.'
      : 'Three balanced meals with one optional snack. No need to time carbs tightly today.';

    const rationale = [
      `Readiness ${score} — steady day, not a peak.`,
      hrv !== null
        ? `HRV ${hrv} ms (${hrvDelta !== null && hrvDelta >= 0 ? '+' : ''}${hrvDelta ?? '—'} vs baseline) — ${hasInflammation ? 'below baseline, prioritise anti-inflammatory foods.' : 'close to baseline.'}`
        : '',
      hasSleepDebt ? `Sleep was short (${sleepH?.toFixed(1)} h) — magnesium and omega-3s help bridge the gap.` : '',
    ].filter(Boolean).join(' ');

    return {
      headline:  'Steady & balanced',
      context:   'Support recovery without over-fuelling.',
      color:     '#FBBF24',
      hydration,
      prioritise,
      moderate,
      timing,
      rationale,
    };
  }

  // ── Tier C — Recovery priority (score < 50) ─────────────────────────────────
  const hydration = 'Prioritise hydration — aim for 2.5–3 L. Add a pinch of sea salt to water if you feel sluggish.';

  const prioritise: string[] = [
    'Omega-3s — fatty fish (salmon, sardines), walnuts (reduce systemic inflammation)',
    'Bone broth or collagen-rich foods (gut integrity under high-stress days)',
    'Dark leafy greens — spinach, kale (magnesium, folate, antioxidants)',
    'Quality protein at every meal to preserve muscle during low-activity recovery',
  ];

  if (hasSleepDebt) {
    prioritise.push('Tart cherry or kiwi before bed — shown to increase sleep efficiency and duration');
  }

  const moderate = [
    'Avoid alcohol completely — it suppresses deep sleep and lowers HRV by 10–15 ms',
    'Cut back on refined sugar and ultra-processed snacks — they spike inflammation markers',
    'Keep caffeine to 1–2 cups before noon only',
  ];

  const timing = 'Eat your largest meal at lunch when cortisol is naturally lower. Keep dinner lighter and finish eating 2–3 h before bed to protect deep sleep.';

  const rationale = [
    `Readiness ${score} — your body is asking for a recovery day.`,
    hrv !== null
      ? `HRV ${hrv} ms is ${Math.round(Math.abs((hrvDelta ?? 0)))} ms ${(hrvDelta ?? 0) < 0 ? 'below' : 'above'} your ${hrvBaseline} ms baseline — ${hasInflammation ? 'inflammation or systemic stress is elevated.' : 'recovery is in progress.'}`
      : 'No HRV data — eating for recovery is the safe default.',
    sleepH !== null
      ? `${sleepH.toFixed(1)} h sleep last night — nutrition can help compensate for poor recovery.`
      : '',
  ].filter(Boolean).join(' ');

  return {
    headline:  'Recovery nutrition',
    context:   'Your HRV and sleep signal your body needs support today.',
    color:     '#F87171',
    hydration,
    prioritise,
    moderate,
    timing,
    rationale,
  };
}
