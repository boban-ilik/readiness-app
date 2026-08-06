/**
 * userScopedStorage
 *
 * Most of the app's local state lives in AsyncStorage, which is scoped to the
 * device rather than the account. Signing out and into a different account
 * therefore inherited the previous user's profile, baselines, cycle entries,
 * and Strava tokens — wrong data at best, and a privacy leak at worst.
 *
 * We record which user the on-device data belongs to and wipe it when a
 * different account signs in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tracks which Supabase user the locally stored data belongs to. */
export const DATA_OWNER_KEY = '@readiness/data_owner_id';

/**
 * Every key holding data about a specific person. Anything genuinely global
 * (dev flags, app-level preferences) is deliberately excluded.
 *
 * Keep this in sync when adding new per-user storage.
 */
const USER_SCOPED_KEYS = [
  // Onboarding + profile
  '@readiness/onboarding_complete',
  '@readiness/joined_at',
  '@readiness/user_name',
  '@readiness/device_type',
  '@readiness/training_frequency',
  '@readiness/profile_age',
  '@readiness/profile_sex',
  '@readiness/profile_goal',
  '@readiness/profile_height_cm',
  '@readiness/profile_weight_kg',
  '@readiness/profile_photo_uri',

  // Personal baselines
  '@readiness/hrv_baseline',
  '@readiness/rhr_baseline',

  // Cycle tracking — sensitive
  '@readiness/cycle_enabled',
  '@readiness/cycle_entries',
  '@readiness/cycle_length',
  '@readiness/cycle_period_length',

  // Streaks
  '@readiness/best_streak',

  // Strava OAuth — must never cross accounts
  '@readiness/strava_access_token',
  '@readiness/strava_refresh_token',
  '@readiness/strava_expires_at',
  '@readiness/strava_athlete_name',

  // Notification preferences and dedupe state
  '@readiness/notif_digest_enabled',
  '@readiness/notif_digest_hour',
  '@readiness/notif_digest_minute',
  '@readiness/notif_threshold_enabled',
  '@readiness/notif_threshold_value',
  '@readiness/notif_threshold_last_date',
  '@readiness/notif_hrv_drop_enabled',
  '@readiness/notif_hrv_drop_last_date',
  '@readiness/notif_rhr_spike_enabled',
  '@readiness/notif_rhr_spike_last_date',
  '@readiness/notif_trend_decline_enabled',
  '@readiness/notif_trend_decline_last_date',
  '@readiness/notif_last_score',
  '@readiness/notif_score_history',

  // Coach conversation — contains health details and whatever the user typed
  '@readiness/coach_chat_v1',
];

/**
 * Keys suffixed with a date, so they need a prefix sweep rather than an exact
 * match. The briefing cache and its feedback both hold personal health detail:
 * the cached briefing quotes the user's HRV, sleep and heart rate directly.
 */
const USER_SCOPED_PREFIXES = [
  '@readiness/manual_hrv_',
  '@readiness/daily_briefing_v1_',
  '@readiness/briefing_feedback_v1_',
];

async function clearUserScopedData(): Promise<void> {
  const all     = await AsyncStorage.getAllKeys();
  const dynamic = all.filter(k => USER_SCOPED_PREFIXES.some(p => k.startsWith(p)));
  await AsyncStorage.multiRemove([...USER_SCOPED_KEYS, ...dynamic]);
}

/**
 * Call whenever the signed-in user changes.
 *
 * Wipes locally stored personal data if it belongs to a different account.
 * On first run after this shipped no owner is recorded, so we adopt the
 * current user rather than deleting their existing data.
 *
 * @returns true if data was wiped
 */
export async function syncDataOwner(userId: string | null): Promise<boolean> {
  if (!userId) return false;

  const owner = await AsyncStorage.getItem(DATA_OWNER_KEY).catch(() => null);

  if (owner === userId) return false;

  const isFirstRun = owner === null;
  if (!isFirstRun) {
    await clearUserScopedData();
  }

  await AsyncStorage.setItem(DATA_OWNER_KEY, userId);
  return !isFirstRun;
}
