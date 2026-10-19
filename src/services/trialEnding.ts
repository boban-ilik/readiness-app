/** Once-per-account flag for the trial-ending card (user-scoped). */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRIAL_ENDING_SEEN_KEY = '@readiness/trial_ending_seen';

export async function hasDismissedTrialEnding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TRIAL_ENDING_SEEN_KEY)) !== null;
  } catch {
    return true;
  }
}

export async function dismissTrialEnding(): Promise<void> {
  await AsyncStorage.setItem(TRIAL_ENDING_SEEN_KEY, new Date().toISOString()).catch(() => {});
}
