/**
 * useTrendData
 *
 * Lightweight hook that fetches the last 7 days of readiness scores from
 * Supabase and derives a trend signal for the home-screen Trend card.
 *
 * ── Trend algorithm ──────────────────────────────────────────────────────────
 * We split the 7 days into two windows:
 *   recent  = last 3 days (days 5–7)
 *   prior   = first 4 days (days 1–4)
 *
 * delta = mean(recent) − mean(prior)
 *   delta >  5  → improving
 *   delta < −5  → declining
 *   otherwise   → stable
 *
 * Per-component trends (recovery, sleep, stress) use the same algorithm so
 * the card can surface the weakest link.
 *
 * ── Caching ──────────────────────────────────────────────────────────────────
 * Results are cached in AsyncStorage for 30 minutes so the card renders
 * instantly on repeated opens without an extra Supabase round-trip.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface ComponentTrend {
  direction: TrendDirection;
  delta:     number;
}

export interface TrendData {
  /** Scores ordered oldest → newest (up to 7 items). */
  scores:      number[];
  /** Overall readiness trend. */
  direction:   TrendDirection;
  /** mean(recent 3) − mean(prior 4), rounded to 1 decimal. */
  delta:       number;
  /** Per-component trends. */
  components: {
    recovery: ComponentTrend;
    sleep:    ComponentTrend;
    stress:   ComponentTrend;
  };
  /** Key insight sentence to display under the sparkline. */
  insight:     string;
  /** The component that's dragging performance most (if any). */
  weakLink:    'recovery' | 'sleep' | 'stress' | null;
}

export interface UseTrendDataReturn {
  trend:     TrendData | null;
  isLoading: boolean;
  error:     string | null;
  refresh:   () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY    = '@readiness/trend_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function classify(delta: number): TrendDirection {
  if (delta >  5) return 'improving';
  if (delta < -5) return 'declining';
  return 'stable';
}

function componentTrend(
  rows:      Array<{ recovery: number; sleep: number; stress: number }>,
  key:       'recovery' | 'sleep' | 'stress',
): ComponentTrend {
  const vals  = rows.map(r => r[key]);
  const prior  = vals.slice(0, 4);
  const recent = vals.slice(-3);
  if (recent.length === 0 || prior.length === 0) return { direction: 'stable', delta: 0 };
  const delta = Math.round((mean(recent) - mean(prior)) * 10) / 10;
  return { direction: classify(delta), delta };
}

function buildInsight(
  direction: TrendDirection,
  delta:     number,
  weakLink:  'recovery' | 'sleep' | 'stress' | null,
): string {
  if (direction === 'improving') {
    if (delta >= 15) return 'Big jump this week — your body is responding well. Great time for a quality session.';
    return 'Recovery trending up this week. Build on the momentum with a solid training block.';
  }
  if (direction === 'declining') {
    if (weakLink === 'sleep') return 'Sleep quality has been pulling scores down. Prioritise an early night before any hard session.';
    if (weakLink === 'recovery') return 'Heart rate variability and resting heart rate are dipping. Consider a recovery-focused day.';
    if (weakLink === 'stress') return 'Stress signals are elevated this week. Dial back intensity and focus on recovery.';
    return '3-day dip in readiness — consider keeping this week lighter than planned.';
  }
  // stable
  return 'Readiness is consistent this week — solid base to build on. Keep the rhythm going.';
}

function deriveWeakLink(
  comps: { recovery: ComponentTrend; sleep: ComponentTrend; stress: ComponentTrend },
): 'recovery' | 'sleep' | 'stress' | null {
  // The component with the worst (most negative) delta drives the insight
  const entries: Array<['recovery' | 'sleep' | 'stress', number]> = [
    ['recovery', comps.recovery.delta],
    ['sleep',    comps.sleep.delta],
    ['stress',   comps.stress.delta],
  ];
  const worst = entries.sort((a, b) => a[1] - b[1])[0];
  // Only flag if it's genuinely dragging (delta < -5)
  return worst[1] < -5 ? worst[0] : null;
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

async function fetchTrend(): Promise<TrendData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('readiness_scores')
    .select('date, score, recovery_score, sleep_score, stress_score')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: true })
    .limit(7);

  if (error) throw new Error(error.message);
  if (!data || data.length < 2) throw new Error('Not enough data');

  const rows = data.map(r => ({
    recovery: r.recovery_score as number,
    sleep:    r.sleep_score    as number,
    stress:   r.stress_score   as number,
  }));

  const scores  = data.map(r => r.score as number);
  const prior   = scores.slice(0, Math.max(1, scores.length - 3));
  const recent  = scores.slice(-3);
  const delta   = Math.round((mean(recent) - mean(prior)) * 10) / 10;
  const direction = classify(delta);

  const components = {
    recovery: componentTrend(rows, 'recovery'),
    sleep:    componentTrend(rows, 'sleep'),
    stress:   componentTrend(rows, 'stress'),
  };
  const weakLink = deriveWeakLink(components);
  const insight  = buildInsight(direction, delta, weakLink);

  return { scores, direction, delta, components, insight, weakLink };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrendData(): UseTrendDataReturn {
  const [trend,     setTrend]     = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cache first (unless forced)
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL_MS) {
            setTrend(data);
            setIsLoading(false);
            return;
          }
        }
      }

      const data = await fetchTrend();
      setTrend(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // Silently fail for "not enough data" — card just won't render
      if (msg !== 'Not enough data' && msg !== 'Not authenticated') {
        setError(msg);
        console.warn('[TrendData] fetch failed:', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return {
    trend,
    isLoading,
    error,
    refresh: () => load(true),
  };
}
