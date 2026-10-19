/**
 * Which features a user has opened at least once, so the first week's
 * "New today" line can point at one they haven't found. User-scoped.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const OPENED_FEATURES_KEY = '@readiness/opened_features';

export type Feature = 'coach' | 'trend';

export async function loadOpenedFeatures(): Promise<Record<Feature, boolean>> {
  try {
    const raw  = await AsyncStorage.getItem(OPENED_FEATURES_KEY);
    const seen = raw ? (JSON.parse(raw) as Partial<Record<Feature, boolean>>) : {};
    return { coach: !!seen.coach, trend: !!seen.trend };
  } catch {
    // Unknown: claim opened, so the line never nags about a feature in use.
    return { coach: true, trend: true };
  }
}

export async function markFeatureOpened(f: Feature): Promise<void> {
  try {
    const raw  = await AsyncStorage.getItem(OPENED_FEATURES_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    if (seen[f]) return;
    await AsyncStorage.setItem(OPENED_FEATURES_KEY, JSON.stringify({ ...seen, [f]: true }));
  } catch {
    // Best effort.
  }
}
