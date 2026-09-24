/**
 * calibrationReport
 *
 * One-time "your first week" report, shown the day calibration completes.
 * Day 7 is the app's conversion moment: baselines have just become personal,
 * the trial is about to lapse, and this is the only point where the app can
 * show the user the asset it built for them before asking them to keep it.
 *
 * The seen-flag is user-scoped (registered in userScopedStorage) so a second
 * account on the same device gets its own report, and a reinstall mid-trial
 * shows it again at worst — acceptable for a purely informational screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CALIBRATION_REPORT_SEEN_KEY = '@readiness/calibration_report_seen';

export async function hasSeenCalibrationReport(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CALIBRATION_REPORT_SEEN_KEY)) !== null;
  } catch {
    // If storage fails, claim "seen" — never risk showing the report on
    // every launch, which would train users to ignore it.
    return true;
  }
}

export async function markCalibrationReportSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(CALIBRATION_REPORT_SEEN_KEY, new Date().toISOString());
  } catch {
    // Non-fatal: the report may show once more on next launch.
  }
}
