/**
 * Pure helpers for Garmin as a data source: turning the rows the app reads
 * from Supabase into the shapes the score, history and training load use.
 *
 * Garmin's overnight HRV is RMSSD; Apple Health's is SDNN. They are not the
 * same measure, so when Garmin is connected its HRV history stands alone and
 * is never averaged with Apple or typed-in values.
 */

import type { HealthData } from '@/types/index';
import type { SleepSummary } from './sleepSamples';

export interface GarminDailyRow   { calendar_date: string; resting_hr: number | null; steps: number | null; active_kcal: number | null; avg_stress: number | null; moderate_sec: number | null; vigorous_sec: number | null }
export interface GarminSleepRow   { calendar_date: string; start_time: string | null; duration_sec: number; deep_sec: number | null; rem_sec: number | null; awake_sec: number | null; validation: string | null }
export interface GarminHrvRow     { calendar_date: string; last_night_avg: number | null }
export interface GarminHydrationRow { calendar_date: string; fluid_ml: number | null }
export interface GarminActivityRow { summary_id: string; activity_type: string | null; activity_name: string | null; start_time: string | null; duration_sec: number | null; active_kcal: number | null; avg_hr: number | null }

export interface GarminDays {
  rhr:       Record<string, number>;
  hrv:       Record<string, number>;
  sleep:     Record<string, SleepSummary>;
  stress:    Record<string, number>;
  steps:     Record<string, number>;
  hydration: Record<string, number>;   // litres
}

/** Sleep entered by hand on Garmin Connect has no device data behind it. */
const UNTRUSTED_SLEEP = new Set(['MANUAL']);

export function sleepFromRow(r: GarminSleepRow): SleepSummary | null {
  if (!r.duration_sec || r.duration_sec < 60 || (r.validation && UNTRUSTED_SLEEP.has(r.validation))) return null;
  const asleep = r.duration_sec;
  const awake  = r.awake_sec ?? 0;
  const start  = r.start_time ? new Date(r.start_time) : null;
  return {
    duration:   Math.round(asleep / 60),
    deep:       r.deep_sec == null ? null : Math.round(r.deep_sec / 60),
    rem:        r.rem_sec  == null ? null : Math.round(r.rem_sec / 60),
    efficiency: asleep + awake > 0 ? Math.round((asleep / (asleep + awake)) * 100) : null,
    ...(start ? { start: start.toISOString(), end: new Date(start.getTime() + (asleep + awake) * 1000).toISOString() } : {}),
  };
}

/** Rows (any order) to per-day maps. Two sleeps on one date: the longer wins. */
export function garminDaysFromRows(input: {
  daily: GarminDailyRow[]; sleep: GarminSleepRow[]; hrv: GarminHrvRow[]; hydration: GarminHydrationRow[];
}): GarminDays {
  const out: GarminDays = { rhr: {}, hrv: {}, sleep: {}, stress: {}, steps: {}, hydration: {} };
  for (const d of input.daily) {
    if (d.resting_hr != null) out.rhr[d.calendar_date] = d.resting_hr;
    if (d.avg_stress != null && d.avg_stress > 0) out.stress[d.calendar_date] = d.avg_stress;
    if (d.steps != null) out.steps[d.calendar_date] = d.steps;
  }
  for (const h of input.hrv) if (h.last_night_avg != null && h.last_night_avg > 0) out.hrv[h.calendar_date] = h.last_night_avg;
  for (const s of input.sleep) {
    const summary = sleepFromRow(s);
    if (!summary) continue;
    const existing = out.sleep[s.calendar_date];
    if (!existing || summary.duration > existing.duration) out.sleep[s.calendar_date] = summary;
  }
  for (const w of input.hydration) if (w.fluid_ml != null) out.hydration[w.calendar_date] = Math.round(w.fluid_ml / 10) / 100;
  return out;
}

/** Today's HealthData with Garmin's values laid over what Apple Health gave. */
export function overlayGarminToday(base: HealthData | null, days: GarminDays, today: string): HealthData | null {
  const sleep = days.sleep[today];
  const hrv   = days.hrv[today];
  const rhr   = days.rhr[today];
  const stress = days.stress[today];
  if (sleep == null && hrv == null && rhr == null && stress == null) return base;
  const empty: HealthData = {
    date: today, hrv: null, restingHeartRate: null, sleepDuration: null, deepSleep: null, remSleep: null,
    sleepEfficiency: null, stressScore: null, daytimeAvgHR: null, steps: null, activeCalories: null, exerciseMinutes: null,
  };
  const out: HealthData = { ...(base ?? empty) };
  if (hrv != null)    { out.hrv = hrv; out.hrvSource = 'garmin'; }
  if (rhr != null)    out.restingHeartRate = rhr;
  if (stress != null) out.stressScore = stress;
  if (sleep) {
    out.sleepDuration   = sleep.duration;
    out.deepSleep       = sleep.deep;
    out.remSleep        = sleep.rem;
    out.sleepEfficiency = sleep.efficiency;
  }
  return out;
}

/** A Garmin activity as the training-load code expects a workout. */
export function workoutFromActivity(a: GarminActivityRow): { activityName: string; durationSecs: number; calories: number | null; startDate: string; endDate: string } | null {
  if (!a.start_time || !a.duration_sec) return null;
  const start = new Date(a.start_time);
  const name  = (a.activity_type ?? 'activity').toLowerCase().replace(/_/g, ' ');
  return {
    activityName: name,
    durationSecs: a.duration_sec,
    calories:     a.active_kcal,
    startDate:    start.toISOString(),
    endDate:      new Date(start.getTime() + a.duration_sec * 1000).toISOString(),
  };
}
