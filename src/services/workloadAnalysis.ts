/**
 * workloadAnalysis.ts
 *
 * Computes a Training Load score from yesterday's HealthKit workout samples.
 *
 * Method: simplified TRIMP (Training Impulse) — each workout's load is
 * duration (minutes) × an intensity factor derived from the activity type.
 * A cumulative daily load is scaled to a 0–100 index where 100 = a very hard
 * 90-minute high-intensity session.
 *
 * The result is passed as context to the daily-briefing Edge Function so the
 * AI can reason about yesterday's training load when advising on today's recovery.
 *
 * No Supabase writes — workout data is volatile enough that a daily cached
 * summary passed to the AI is sufficient for coaching purposes.
 */

import { Platform } from 'react-native';
import { fetchYesterdayWorkouts, type RawWorkout } from '@services/healthkit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntensityTier = 'easy' | 'moderate' | 'hard';

export interface WorkoutSummary {
  type:          string;       // Human-readable activity name
  durationMins:  number;
  calories:      number | null;
  intensityTier: IntensityTier;
  /** 0–100 per-session relative training load */
  load:          number;
}

export interface WorkloadResult {
  workouts:   WorkoutSummary[];
  /** 0–100 cumulative load for yesterday */
  dailyLoad:  number;
  /** True when dailyLoad > 65 — meaningful training that needs recovery context */
  isHighLoad: boolean;
}

// ─── Intensity classification ─────────────────────────────────────────────────

/**
 * Keywords that map activity names to intensity tiers.
 * Checked case-insensitively against `activityName` from HealthKit.
 */
const HARD_KEYWORDS   = ['run', 'sprint', 'interval', 'hiit', 'swim', 'race', 'cross country', 'kickboxing', 'boxing', 'martial', 'rowing'];
const EASY_KEYWORDS   = ['walk', 'yoga', 'pilates', 'stretch', 'meditation', 'tai chi', 'bowling', 'golf'];
// Everything else defaults to moderate

const INTENSITY_FACTOR: Record<IntensityTier, number> = {
  hard:     1.4,
  moderate: 1.0,
  easy:     0.45,
};

/** Max reference session used to normalise load to 0–100 */
const MAX_REFERENCE_LOAD = 90 * 1.4; // 90-min hard session

function classifyIntensity(activityName: string): IntensityTier {
  const lower = activityName.toLowerCase();
  if (HARD_KEYWORDS.some(k  => lower.includes(k))) return 'hard';
  if (EASY_KEYWORDS.some(k  => lower.includes(k))) return 'easy';
  return 'moderate';
}

// ─── Per-workout processing ───────────────────────────────────────────────────

function processWorkout(raw: RawWorkout): WorkoutSummary {
  const durationMins = Math.round(raw.durationSecs / 60);
  const tier         = classifyIntensity(raw.activityName);
  const rawLoad      = durationMins * INTENSITY_FACTOR[tier];
  const load         = Math.min(100, Math.round((rawLoad / MAX_REFERENCE_LOAD) * 100));

  return {
    type:          raw.activityName,
    durationMins,
    calories:      raw.calories,
    intensityTier: tier,
    load,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

const EMPTY_RESULT: WorkloadResult = {
  workouts:  [],
  dailyLoad: 0,
  isHighLoad: false,
};

/**
 * Fetches yesterday's workouts from HealthKit and computes training load.
 * Returns EMPTY_RESULT on Android, Expo Go, or any HealthKit failure.
 */
export async function analyzeWorkload(): Promise<WorkloadResult> {
  if (Platform.OS !== 'ios') return EMPTY_RESULT;

  try {
    const rawWorkouts = await fetchYesterdayWorkouts();
    if (rawWorkouts.length === 0) return EMPTY_RESULT;

    const workouts = rawWorkouts
      .filter(w => w.durationSecs >= 300) // ignore sessions < 5 min (noise)
      .map(processWorkout);

    if (workouts.length === 0) return EMPTY_RESULT;

    // Cumulative load — hard sessions stack; cap at 100 (can't go higher than max)
    const totalRawLoad = workouts.reduce((sum, w) => {
      const raw = w.durationMins * INTENSITY_FACTOR[w.intensityTier];
      return sum + raw;
    }, 0);
    const dailyLoad = Math.min(100, Math.round((totalRawLoad / MAX_REFERENCE_LOAD) * 100));

    return {
      workouts,
      dailyLoad,
      isHighLoad: dailyLoad > 65,
    };
  } catch (err) {
    console.warn('[WorkloadAnalysis] failed (non-fatal):', err);
    return EMPTY_RESULT;
  }
}
