/**
 * weeklyReport.ts
 *
 * Client-side service for the weekly AI readiness report (Pro feature).
 *
 * Calls the `weekly-report` Supabase Edge Function, which:
 *   1. Verifies the user's JWT
 *   2. Queries the last 7 days of `readiness_scores`
 *   3. Asks Claude Haiku to generate a personalised narrative
 *   4. Returns { summary, weekOf }
 *
 * Caching:  AsyncStorage keyed by ISO week (YYYY-WXX) so a Pro user won't
 * re-hit the Edge Function until the following Monday.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';

const SUPABASE_URL         = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const WEEKLY_CACHE_PREFIX  = '@readiness/weekly_report_v1_';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyReportScore {
  date:       string;
  score:      number;
  dayLabel:   string;
  components: { recovery: number; sleep: number; stress: number };
}

export interface WeeklyReport {
  // Core fields (always present)
  summary: string;
  weekOf:  string;   // YYYY-MM-DD of the report generation date

  // Structured fields (present when using the updated edge function)
  tip?:           string;
  trend?:         'improving' | 'declining' | 'stable';
  avgScore?:      number;
  bestDay?:       { date: string; score: number; dayLabel: string };
  worstDay?:      { date: string; score: number; dayLabel: string };
  topComponent?:  'recovery' | 'sleep' | 'stress';
  weakComponent?: 'recovery' | 'sleep' | 'stress' | null;
  scores?:        WeeklyReportScore[];
}

// ─── ISO-week key ─────────────────────────────────────────────────────────────
// Returns e.g. "2026-W10" — used as the AsyncStorage suffix so the cache
// expires automatically at the start of each new calendar week.

function isoWeekKey(): string {
  const now    = new Date();
  const year   = now.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - oneJan.getTime()) / 86_400_000);
  const week   = Math.ceil((dayOfYear + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function cacheKey(): string {
  return `${WEEKLY_CACHE_PREFIX}${isoWeekKey()}`;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function loadCachedReport(): Promise<WeeklyReport | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey());
    if (!raw) return null;
    return JSON.parse(raw) as WeeklyReport;
  } catch {
    return null;
  }
}

async function saveCachedReport(report: WeeklyReport): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(), JSON.stringify(report));
  } catch {
    // Non-fatal — the report still works this session, just won't be cached
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch this week's AI readiness report.
 *
 * Returns the cached report instantly if one exists for the current ISO week.
 * Otherwise calls the Edge Function (which requires an active Supabase session
 * and at least 3 days of saved scores).
 *
 * @throws if Supabase is not configured, user is not authenticated, or the
 *         Edge Function returns an error.
 */
export async function fetchWeeklyReport(): Promise<WeeklyReport> {
  if (!SUPABASE_URL) throw new Error('Supabase is not configured');

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = await loadCachedReport();
  if (cached) return cached;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to generate your weekly report.');

  // ── Edge Function call ─────────────────────────────────────────────────────
  const url = `${SUPABASE_URL}/functions/v1/weekly-report`;
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 25_000); // 25 s

  let res: Response;
  try {
    res = await fetch(url, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let msg: string;
    try {
      const parsed = JSON.parse(body);
      msg = parsed.error ?? `HTTP ${res.status}`;
    } catch {
      msg = `HTTP ${res.status}`;
    }
    throw new Error(msg);
  }

  const report = (await res.json()) as WeeklyReport;
  if (!report.summary) throw new Error('Invalid response from weekly-report function');

  await saveCachedReport(report);
  return report;
}
