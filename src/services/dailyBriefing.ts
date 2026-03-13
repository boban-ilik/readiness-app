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
import type { HealthData } from '@types/index';
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
  const d = new Date();
  return `@readiness/daily_briefing_v1_${d.toISOString().split('T')[0]}`;
}

async function getCached(): Promise<DailyBriefing | null> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function setCache(briefing: DailyBriefing): Promise<void> {
  try {
    await AsyncStorage.setItem(todayKey(), JSON.stringify(briefing));
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

  // Return cached version for the day unless forced
  if (!forceRefresh) {
    const cached = await getCached();
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
    await setCache(briefing);
    return briefing;

  } finally {
    clearTimeout(timeout);
  }
}
