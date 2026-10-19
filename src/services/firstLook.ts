/**
 * firstLook
 *
 * Whether a new user already has watch history in Apple Health (so the
 * "calibrating" week is pointless for them), and the once-only flag for the
 * first-look sheet. The flag is user-scoped, like the calibration report's.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRHRByDay } from '@services/healthkit';
import { MIN_DAYS_FOR_RANGE } from '@utils/readingCheck';

export const FIRST_LOOK_SEEN_KEY = '@readiness/first_look_seen';

/** A week or more of resting heart rate in the last 30 days. */
export async function hasWatchHistory(): Promise<boolean> {
  try {
    return Object.keys(await fetchRHRByDay(30)).length >= MIN_DAYS_FOR_RANGE;
  } catch {
    return false;
  }
}

export async function hasSeenFirstLook(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FIRST_LOOK_SEEN_KEY)) !== null;
  } catch {
    return true;  // never risk showing it on every launch
  }
}

export async function markFirstLookSeen(): Promise<void> {
  await AsyncStorage.setItem(FIRST_LOOK_SEEN_KEY, new Date().toISOString()).catch(() => {});
}
