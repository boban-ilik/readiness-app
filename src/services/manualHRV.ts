/**
 * manualHRV — the HRV values the user types in by hand, one per local day.
 *
 * Lives in services (not useHealthData) so other services such as readingCheck
 * can read the history without importing a React hook.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateStr } from '@utils/index';

const MANUAL_HRV_KEY_PREFIX = '@readiness/manual_hrv_'; // + YYYY-MM-DD

/** Today's typed-in HRV, or null. */
export async function loadManualHRV(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(`${MANUAL_HRV_KEY_PREFIX}${localDateStr()}`);
    if (!raw) return null;
    const val = parseFloat(raw);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

/** HRV the user typed in over the last `days` days, keyed by local date. */
export async function loadManualHRVByDay(days: number): Promise<Record<string, number>> {
  const dates: string[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(localDateStr(d));
  }
  const out: Record<string, number> = {};
  try {
    const pairs = await AsyncStorage.multiGet(dates.map(d => `${MANUAL_HRV_KEY_PREFIX}${d}`));
    pairs.forEach(([, raw], i) => {
      const v = raw ? parseFloat(raw) : NaN;
      if (!isNaN(v)) out[dates[i]] = v;
    });
  } catch { /* no manual history */ }
  return out;
}

export async function saveManualHRV(value: number): Promise<void> {
  await AsyncStorage.setItem(`${MANUAL_HRV_KEY_PREFIX}${localDateStr()}`, String(value));
}

export async function removeManualHRV(): Promise<void> {
  await AsyncStorage.removeItem(`${MANUAL_HRV_KEY_PREFIX}${localDateStr()}`);
}
