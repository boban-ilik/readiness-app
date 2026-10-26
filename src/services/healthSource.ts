/**
 * One place that answers "what does the app know about each day", from
 * Apple Health with Garmin laid over it when a Garmin account is connected.
 *
 * Rule agreed for 1.3: Garmin wins for what it has. Resting heart rate and
 * sleep are the same measure on both, so Garmin replaces Apple per day.
 * HRV is not (Garmin RMSSD, Apple SDNN), so with Garmin connected the HRV
 * history is Garmin's alone.
 */

import { fetchHRVByDay, fetchRHRByDay, fetchSleepByDay, fetchYesterdayWorkouts, type SleepDay, type RawWorkout } from '@services/healthkit';
import { isGarminConnected, fetchGarminDays, fetchGarminWorkouts } from '@services/garmin';
import { localDateStr } from '@utils/index';

const FAIL_SOFT = <T,>(p: Promise<T>, fallback: T) => p.catch(e => { console.warn('[healthSource]', e?.message ?? e); return fallback; });

export async function getRHRByDay(days: number): Promise<Record<string, number>> {
  const apple = await fetchRHRByDay(days);
  if (!(await isGarminConnected())) return apple;
  const garmin = await FAIL_SOFT(fetchGarminDays(days), null);
  return garmin ? { ...apple, ...garmin.rhr } : apple;
}

export async function getHRVByDay(days: number): Promise<Record<string, number>> {
  if (await isGarminConnected()) {
    const garmin = await FAIL_SOFT(fetchGarminDays(days), null);
    if (garmin) return garmin.hrv;
  }
  return fetchHRVByDay(days);
}

export async function getSleepByDay(days: number): Promise<Record<string, SleepDay>> {
  const apple = await fetchSleepByDay(days);
  if (!(await isGarminConnected())) return apple;
  const garmin = await FAIL_SOFT(fetchGarminDays(days), null);
  return garmin ? { ...apple, ...garmin.sleep } : apple;
}

/** Yesterday's sessions: Garmin's when connected and it has any, else Apple Health's. */
export async function getYesterdayWorkouts(): Promise<RawWorkout[]> {
  if (await isGarminConnected()) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const garmin = await FAIL_SOFT(fetchGarminWorkouts(localDateStr(d)), []);
    if (garmin.length > 0) return garmin;
  }
  return fetchYesterdayWorkouts();
}
