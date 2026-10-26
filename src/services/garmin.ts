/**
 * Garmin Connect as a direct data source.
 *
 * The phone never holds Garmin tokens. Connecting opens Garmin's consent page
 * (URL from the garmin-authorize function, PKCE verifier kept server-side);
 * Garmin redirects to garmin-callback on Supabase, which stores the tokens
 * and bounces back to readiness://garmin-callback. From then on Garmin pushes
 * summaries to Supabase and the app reads its own rows here.
 */

import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';
import { localDateStr } from '@utils/index';
import {
  garminDaysFromRows, workoutFromActivity,
  type GarminDays, type GarminDailyRow, type GarminSleepRow, type GarminHrvRow, type GarminHydrationRow, type GarminActivityRow,
} from '@utils/garminSource';
import type { RawWorkout } from '@services/healthkit';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Fast local mirror of the connection state; the view on Supabase is the truth. */
export const GARMIN_CONNECTED_KEY = '@readiness/garmin_connected';

export interface GarminConnection {
  garminUserId: string;
  permissions:  string[];
  status:       'active' | 'revoked';
  connectedAt:  string;
}

async function callFunction(name: string, body: unknown = {}): Promise<Record<string, unknown>> {
  if (!SUPABASE_URL) throw new Error('[Garmin] Supabase is not configured');
  const attempt = async (jwt: string) => fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}`, apikey: SUPABASE_ANON_KEY },
    body:    JSON.stringify(body),
  });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('[Garmin] Not signed in');
  let res = await attempt(session.access_token);
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (!refreshed.session) throw new Error('[Garmin] Session expired, please sign in again');
    res = await attempt(refreshed.session.access_token);
  }
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) throw new Error((json.error as string) ?? `${name} returned ${res.status}`);
  return json;
}

/** Opens Garmin's consent page in the browser. The callback finishes the job. */
export async function startGarminConnect(): Promise<void> {
  const { url } = await callFunction('garmin-authorize');
  if (typeof url !== 'string') throw new Error('[Garmin] No authorisation URL');
  await Linking.openURL(url);
}

/** Tells Garmin, deletes every stored Garmin row, forgets the local flag. */
export async function disconnectGarmin(): Promise<void> {
  await callFunction('garmin-disconnect');
  await setConnectedFlag(false);
  await clearBaselineCaches();
}

async function setConnectedFlag(on: boolean): Promise<void> {
  await AsyncStorage.setItem(GARMIN_CONNECTED_KEY, on ? '1' : '0').catch(() => {});
}

/** The cached flag, for the hot paths that must not wait on the network. */
export async function isGarminConnected(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(GARMIN_CONNECTED_KEY)) === '1'; } catch { return false; }
}

/** Reads the connection from Supabase and refreshes the local flag. */
export async function refreshGarminConnection(): Promise<GarminConnection | null> {
  const { data, error } = await supabase
    .from('garmin_connection_status')
    .select('garmin_user_id, permissions, status, connected_at')
    .maybeSingle();
  if (error) { console.warn('[Garmin] connection read failed:', error.message); return null; }
  const conn = data && data.status === 'active'
    ? { garminUserId: data.garmin_user_id, permissions: data.permissions ?? [], status: data.status, connectedAt: data.connected_at }
    : null;
  const was = await isGarminConnected();
  await setConnectedFlag(!!conn);
  // The HRV baseline changes meaning with the source (RMSSD vs SDNN), so a
  // change of source must not reuse yesterday's cached number.
  if (was !== !!conn) await clearBaselineCaches();
  return conn;
}

async function clearBaselineCaches(): Promise<void> {
  await AsyncStorage.multiRemove(['@readiness/rhr_baseline', '@readiness/hrv_baseline', '@readiness/phase_baseline_v1']).catch(() => {});
}

function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateStr(d);
}

/** The last `days` days of Garmin summaries for the signed-in user, as per-day maps. */
export async function fetchGarminDays(days: number): Promise<GarminDays> {
  const since = sinceDate(days);
  const [daily, sleep, hrv, hydration] = await Promise.all([
    supabase.from('garmin_daily').select('calendar_date, resting_hr, steps, active_kcal, avg_stress, moderate_sec, vigorous_sec').gte('calendar_date', since),
    supabase.from('garmin_sleep').select('calendar_date, start_time, duration_sec, deep_sec, rem_sec, awake_sec, validation').gte('calendar_date', since),
    supabase.from('garmin_hrv').select('calendar_date, last_night_avg').gte('calendar_date', since),
    supabase.from('garmin_hydration').select('calendar_date, fluid_ml').gte('calendar_date', since),
  ]);
  return garminDaysFromRows({
    daily:     (daily.data     ?? []) as GarminDailyRow[],
    sleep:     (sleep.data     ?? []) as GarminSleepRow[],
    hrv:       (hrv.data       ?? []) as GarminHrvRow[],
    hydration: (hydration.data ?? []) as GarminHydrationRow[],
  });
}

/** Garmin activities that started on a given local date, as workouts. */
export async function fetchGarminWorkouts(localDate: string): Promise<RawWorkout[]> {
  const start = new Date(localDate + 'T00:00:00');
  const end   = new Date(start.getTime() + 86_400_000);
  const { data } = await supabase
    .from('garmin_activities')
    .select('summary_id, activity_type, activity_name, start_time, duration_sec, active_kcal, avg_hr')
    .gte('start_time', start.toISOString())
    .lt('start_time', end.toISOString());
  return ((data ?? []) as GarminActivityRow[]).map(workoutFromActivity).filter((w): w is RawWorkout => w !== null);
}

/** Today's water from Garmin, in litres, or null. */
export async function fetchGarminWaterToday(): Promise<number | null> {
  const { data } = await supabase.from('garmin_hydration').select('fluid_ml').eq('calendar_date', localDateStr()).maybeSingle();
  return data?.fluid_ml != null ? Math.round(data.fluid_ml / 10) / 100 : null;
}
