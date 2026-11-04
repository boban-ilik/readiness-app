/**
 * userScopedStorage
 *
 * Most of the app's local state lives in AsyncStorage, which is scoped to the
 * device rather than the account. Signing out and into a different account
 * therefore inherited the previous user's profile, baselines, cycle entries,
 * and Strava tokens — wrong data at best, and a privacy leak at worst.
 *
 * We record which user the on-device data belongs to and wipe it when a
 * different account signs in. The key list itself lives in storageKeys.ts so
 * a newly added per-user key cannot be forgotten by the wipe.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCoachSession } from '@services/coachSession';
import { clearStravaTokens } from '@services/strava';
import { DATA_OWNER_KEY, USER_SCOPED_KEYS, USER_SCOPED_PREFIXES } from './storageKeys';

// Re-export so existing importers (the guard test) keep working. New code
// should import the keys directly from './storageKeys'.
export { DATA_OWNER_KEY, USER_SCOPED_KEYS, USER_SCOPED_PREFIXES };

async function clearUserScopedData(): Promise<void> {
  const all     = await AsyncStorage.getAllKeys();
  const dynamic = all.filter(k => USER_SCOPED_PREFIXES.some(p => k.startsWith(p)));
  await AsyncStorage.multiRemove([...USER_SCOPED_KEYS, ...dynamic]);
  // SecureStore is a separate store from AsyncStorage, so the Strava tokens
  // must be cleared explicitly here too.
  await clearStravaTokens().catch(() => {});
  // The coach session is a module-level singleton, not storage, and the
  // Coach tab reads it first, so it has to be dropped here too.
  clearCoachSession();
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

/**
 * Clear every piece of device-local personal data and forget the owner, for
 * an explicit sign-out. Unlike syncDataOwner (which only wipes on the next
 * account switch), this leaves the phone empty the moment the user signs out.
 */
export async function wipeUserData(): Promise<void> {
  await clearUserScopedData();
  await AsyncStorage.removeItem(DATA_OWNER_KEY).catch(() => {});
}
