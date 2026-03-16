/**
 * useCalibrationStatus
 *
 * Tracks the user's 7-day onboarding calibration period — the window
 * during which the app is still learning personal baselines for HRV, RHR,
 * and sleep. Scores exist from day 1 but become increasingly accurate as
 * more data accumulates.
 *
 * ── What it returns ──────────────────────────────────────────────────────────
 *
 *  isCalibrating  true while daysComplete < CALIBRATION_DAYS
 *  daysComplete   0–7  (days of data collected since onboarding)
 *  daysLeft       7 – daysComplete, clamped to 0
 *  progress       0.0–1.0  fraction of calibration completed
 *
 * ── Storage ───────────────────────────────────────────────────────────────────
 *  @readiness/joined_at  ISO date string written during onboarding Step 6
 *
 * ── Design notes ─────────────────────────────────────────────────────────────
 * We use calendar days (not 24-hour intervals) so a user who installs at
 * 11 PM and checks at 9 AM the next morning already sees "Day 2" — which
 * feels correct since the device would have collected a full night of data.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const JOINED_AT_KEY      = '@readiness/joined_at';
export const CALIBRATION_DAYS   = 7;

export interface CalibrationStatus {
  /** True during the first 7 calendar days after onboarding. */
  isCalibrating: boolean;
  /** How many complete calendar days of data have been collected (0–7). */
  daysComplete:  number;
  /** Days remaining until calibration is done (0–7). */
  daysLeft:      number;
  /** 0.0–1.0 fraction for progress indicators. */
  progress:      number;
  /** True while the join date is still loading from storage. */
  isLoading:     boolean;
}

/** Difference in whole calendar days between two dates (today - start). */
function calendarDaysSince(isoDate: string): number {
  const start = new Date(isoDate);
  const today = new Date();
  // Strip time components to compare pure dates
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((todayDay - startDay) / 86_400_000));
}

export function useCalibrationStatus(): CalibrationStatus {
  const [status, setStatus] = useState<CalibrationStatus>({
    isCalibrating: false,
    daysComplete:  0,
    daysLeft:      0,
    progress:      1,
    isLoading:     true,
  });

  useEffect(() => {
    (async () => {
      const joinedAt = await AsyncStorage.getItem(JOINED_AT_KEY);

      if (!joinedAt) {
        // No join date — either a legacy install or dev mode; don't show banner.
        setStatus({ isCalibrating: false, daysComplete: 7, daysLeft: 0, progress: 1, isLoading: false });
        return;
      }

      const daysComplete  = Math.min(calendarDaysSince(joinedAt), CALIBRATION_DAYS);
      const daysLeft      = Math.max(0, CALIBRATION_DAYS - daysComplete);
      const isCalibrating = daysComplete < CALIBRATION_DAYS;
      const progress      = daysComplete / CALIBRATION_DAYS;

      setStatus({ isCalibrating, daysComplete, daysLeft, progress, isLoading: false });
    })();
  }, []);

  return status;
}
