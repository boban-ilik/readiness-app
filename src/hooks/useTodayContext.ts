/**
 * useTodayContextData — the Today screen's background "context" load.
 *
 * Fetches recent life events, detects patterns (which also schedules the coach
 * check-in), reads yesterday's score for the delta display, and computes the
 * 3-day forecast. Extracted from the screen so the data flow is named and the
 * screen stays a view.
 *
 * Re-runs when the score refreshes. A `live` flag drops late results, so a
 * quick refresh/remount can't write stale state.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@services/supabase';
import { fetchRecentEvents, type LifeEvent } from '@services/lifeEvents';
import { analyzeWorkload } from '@services/workloadAnalysis';
import { analyzePatterns, type PatternInsight } from '@services/patternAnalysis';
import { computeForecast, type ReadinessForecast } from '@services/readinessForecast';
import { recordForecast } from '@services/forecastLog';
import { localDateStr } from '@utils/index';

interface Params {
  isLoading: boolean;
  isRefreshing: boolean;
  score: number | undefined;
  isInsufficient: boolean;
  isPro: boolean;
  /** Schedules the coach check-in from the detected patterns. */
  onPatterns: (patterns: PatternInsight[], isPro: boolean) => void;
  /** Reschedules the morning digest with the new forecast score. */
  onRescheduleDigest: (score: number) => void;
}

export function useTodayContextData(params: Params) {
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [forecast, setForecast] = useState<ReadinessForecast | null>(null);
  const [yesterdayScore, setYesterdayScore] = useState<number | null>(null);

  useEffect(() => {
    if (params.isLoading) return;
    let live = true;

    async function loadContextualData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !live) return;

        // Life events + workload can run in parallel
        const [events, workload] = await Promise.all([fetchRecentEvents(7), analyzeWorkload()]);
        if (!live) return;
        setLifeEvents(events);

        const patterns = await analyzePatterns(user.id);
        if (!live) return;
        // Dedupe (3 days) and the in-flight lock live in the notifications hook.
        params.onPatterns(patterns, params.isPro);

        // Yesterday's score for the delta display.
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const { data: yesterdayRow } = await supabase
          .from('readiness_scores')
          .select('score')
          .eq('user_id', user.id)
          .eq('date', localDateStr(d))
          .single();
        if (!live) return;
        setYesterdayScore((yesterdayRow?.score as number) ?? null);

        // Today's live score when available; else the most recent DB score so
        // the forecast still renders before HealthKit syncs today.
        let scoreForForecast = params.score ?? 0;
        if (scoreForForecast <= 0) {
          const { data: latestRow } = await supabase
            .from('readiness_scores')
            .select('score')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();
          scoreForForecast = (latestRow?.score as number) ?? 0;
        }
        if (!live || scoreForForecast <= 0) return; // brand-new user

        if (params.isInsufficient) {
          setForecast(null);
          return;
        }

        const next = computeForecast(scoreForForecast, patterns, workload);
        setForecast(next);
        // Collected for everyone so a future track record has history, then
        // reschedule the morning digest with the new forecast.
        recordForecast(next).then(() => params.onRescheduleDigest(scoreForForecast));
      } catch (e) {
        console.warn('[useTodayContextData] contextual data load error:', e);
      }
    }

    loadContextualData();
    return () => { live = false; };
    // Same deps as the original effect: a new score reloads this, not every
    // callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.isLoading, params.isRefreshing, params.score]);

  return { lifeEvents, setLifeEvents, forecast, yesterdayScore };
}
