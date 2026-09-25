/**
 * coachContext.ts
 *
 * The extra context the coach gets from 1.0.4 on: remembered facts, the last
 * 30 days of saved scores and metrics, today's score worked step by step, and
 * Strava activities from the last 14 days. Each piece is optional: a failure
 * or timeout just leaves it out, and the coach answers with less.
 */

import { supabase } from '@services/supabase';
import { fetchHistoryFromSupabase } from '@services/scoreSync';
import { fetchStravaActivities } from '@services/strava';
import { getScoreSnapshot } from '@services/scoreSession';
import { buildScoreMath } from '@utils/scoreMath';
import { loadCoachMemory } from '@services/coachMemory';

export interface CoachExtras {
  memory:    string[];
  trend:     Array<{ date: string; score: number; recovery: number | null; sleep: number | null; stress: number | null; hrv: number | null; rhr: number | null; sleepMin: number | null }>;
  scoreMath: string[];
  strava:    Array<{ date: string; type: string; name: string | null; minutes: number; km: number | null; effort: number | null }>;
}

const TTL_MS = 10 * 60 * 1000;
let cache: { at: number; userId: string; trend: CoachExtras['trend']; strava: CoachExtras['strava'] } | null = null;

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

/** Score math as flat lines, the same text the math screen shows. */
function scoreMathLines(): string[] {
  const snap = getScoreSnapshot();
  if (!snap) return [];
  return buildScoreMath({
    explanation:         snap.explanation,
    hrvBaseline:         snap.hrvBaseline,
    rhrBaseline:         snap.rhrBaseline,
    hrvBaselineAllMonth: snap.hrvBaselineAllMonth,
    rhrBaselineAllMonth: snap.rhrBaselineAllMonth,
    cycle:               snap.cycle,
    uncorrectedScore:    snap.uncorrectedScore,
  })
    .filter(s => s.key !== 'baselines')
    .flatMap(s => [`${s.title}${s.result !== undefined ? ` = ${s.result}` : ''}:`, ...s.lines.map(l => `  ${l}`)]);
}

export async function buildCoachExtras(): Promise<CoachExtras> {
  const [memoryItems, { data: { session } }] = await Promise.all([loadCoachMemory(), supabase.auth.getSession()]);
  const memory = memoryItems.map(m => m.text);
  const scoreMath = scoreMathLines();
  const userId = session?.user?.id ?? '';

  if (cache && cache.userId === userId && Date.now() - cache.at < TTL_MS) {
    return { memory, scoreMath, trend: cache.trend, strava: cache.strava };
  }

  const [rows, activities] = await Promise.all([
    userId ? withTimeout(fetchHistoryFromSupabase(userId, 30), 6_000, []) : Promise.resolve([]),
    withTimeout(fetchStravaActivities(14, 30), 6_000, []),
  ]);

  const trend: CoachExtras['trend'] = rows.map(r => ({
    date: r.date, score: r.score,
    recovery: r.recovery_score ?? null, sleep: r.sleep_score ?? null, stress: r.stress_score ?? null,
    hrv: r.hrv ?? null, rhr: r.rhr ?? null, sleepMin: r.sleep_duration ?? null,
  }));
  const strava: CoachExtras['strava'] = activities.slice(0, 20).map(a => ({
    date:    (a.start_date_local ?? '').slice(0, 10),
    type:    a.sport_type ?? 'Workout',
    name:    a.name ?? null,
    minutes: Math.round((a.moving_time ?? 0) / 60),
    km:      a.distance ? Math.round(a.distance / 100) / 10 : null,
    effort:  typeof a.suffer_score === 'number' ? a.suffer_score : null,
  }));

  cache = { at: Date.now(), userId, trend, strava };
  return { memory, scoreMath, trend, strava };
}

/** Drop cached history/Strava, e.g. after today's score is saved. */
export function invalidateCoachExtras(): void {
  cache = null;
}
