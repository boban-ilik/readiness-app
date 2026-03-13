/**
 * patternAnalysis.ts
 *
 * Queries 30 days of readiness history from Supabase and detects longitudinal
 * patterns that a single-day briefing would miss — consecutive HRV drops,
 * sleep debt, overtraining signals, and recovery rebounds.
 *
 * Results are passed as plain-text context to the daily-briefing Edge Function
 * so the AI can reason about trends across weeks, not just today.
 *
 * Cache: 6-hour AsyncStorage key per calendar day — pattern detection is
 * expensive enough to avoid running on every tap.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';
import type { SupabaseScoreRow } from '@services/scoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatternInsight {
  type:     string;
  severity: 'info' | 'warning' | 'alert';
  /** Written for the AI — complete sentence with specific numbers. */
  message:  string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_PREFIX = '@readiness/patterns_v1_';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface PatternCache {
  patterns: PatternInsight[];
  ts:       number;
}

function todayKey(): string {
  return CACHE_PREFIX + new Date().toISOString().split('T')[0];
}

async function getCached(): Promise<PatternInsight[] | null> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return null;
    const cache: PatternCache = JSON.parse(raw);
    if (Date.now() - cache.ts > CACHE_TTL_MS) return null;
    return cache.patterns;
  } catch {
    return null;
  }
}

async function setCache(patterns: PatternInsight[]): Promise<void> {
  try {
    const cache: PatternCache = { patterns, ts: Date.now() };
    await AsyncStorage.setItem(todayKey(), JSON.stringify(cache));
  } catch { /* non-fatal */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Average of an array of numbers — returns null for empty arrays. */
function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** True when a sequence of values is strictly descending. */
function isStrictlyDecreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] >= values[i - 1]) return false;
  }
  return true;
}

/** True when a sequence of values is strictly ascending. */
function isStrictlyIncreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) return false;
  }
  return true;
}

// ─── Pattern detectors ────────────────────────────────────────────────────────

function detectConsecutiveHRVDrop(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last3 = rows.slice(-3).filter(r => r.hrv !== null);
  if (last3.length < 3) return null;

  const hrvValues = last3.map(r => r.hrv!);
  if (!isStrictlyDecreasing(hrvValues)) return null;

  const totalDrop = Math.round(hrvValues[0] - hrvValues[2]);
  if (totalDrop < 5) return null; // noise threshold

  return {
    type:     'consecutive_hrv_drop',
    severity: totalDrop >= 12 ? 'alert' : 'warning',
    message:  `HRV has dropped for 3 consecutive days — down ${totalDrop} ms over 72 hours (${hrvValues[0]} → ${hrvValues[2]} ms). This pattern historically precedes illness or overreaching; treat it as a strong signal to reduce intensity and prioritise sleep.`,
  };
}

function detectConsecutiveScoreDecline(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last3 = rows.slice(-3);
  if (last3.length < 3) return null;

  const scores = last3.map(r => r.score);
  if (!isStrictlyDecreasing(scores)) return null;

  const totalDrop = scores[0] - scores[2];
  if (totalDrop < 8) return null;

  return {
    type:     'consecutive_score_decline',
    severity: totalDrop >= 20 ? 'alert' : 'warning',
    message:  `Overall readiness has declined for 3 consecutive days (${scores[0]} → ${scores[2]}, down ${totalDrop} points). Accumulated fatigue is building — this is not a day to push hard.`,
  };
}

function detectHRVImprovingTrend(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last3 = rows.slice(-3).filter(r => r.hrv !== null);
  if (last3.length < 3) return null;

  const hrvValues = last3.map(r => r.hrv!);
  if (!isStrictlyIncreasing(hrvValues)) return null;

  const totalGain = Math.round(hrvValues[2] - hrvValues[0]);
  if (totalGain < 5) return null;

  return {
    type:     'hrv_improving',
    severity: 'info',
    message:  `HRV has climbed for 3 consecutive days (up ${totalGain} ms — ${hrvValues[0]} → ${hrvValues[2]} ms). The body is adapting positively; this is a good window for quality training if overall readiness supports it.`,
  };
}

