/**
 * freeBriefing
 *
 * After the calibration-week trial ends, free users keep one briefing per
 * week. Each one is written from their own numbers, which makes it the best
 * recurring reminder of what Pro does — a weekly taste, not a meter to game.
 *
 * The last-used date is stored per account (the key is in USER_SCOPED_KEYS)
 * so switching accounts cannot smuggle extra briefings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_BRIEFING_KEY = '@readiness/free_briefing_last_used';

const WEEK_MS = 7 * 86_400_000;

export async function canUseFreeBriefing(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(FREE_BRIEFING_KEY);
    if (!raw) return true;
    const last = Number(raw);
    return !Number.isFinite(last) || Date.now() - last >= WEEK_MS;
  } catch {
    // Storage failure should not lock a free user out of their weekly taste.
    return true;
  }
}

export async function markFreeBriefingUsed(): Promise<void> {
  try {
    await AsyncStorage.setItem(FREE_BRIEFING_KEY, String(Date.now()));
  } catch { /* non-fatal */ }
}

/** Whole days until the next free briefing (0 = available now). */
export async function daysUntilNextFreeBriefing(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FREE_BRIEFING_KEY);
    if (!raw) return 0;
    const last = Number(raw);
    if (!Number.isFinite(last)) return 0;
    const remaining = WEEK_MS - (Date.now() - last);
    return remaining <= 0 ? 0 : Math.ceil(remaining / 86_400_000);
  } catch {
    return 0;
  }
}
