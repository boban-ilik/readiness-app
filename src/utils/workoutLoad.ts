/**
 * Workout Load Classifier
 *
 * Takes an array of RawWorkout samples from Apple Health (written by Garmin,
 * Strava, Apple Watch, or any other HealthKit source) and classifies them into
 * a LoadSummary that the rest of the app can use for:
 *   - Contextual coaching ("HRV suppression expected after yesterday's heavy lift")
 *   - Readiness score adjustment notes
 *   - The WorkoutContextBanner on the home screen
 *   - Strava activity enrichment (Phase 2)
 */

import type { RawWorkout } from '@services/healthkit';

// ─── Sport category mapping ───────────────────────────────────────────────────

export type SportCategory =
  | 'strength'   // Barbell, functional, CrossFit, circuit
  | 'hiit'       // HIIT, cross-training, boxing, plyometrics
  | 'cardio'     // Running, cycling, swimming, rowing
  | 'sport'      // Soccer, basketball, tennis, etc.
  | 'low'        // Walking, yoga, pilates, mobility
  | 'other';

export type LoadTier =
  | 'none'
  | 'light'      // < 200 kcal or < 25 min
  | 'moderate'   // 200–400 kcal or 25–50 min cardio
  | 'heavy'      // 400–600 kcal or 50–75 min intense
  | 'peak';      // > 600 kcal or > 75 min intense

export interface WorkoutEntry {
  activityName: string;
  category:     SportCategory;
  durationMins: number;
  calories:     number | null;
  startDate:    string;
}

export interface WorkoutLoadSummary {
  entries:          WorkoutEntry[];
  totalMinutes:     number;
  totalCalories:    number | null;
  primaryCategory:  SportCategory;
  loadTier:         LoadTier;
  /** Short display label, e.g. "Strength · 65 min · Heavy" */
  label:            string;
  /** Whether this load level is likely to suppress tomorrow's HRV */
  hrSuppression:    boolean;
  /** Plain-English context note for the coach / banner */
  contextNote:      string;
}

// ─── Keyword → category map ───────────────────────────────────────────────────

const STRENGTH_KEYWORDS = [
  'strength', 'weight', 'functional', 'crossfit', 'cross fit',
  'powerlifting', 'bodybuilding', 'circuit', 'kettlebell',
];
const HIIT_KEYWORDS = [
  'hiit', 'high intensity', 'cross training', 'plyometric',
  'boxing', 'kickboxing', 'boot camp', 'bootcamp',
];
const CARDIO_KEYWORDS = [
  'run', 'cycling', 'swim', 'row', 'stair', 'cardio',
  'elliptical', 'ski', 'skate', 'bike',
];
const SPORT_KEYWORDS = [
  'soccer', 'football', 'basketball', 'tennis', 'volleyball',
  'lacrosse', 'baseball', 'hockey', 'squash', 'badminton', 'padel',
  'rugby', 'cricket', 'golf',
];
const LOW_KEYWORDS = [
  'walk', 'yoga', 'pilates', 'stretch', 'mobility',
  'hike', 'hiking', 'dance', 'tai chi',
];

export function classifySport(activityName: string): SportCategory {
  const lower = activityName.toLowerCase();
  if (STRENGTH_KEYWORDS.some(k => lower.includes(k))) return 'strength';
  if (HIIT_KEYWORDS.some(k => lower.includes(k)))    return 'hiit';
  if (CARDIO_KEYWORDS.some(k => lower.includes(k)))  return 'cardio';
  if (SPORT_KEYWORDS.some(k => lower.includes(k)))   return 'sport';
  if (LOW_KEYWORDS.some(k => lower.includes(k)))     return 'low';
  return 'other';
}

// ─── Load tier calculation ────────────────────────────────────────────────────

/**
 * Computes a load tier from duration + calories + sport category.
 *
 * Strength and HIIT are up-weighted because they produce greater acute
 * training stress than equivalent-duration aerobic work.
 */
export function computeLoadTier(
  category:     SportCategory,
  durationMins: number,
  calories:     number | null,
): LoadTier {
  // Intensity multipliers — strength/HIIT cause more systemic stress per minute
  const multiplier = category === 'strength' || category === 'hiit' ? 1.4
                   : category === 'cardio'  || category === 'sport'  ? 1.0
                   : 0.5; // low / other

  const effectiveMins = durationMins * multiplier;
  const kcal = calories ?? 0;

  if (effectiveMins < 18 && kcal < 150) return 'light';
  if (effectiveMins < 36 && kcal < 280) return 'moderate';
  if (effectiveMins < 70 && kcal < 550) return 'heavy';
  return 'peak';
}

