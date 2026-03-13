/**
 * useMetricHistory
 *
 * Fetches the last 30 days of a specific component score from Supabase for
 * display in the BreakdownModal sparkline.  Only runs when the modal is open
 * (enabled flag) to avoid unnecessary network calls.
 *
 * Returns raw {date, value} pairs — null values are preserved so the sparkline
 * can render gaps instead of silently connecting non-adjacent points.
 */

import { useState, useEffect } from 'react';
import { supabase }                     from '@services/supabase';
import { fetchHistoryFromSupabase }      from '@services/scoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetricComponent = 'recovery' | 'sleep' | 'stress';

export interface MetricDataPoint {
  date:  string;         // YYYY-MM-DD
  value: number | null;  // component score 0–100, null = no data that day
}

// Map component name → Supabase column
const COLUMN_MAP: Record<MetricComponent, 'recovery_score' | 'sleep_score' | 'stress_score'> = {
  recovery: 'recovery_score',
  sleep:    'sleep_score',
  stress:   'stress_score',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMetricHistory(
  component: string | null,
  enabled:   boolean,
): {
  data:      MetricDataPoint[];
  isLoading: boolean;
} {
  const [data,      setData]      = useState<MetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only run for recognised metric components (not activity)
    if (!enabled || !component || !(component in COLUMN_MAP)) {
      setData([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const rows  = await fetchHistoryFromSupabase(user.id, 30);
        if (cancelled) return;

        const col    = COLUMN_MAP[component as MetricComponent];
        const points = rows.map(r => ({
          date:  r.date,
          value: (r[col] as number | null) ?? null,
        }));

        setData(points);
      } catch (err) {
        if (!cancelled) console.warn('[useMetricHistory] fetch failed (non-fatal):', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [component, enabled]);

  return { data, isLoading };
}
