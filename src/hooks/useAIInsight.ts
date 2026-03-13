/**
 * useAIInsight
 *
 * Fetches (and caches) an AI-generated interpretation + advice string for a
 * single readiness component whenever the modal becomes visible.
 *
 * Returns:
 *  insight   — null until the fetch completes (or on error)
 *  isLoading — true while the API call is in-flight
 *
 * The hook is a no-op for free-tier users (isPro = false) and for the
 * Activity component, which has no single score to interpret.
 */

import { useState, useEffect } from 'react';
import { fetchAIInsight, type AiInsight, type InsightComponent } from '@services/claude';
import type { HealthData } from '@types/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UseAIInsightOptions {
  /** Which readiness component is being displayed; null or 'activity' → no-op */
  component:   InsightComponent | 'activity' | null;
  score:       number;
  statusLabel: string;
  healthData:  HealthData | null;
  rhrBaseline: number;
  hrvBaseline: number;
  /** True when the user has an active Pro subscription */
  isPro:       boolean;
  /** Trigger condition — pass `visible` from the parent modal */
  enabled:     boolean;
}

export interface UseAIInsightResult {
  insight:   AiInsight | null;
  isLoading: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAIInsight({
  component,
  score,
  statusLabel,
  healthData,
  rhrBaseline,
  hrvBaseline,
  isPro,
  enabled,
}: UseAIInsightOptions): UseAIInsightResult {
  const [insight,   setInsight]   = useState<AiInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Conditions that make the fetch a no-op:
    const shouldFetch =
      enabled &&
      isPro &&
      !!component &&
      component !== 'activity' &&
      !!healthData &&
      !!process.env.EXPO_PUBLIC_SUPABASE_URL; // skip silently if Supabase not configured

    if (!shouldFetch) {
      setInsight(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setInsight(null);

    fetchAIInsight({
      component:   component as InsightComponent,
      score,
      statusLabel,
      healthData,
      rhrBaseline,
      hrvBaseline,
    })
      .then(result => {
        if (!cancelled) setInsight(result);
      })
      .catch(err => {
        // Silently fall back to static content — no error state needed
        if (!cancelled) {
          console.warn('[useAIInsight] Fetch failed, using static fallback:', err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };

    // Re-fetch when the modal opens for a different component or the score changes
    // (score changes after manual HRV entry → fresh context).
    // Using healthData.date rather than the whole object avoids referential churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isPro, component, Math.round(score), healthData?.date]);

  return { insight, isLoading };
}