// ─── Sport display names ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SportCategory, string> = {
  strength: 'Strength',
  hiit:     'HIIT',
  cardio:   'Cardio',
  sport:    'Sport',
  low:      'Recovery',
  other:    'Workout',
};

// ─── Context note generator ───────────────────────────────────────────────────

function buildContextNote(
  tier:     LoadTier,
  category: SportCategory,
  hrSuppression: boolean,
): string {
  if (tier === 'none') return '';
  const sportLabel = CATEGORY_LABELS[category].toLowerCase();

  if (hrSuppression) {
    if (tier === 'peak') {
      return `Yesterday's intense ${sportLabel} session is suppressing today's HRV — this is a sign your body is adapting. Prioritise sleep and protein today.`;
    }
    return `Yesterday's ${sportLabel} load may be contributing to today's lower HRV. Normal adaptation — check in tomorrow.`;
  }
  if (tier === 'heavy') {
    return `Heavy ${sportLabel} session yesterday. If you feel sluggish today, your body is allocating resources to repair.`;
  }
  if (tier === 'moderate') {
    return `Moderate ${sportLabel} session yesterday. You should be recovered or close to it.`;
  }
  return `Light ${sportLabel} activity yesterday — minimal impact on today's readiness.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Builds a WorkoutLoadSummary from an array of RawWorkout samples.
 * Pass today's HRV and baseline to determine if HRV suppression is likely.
 */
export function buildWorkoutLoadSummary(
  workouts:    RawWorkout[],
  todayHrv:    number | null = null,
  hrvBaseline: number = 0,
): WorkoutLoadSummary {
  if (!workouts.length) {
    return {
      entries:         [],
      totalMinutes:    0,
      totalCalories:   null,
      primaryCategory: 'other',
      loadTier:        'none',
      label:           '',
      hrSuppression:   false,
      contextNote:     '',
    };
  }

  // Build enriched entries — skip anything under 5 minutes (sensor noise /
  // auto-detected micro-activities that aren't real training sessions)
  const entries: WorkoutEntry[] = workouts
    .filter(w => w.durationSecs >= 300)
    .map(w => ({
      activityName: w.activityName,
      category:     classifySport(w.activityName),
      durationMins: Math.round(w.durationSecs / 60),
      calories:     w.calories,
      startDate:    w.startDate,
    }));

  // If all workouts were filtered out as noise, return empty
  if (!entries.length) {
    return {
      entries:         [],
      totalMinutes:    0,
      totalCalories:   null,
      primaryCategory: 'other',
      loadTier:        'none',
      label:           '',
      hrSuppression:   false,
      contextNote:     '',
    };
  }

  // Aggregate totals
  const totalMinutes  = entries.reduce((s, e) => s + e.durationMins, 0);
  const totalCalories = entries.some(e => e.calories !== null)
    ? entries.reduce((s, e) => s + (e.calories ?? 0), 0)
    : null;

  // Primary category = category with most effective minutes
  const catTotals: Partial<Record<SportCategory, number>> = {};
  for (const e of entries) {
    const mult = e.category === 'strength' || e.category === 'hiit' ? 1.4
               : e.category === 'cardio'  || e.category === 'sport'  ? 1.0
               : 0.5;
    catTotals[e.category] = (catTotals[e.category] ?? 0) + e.durationMins * mult;
  }
  const primaryCategory = (Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other') as SportCategory;

  // Overall load tier = max of individual tiers
  const tierOrder: LoadTier[] = ['none', 'light', 'moderate', 'heavy', 'peak'];
  const loadTier = entries.reduce<LoadTier>((max, e) => {
    const t = computeLoadTier(e.category, e.durationMins, e.calories);
    return tierOrder.indexOf(t) > tierOrder.indexOf(max) ? t : max;
  }, 'none');

  // HRV suppression: HRV is ≥10% below baseline AND load was heavy/peak
  const hrSuppression =
    todayHrv !== null &&
    hrvBaseline > 0 &&
    todayHrv < hrvBaseline * 0.90 &&
    (loadTier === 'heavy' || loadTier === 'peak');

  // Label: "Strength · 65 min · Heavy"
  const catLabel = CATEGORY_LABELS[primaryCategory];
  const tierLabel = loadTier === 'none' ? '' : loadTier.charAt(0).toUpperCase() + loadTier.slice(1);
  const label = entries.length === 1
    ? `${entries[0].activityName} · ${totalMinutes} min · ${tierLabel}`
    : `${catLabel} (${entries.length} sessions) · ${totalMinutes} min · ${tierLabel}`;

  const contextNote = buildContextNote(loadTier, primaryCategory, hrSuppression);

  return {
    entries,
    totalMinutes,
    totalCalories,
    primaryCategory,
    loadTier,
    label,
    hrSuppression,
    contextNote,
  };
}
