/**
 * useStreak
 *
 * Computes the user's current check-in streak and all-time best streak
 * by reading the last 90 days of readiness_scores from Supabase.
 *
 * A "day counts" if score > 0 was recorded for that calendar date.
 * The streak is consecutive days ending today or yesterday (so opening
 * the app before the wearable syncs doesn't break a streak).
 */

import { useState, useEffect } from 'react';
import { supabase } from '@services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_STREAK_KEY = '@readiness/best_streak';

export interface StreakData {
  current:   number;   // consecutive days up to today/yesterday
  best:      number;   // all-time best streak
  isLoading: boolean;
}

function localDateStr(d: Date): string {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function useStreak(): StreakData {
  const [current,   setCurrent]   = useState(0);
  const [best,      setBest]      = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Fetch last 90 days of scores
        const since = new Date();
        since.setDate(since.getDate() - 90);

        const { data: rows } = await supabase
          .from('readiness_scores')
          .select('date, score')
          .eq('user_id', user.id)
          .gte('date', localDateStr(since))
          .order('date', { ascending: false });

        if (!rows || cancelled) return;

        // Build a Set of dates with score > 0
        const scoredDates = new Set(
          rows.filter(r => (r.score as number) > 0).map(r => r.date as string),
        );

        // Walk back from today counting consecutive days
        const todayStr     = localDateStr(new Date());
        const yesterdayStr = localDateStr(new Date(Date.now() - 86_400_000));

        // Allow streak to start from yesterday (wearable might not have synced yet today)
        let startDate = scoredDates.has(todayStr)     ? new Date()
                      : scoredDates.has(yesterdayStr) ? new Date(Date.now() - 86_400_000)
                      : null;

        let currentStreak = 0;
        if (startDate) {
          const cursor = new Date(startDate);
          while (scoredDates.has(localDateStr(cursor))) {
            currentStreak++;
            cursor.setDate(cursor.getDate() - 1);
          }
        }

        // Best streak: scan the full window
        let bestStreak = 0;
        let run = 0;
        // Sort ascending for sequential scan
        const sortedDates = Array.from(scoredDates).sort();
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            run = 1;
          } else {
            const prev = new Date(sortedDates[i - 1] + 'T12:00:00');
            const curr = new Date(sortedDates[i]     + 'T12:00:00');
            const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
            run = diff === 1 ? run + 1 : 1;
          }
          if (run > bestStreak) bestStreak = run;
        }

        // Persist best streak across sessions
        const stored = await AsyncStorage.getItem(BEST_STREAK_KEY);
        const storedBest = stored ? parseInt(stored, 10) : 0;
        const newBest = Math.max(bestStreak, storedBest, currentStreak);
        if (newBest > storedBest) {
          await AsyncStorage.setItem(BEST_STREAK_KEY, String(newBest));
        }

        if (!cancelled) {
          setCurrent(currentStreak);
          setBest(newBest);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { current, best, isLoading };
}
