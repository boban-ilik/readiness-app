import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  isHealthKitAvailable,
  fetchRHRByDay,
  fetchSleepByDay,
} from '@services/healthkit';
import { getPersonalRHRBaseline } from '@hooks/useHealthData';
import { calculateReadiness } from '@utils/readiness';
import { supabase } from '@services/supabase';
import { fetchHistoryFromSupabase } from '@services/scoreSync';
import type { HealthData } from '@types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayHistory {
  date:            string;         // YYYY-MM-DD
  dayLabel:        string;         // 'Mon', 'Tue', ...
  score:           number | null;  // 0–100 computed readiness
  components:      { recovery: number; sleep: number; stress: number } | null;
  rhr:             number | null;  // bpm
  hrv:             number | null;  // ms (SDNN) — only available from Supabase enrichment
  sleepMinutes:    number | null;
  sleepEfficiency: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Returns the last N calendar dates (oldest → newest). */
function buildDateRange(days: number): string[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return localDateStr(d);
  });
}

/** 'Mon', 'Tue', etc. — anchored at noon to avoid timezone-induced day shift. */
function toDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// ─── Mock data (Expo Go / web) ────────────────────────────────────────────────

function buildMockHistory(days: number): DayHistory[] {
  const today = new Date();
  // Score/metric sequences — cycle for longer ranges
  const scoreBase = [54, 61, 47, 58, 68, 65, 58, 62, 71, 55, 49, 63, 66, 59];
  const rhrBase   = [67, 64, 69, 65, 63, 64, 65, 63, 62, 68, 66, 64, 63, 65];
  const sleepBase = [398, 432, 365, 408, 455, 432, 408, 440, 462, 385, 370, 425, 438, 415];
  const compsBase = [
    { recovery: 42, sleep: 64, stress: 50 },
    { recovery: 55, sleep: 68, stress: 50 },
    { recovery: 38, sleep: 55, stress: 50 },
    { recovery: 47, sleep: 68, stress: 50 },
    { recovery: 60, sleep: 75, stress: 50 },
    { recovery: 55, sleep: 74, stress: 50 },
    { recovery: 47, sleep: 68, stress: 50 },
    { recovery: 58, sleep: 70, stress: 50 },
    { recovery: 65, sleep: 77, stress: 60 },
    { recovery: 44, sleep: 62, stress: 45 },
    { recovery: 39, sleep: 56, stress: 48 },
    { recovery: 52, sleep: 70, stress: 55 },
    { recovery: 56, sleep: 73, stress: 58 },
    { recovery: 50, sleep: 67, stress: 52 },
  ];

  const hrvBase = [58, 62, 49, 55, 67, 64, 58, 61, 70, 53, 47, 60, 65, 57];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = localDateStr(d);
    const idx     = i % scoreBase.length;
    return {
      date:            dateStr,
      dayLabel:        d.toLocaleDateString('en-US', { weekday: 'short' }),
      score:           scoreBase[idx],
      components:      compsBase[idx],
      rhr:             rhrBase[idx],
      hrv:             hrvBase[idx],
      sleepMinutes:    sleepBase[idx],
      sleepEfficiency: 88,
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param days  How many calendar days to load.  7 = default, 28 = Pro extended.
 */
export function useHistoryData(days: 7 | 28 = 7): {
  history:   DayHistory[];
  isLoading: boolean;
  error:     string | null;
} {
  const [history,   setHistory]   = useState<DayHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // ── Mock path (Expo Go / web) ──────────────────────────────────────
        if (Platform.OS !== 'ios' || !isHealthKitAvailable()) {
          if (!cancelled) {
            setHistory(buildMockHistory(days));
            setIsLoading(false);
          }
          return;
        }

        // ── Real HealthKit path ────────────────────────────────────────────
        const [rhrByDay, sleepByDay, baseline] = await Promise.all([
          fetchRHRByDay(days),
          fetchSleepByDay(days),
          getPersonalRHRBaseline(),
        ]);

        const dates  = buildDateRange(days);
        let result: DayHistory[] = dates.map((date) => {
          const rhr   = rhrByDay[date]   ?? null;
          const sleep = sleepByDay[date] ?? null;

          if (rhr === null && sleep === null) {
            return {
              date,
              dayLabel:        toDayLabel(date),
              score:           null,
              components:      null,
              rhr:             null,
              hrv:             null,
              sleepMinutes:    null,
              sleepEfficiency: null,
            };
          }

          const hd: HealthData = {
            date,
            hrv:              null,   // HRV history not available via HealthKit — Apple Health
                                      // doesn't expose per-day SDNN samples for past dates
                                      // the way it does for RHR/sleep.  History scores are
                                      // therefore based on RHR + sleep only.
                                      // Today's Supabase row will override this via enrichment.
            restingHeartRate: rhr,
            sleepDuration:    sleep?.duration   ?? null,
            deepSleep:        sleep?.deep       ?? null,
            remSleep:         sleep?.rem        ?? null,
            sleepEfficiency:  sleep?.efficiency ?? null,
            stressScore:      null,
            daytimeAvgHR:     null,  // not fetched for history
            steps:            null,  // activity context not used in history
            activeCalories:   null,
            exerciseMinutes:  null,
          };

          const r = calculateReadiness(hd, undefined, baseline);
          return {
            date,
            dayLabel:        toDayLabel(date),
            score:           r.score,
            components:      r.components,
            rhr,
            hrv:             null,   // HealthKit doesn't expose per-day HRV history;
                                     // Supabase enrichment below may fill this in.
            sleepMinutes:    sleep?.duration   ?? null,
            sleepEfficiency: sleep?.efficiency ?? null,
          };
        });

        // ── Supabase enrichment (best-effort, non-blocking) ────────────────
        // For authenticated users, override HealthKit-computed scores with
        // saved Supabase rows.  Today's Supabase row includes HRV, giving a
        // more accurate score than the HealthKit-only (RHR + sleep) path.
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const saved = await fetchHistoryFromSupabase(user.id, days);
            if (saved.length > 0) {
              const savedMap = new Map(saved.map(s => [s.date, s]));
              result = result.map(day => {
                const row = savedMap.get(day.date);
                if (!row) return day;
                return {
                  ...day,
                  score:           row.score,
                  components:      {
                    recovery: row.recovery_score,
                    sleep:    row.sleep_score,
                    stress:   row.stress_score,
                  },
                  rhr:             row.rhr              ?? day.rhr,
                  hrv:             row.hrv              ?? day.hrv,
                  sleepMinutes:    row.sleep_duration   ?? day.sleepMinutes,
                  sleepEfficiency: row.sleep_efficiency ?? day.sleepEfficiency,
                };
              });
            }
          }
        } catch (enrichErr: any) {
          // Non-fatal — HealthKit computation is a perfectly valid fallback
          console.warn('[History] Supabase enrichment failed (non-fatal):', enrichErr.message);
        }

        if (!cancelled) {
          setHistory(result);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load history.');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [days]);

  return { history, isLoading, error };
}
