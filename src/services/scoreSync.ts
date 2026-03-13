/**
 * scoreSync.ts
 *
 * Supabase persistence layer for readiness scores.
 *
 * Two public functions:
 *   upsertTodayScore  — write today's computed score (called from useHealthData)
 *   fetchHistoryFromSupabase — read N days of saved scores (used by useHistoryData)
 *
 * Both are intentionally thin — they do no caching, no retries, and surface
 * errors to callers, which decide whether to swallow them silently.
 */

import { supabase } from '@services/supabase';
import type { ReadinessResult } from '@utils/readiness';

// ─── Row shape returned by the Supabase query ─────────────────────────────────

export interface SupabaseScoreRow {
  date:            string;
  score:           number;
  recovery_score:  number;
  sleep_score:     number;
  stress_score:    number;
  hrv:             number | null;
  rhr:             number | null;
  sleep_duration:  number | null;
  sleep_efficiency: number | null;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Upsert today's readiness result into `readiness_scores`.
 * Conflict resolution: newer write wins (updated_at is bumped by trigger).
 *
 * @throws if the Supabase call fails — callers should catch and log.
 */
export async function upsertTodayScore(
  result:  ReadinessResult,
  userId:  string,
): Promise<void> {
  const { score, components, healthData } = result;

  const row = {
    user_id:          userId,
    date:             healthData.date,
    score,
    recovery_score:   components.recovery,
    sleep_score:      components.sleep,
    stress_score:     components.stress,
    hrv:              healthData.hrv,
    rhr:              healthData.restingHeartRate,
    sleep_duration:   healthData.sleepDuration,
    sleep_efficiency: healthData.sleepEfficiency,
    // updated_at is intentionally omitted — the DB trigger owns it
  };

  const { error } = await supabase
    .from('readiness_scores')
    .upsert(row, { onConflict: 'user_id,date' });

  if (error) throw new Error(`scoreSync upsert failed: ${error.message}`);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the last `days` calendar days of readiness scores for a given user.
 * Returns rows in ascending date order; dates with no entry are absent (caller
 * is responsible for filling gaps).
 *
 * @throws if the Supabase query fails.
 */
export async function fetchHistoryFromSupabase(
  userId: string,
  days:   number,
): Promise<SupabaseScoreRow[]> {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = from.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('readiness_scores')
    .select(
      'date, score, recovery_score, sleep_score, stress_score, hrv, rhr, sleep_duration, sleep_efficiency',
    )
    .eq('user_id', userId)
    .gte('date', fromStr)
    .order('date', { ascending: true });

  if (error) throw new Error(`scoreSync fetch failed: ${error.message}`);
  return (data ?? []) as SupabaseScoreRow[];
}
