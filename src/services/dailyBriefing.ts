/**
 * dailyBriefing
 *
 * Calls the daily-briefing Edge Function and caches the result for the
 * current calendar day so repeated taps don't re-call the API.
 *
 * Cache key: @readiness/daily_briefing_v1_YYYY-MM-DD
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData } from '@/types/index';
import { getScoreLabel } from '@constants/theme';
import type { PatternInsight } from '@services/patternAnalysis';
import type { WorkloadResult } from '@services/workloadAnalysis';
import type { LifeEvent } from '@services/lifeEvents';

const SUPABASE_URL     = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyBriefing {
  headline:   string;
  overview:   string;
  focusAreas: string[];
  actionPlan: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type BriefingRating = 'helpful' | 'unhelpful';

export interface BriefingFeedback {
  date:   string;
  rating: BriefingRating;
}

const FEEDBACK_KEY_PREFIX = '@readiness/briefing_feedback_v1_';

export async function saveBriefingFeedback(
  date: string,
  rating: BriefingRating,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      FEEDBACK_KEY_PREFIX + date,
      JSON.stringify({ date, rating }),
    );
  } catch { /* non-fatal */ }
}

/** Loads yesterday's feedback so it can be sent with today's briefing request. */
export async function loadYesterdayFeedback(): Promise<BriefingFeedback | null> {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const key = FEEDBACK_KEY_PREFIX + d.toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function todayKey(): string {
  // Local date, not UTC: a briefing is "today's" from the user's perspective.
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `@readiness/daily_briefing_v1_${local}`;
}

/**
 * Identifies the data a briefing was written from.
 *
 * Caching on date alone meant a briefing generated early in the morning —
 * before HealthKit had finished writing last night's sleep — stayed on screen
 * after the score refreshed. The result was coaching that confidently cited
 * numbers the rest of the app no longer showed: "you slept well (8.2 hours)"
 * beside a breakdown reading 6h 17m.
 */
function dataFingerprint(readiness: ReadinessResult, healthData: HealthData): string {
  const h = healthData;
  return [
    Math.round(readiness.score),
    Math.round(readiness.components.recovery),
    Math.round(readiness.components.sleep),
    Math.round(readiness.components.stress),
    h.hrv ?? '-',
    h.restingHeartRate ?? '-',
    h.sleepDuration ?? '-',
    h.deepSleep ?? '-',
    h.remSleep ?? '-',
    h.sleepEfficiency ?? '-',
  ].join('|');
}

interface CachedBriefing {
  briefing:    DailyBriefing;
  fingerprint: string;
}

async function getCached(fingerprint: string): Promise<DailyBriefing | null> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedBriefing | DailyBriefing;

    // Entries written before fingerprinting existed have no fingerprint —
    // discard them rather than risk showing stale numbers.
    if (!('fingerprint' in parsed) || !('briefing' in parsed)) return null;

    return parsed.fingerprint === fingerprint ? parsed.briefing : null;
  } catch { return null; }
}

async function setCache(briefing: DailyBriefing, fingerprint: string): Promise<void> {
  try {
    const payload: CachedBriefing = { briefing, fingerprint };
    await AsyncStorage.setItem(todayKey(), JSON.stringify(payload));
  } catch { /* non-fatal */ }
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchDailyBriefing(
  readiness:   ReadinessResult,
  healthData:  HealthData,
  rhrBaseline: number,
  hrvBaseline: number,
  forceRefresh = false,
  patterns:    PatternInsight[] = [],
  workload:    WorkloadResult | null = null,
  lifeEvents:  LifeEvent[] = [],
): Promise<DailyBriefing> {

  // Reuse today's briefing only if it was written from the same data. A score
  // that refreshes after HealthKit catches up must take its coaching with it.
  const fingerprint = dataFingerprint(readiness, healthData);
  if (!forceRefresh) {
    const cached = await getCached(fingerprint);
    if (cached) return cached;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');

  if (!SUPABASE_URL) throw new Error('Supabase is not configured');

  // Load yesterday's feedback before making the request so the AI can adjust tone
  const yesterdayFeedback = await loadYesterdayFeedback();

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 25_000);

  try {
    const url = `${SUPABASE_URL}/functions/v1/daily-briefing`;

    const res = await fetch(url, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        score:      Math.round(readiness.score),
        scoreLabel: getScoreLabel(readiness.score),
        components: {
          recovery: Math.round(readiness.components.recovery),
          sleep:    Math.round(readiness.components.sleep),
          stress:   Math.round(readiness.components.stress),
        },
        healthData: {
          date:             healthData.date,
          hrv:              healthData.hrv,
          restingHeartRate: healthData.restingHeartRate,
          sleepDuration:    healthData.sleepDuration,
          deepSleep:        healthData.deepSleep,
          remSleep:         healthData.remSleep,
          sleepEfficiency:  healthData.sleepEfficiency,
          stressScore:      healthData.stressScore,
          daytimeAvgHR:     healthData.daytimeAvgHR,
          steps:            healthData.steps ?? null,
        },
        rhrBaseline,
        hrvBaseline,
        patterns,
        workload,
        lifeEvents,
        yesterdayFeedback,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }

    const briefing: DailyBriefing = await res.json();
    await setCache(briefing, fingerprint);
    return briefing;

  } finally {
    clearTimeout(timeout);
  }
}