function detectSleepDebt(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last5SleepRows = rows.slice(-5).filter(r => r.sleep_duration !== null);
  const allSleepRows   = rows.filter(r => r.sleep_duration !== null);

  if (last5SleepRows.length < 3 || allSleepRows.length < 7) return null;

  // Baseline = 14-day average (excluding last 5 to avoid contamination)
  const baselineRows = allSleepRows.slice(-19, -5);
  if (baselineRows.length < 3) return null;

  const recentAvgMin   = avg(last5SleepRows.map(r => r.sleep_duration!))!;
  const baselineAvgMin = avg(baselineRows.map(r => r.sleep_duration!))!;
  const debtMin        = Math.round(baselineAvgMin - recentAvgMin);

  if (debtMin < 25) return null; // less than 25 min deficit — noise

  const debtHours = (debtMin / 60).toFixed(1);

  return {
    type:     'sleep_debt',
    severity: debtMin >= 60 ? 'alert' : 'warning',
    message:  `Sleep debt is accumulating — averaging ${debtHours} h less per night than your 2-week baseline over the past 5 days. Chronic sleep restriction suppresses HRV and immune function even when the user feels fine.`,
  };
}

function detectStressAccumulation(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last4 = rows.slice(-4);
  if (last4.length < 4) return null;

  const stressScores = last4.map(r => r.stress_score);
  if (!isStrictlyDecreasing(stressScores)) return null;

  const drop = stressScores[0] - stressScores[3];
  if (drop < 10) return null;

  return {
    type:     'stress_accumulation',
    severity: 'warning',
    message:  `Stress component has deteriorated for 4 consecutive days (${stressScores[0]} → ${stressScores[3]}, down ${drop} points). Sustained autonomic stress is reducing recovery capacity — prioritise stress management techniques today.`,
  };
}

function detectRecoveryRebound(rows: SupabaseScoreRow[]): PatternInsight | null {
  if (rows.length < 5) return null;

  // Look for a trough 3–4 days ago followed by 2 consecutive improvements
  const window = rows.slice(-5);
  const trough = Math.min(...window.slice(0, 3).map(r => r.score));
  const recent2Avg = avg(window.slice(-2).map(r => r.score))!;

  const gain = Math.round(recent2Avg - trough);
  if (gain < 10) return null;

  return {
    type:     'recovery_rebound',
    severity: 'info',
    message:  `Readiness has rebounded ${gain} points over the past 2 days after reaching a low of ${trough}. Recovery is tracking in the right direction.`,
  };
}

function detectPersistentLow(rows: SupabaseScoreRow[]): PatternInsight | null {
  const last7 = rows.slice(-7);
  if (last7.length < 5) return null;

  const weekAvg = avg(last7.map(r => r.score))!;
  if (weekAvg >= 50) return null;

  return {
    type:     'persistent_low',
    severity: 'alert',
    message:  `7-day average readiness score is ${Math.round(weekAvg)}/100 — well below healthy baseline. Sustained scores this low are consistent with overtraining syndrome or an underlying illness. A full rest or deload week is likely overdue.`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches 30 days of readiness history for the user, detects longitudinal
 * patterns, and returns an array of PatternInsight objects.
 *
 * Returns [] on any error — pattern analysis is non-critical context for the
 * briefing, not a gate on opening it.
 */
export async function analyzePatterns(userId: string): Promise<PatternInsight[]> {
  // Try cache
  const cached = await getCached();
  if (cached) return cached;

  try {
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const fromStr = from.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('readiness_scores')
      .select(
        'date, score, recovery_score, sleep_score, stress_score, hrv, rhr, sleep_duration, sleep_efficiency',
      )
      .eq('user_id', userId)
      .gte('date', fromStr)
      .order('date', { ascending: true });

    if (error || !data || data.length < 3) return [];

    const rows = data as SupabaseScoreRow[];
    const insights: PatternInsight[] = [];

    // Run all detectors — order matters for priority (most critical first)
    const checks = [
      detectConsecutiveHRVDrop,
      detectPersistentLow,
      detectConsecutiveScoreDecline,
      detectSleepDebt,
      detectStressAccumulation,
      detectHRVImprovingTrend,
      detectRecoveryRebound,
    ];

    for (const check of checks) {
      const result = check(rows);
      if (result) insights.push(result);
    }

    await setCache(insights);
    return insights;

  } catch (err) {
    console.warn('[PatternAnalysis] failed (non-fatal):', err);
    return [];
  }
}
