/**
 * profileSync
 *
 * Mirrors the locally stored profile to Supabase so it belongs to the account
 * rather than the phone. Without this, reinstalling or signing in on a second
 * device meant redoing onboarding and losing name, age, sex, height, weight,
 * goal, and training frequency.
 *
 * AsyncStorage stays the source of truth at read time — every screen already
 * reads from it and it works offline. Supabase is the durable copy: pushed
 * when the profile changes, pulled when a device has no local profile.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';

// Keys are duplicated rather than imported to avoid a circular dependency
// between onboarding.tsx, userProfile.ts, and this module.
const NAME_KEY          = '@readiness/user_name';
const FREQ_KEY          = '@readiness/training_frequency';
const DEVICE_KEY        = '@readiness/device_type';
const JOINED_AT_KEY     = '@readiness/joined_at';
const ONBOARDING_KEY    = '@readiness/onboarding_complete';
const PROFILE_AGE_KEY   = '@readiness/profile_age';
const PROFILE_SEX_KEY   = '@readiness/profile_sex';
const PROFILE_GOAL_KEY  = '@readiness/profile_goal';
const PROFILE_HEIGHT_KEY = '@readiness/profile_height_cm';
const PROFILE_WEIGHT_KEY = '@readiness/profile_weight_kg';

interface ProfileRow {
  name:               string | null;
  age:                number | null;
  sex:                string | null;
  height_cm:          number | null;
  weight_kg:          number | null;
  training_frequency: string | null;
  primary_goal:       string | null;
  device_type:        string | null;
  onboarded_at:       string | null;
}

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pushes the device's profile to Supabase. Safe to call often — it upserts.
 * Failures are swallowed: a profile that didn't sync is recoverable, a crash
 * during onboarding is not.
 */
export async function pushProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      name, freq, device, joinedAt, age, sex, goal, height, weight,
    ] = await AsyncStorage.multiGet([
      NAME_KEY, FREQ_KEY, DEVICE_KEY, JOINED_AT_KEY,
      PROFILE_AGE_KEY, PROFILE_SEX_KEY, PROFILE_GOAL_KEY,
      PROFILE_HEIGHT_KEY, PROFILE_WEIGHT_KEY,
    ]).then(pairs => pairs.map(([, v]) => v));

    const row: ProfileRow & { user_id: string; updated_at: string } = {
      user_id:            user.id,
      name:               name || null,
      age:                num(age),
      sex:                sex || null,
      height_cm:          num(height),
      weight_kg:          num(weight),
      training_frequency: freq || null,
      primary_goal:       goal || null,
      device_type:        device || null,
      onboarded_at:       joinedAt || null,
      updated_at:         new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(row, { onConflict: 'user_id' });

    if (error) console.warn('[ProfileSync] push failed (non-fatal):', error.message);
  } catch (e: any) {
    console.warn('[ProfileSync] push failed (non-fatal):', e?.message ?? e);
  }
}

/**
 * Restores a profile from Supabase onto a device that doesn't have one —
 * a reinstall, or a second phone.
 *
 * Only writes keys that are currently empty, so a local profile is never
 * overwritten by a staler server copy.
 *
 * @returns true if a profile was restored and onboarding can be skipped
 */
export async function pullProfile(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return false;

    const row = data as ProfileRow;

    // Nothing worth restoring — treat as a genuinely new user.
    if (!row.onboarded_at) return false;

    const writes: [string, string][] = [];
    const put = (key: string, value: string | number | null) => {
      if (value === null || value === undefined || value === '') return;
      writes.push([key, String(value)]);
    };

    put(NAME_KEY,           row.name);
    put(FREQ_KEY,           row.training_frequency);
    put(DEVICE_KEY,         row.device_type);
    put(JOINED_AT_KEY,      row.onboarded_at);
    put(PROFILE_AGE_KEY,    row.age);
    put(PROFILE_SEX_KEY,    row.sex);
    put(PROFILE_GOAL_KEY,   row.primary_goal);
    put(PROFILE_HEIGHT_KEY, row.height_cm);
    put(PROFILE_WEIGHT_KEY, row.weight_kg);

    // Don't clobber anything the device already knows.
    const existing = await AsyncStorage.multiGet(writes.map(([k]) => k));
    const empty    = new Set(existing.filter(([, v]) => !v).map(([k]) => k));
    const toWrite  = writes.filter(([k]) => empty.has(k));

    if (toWrite.length > 0) await AsyncStorage.multiSet(toWrite);

    // The account has completed onboarding before, so don't ask again.
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    return true;
  } catch (e: any) {
    console.warn('[ProfileSync] pull failed (non-fatal):', e?.message ?? e);
    return false;
  }
}
