/**
 * useRatingPrompt
 *
 * Asks for an App Store rating exactly once, at the single best moment the
 * product has: the day calibration completes, scores become personal, and the
 * user has just finished their first full week with the app.
 *
 * The guard flag is deliberately device-level rather than user-scoped —
 * iOS rate-limits the sheet per device anyway, and asking the same person
 * again because they signed into a second account would read as nagging.
 *
 * StoreReview.requestReview() is fire-and-forget by design: iOS decides
 * whether the sheet actually appears, so this must never gate app behaviour.
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const PROMPTED_KEY = '@readiness/rating_prompted';
const CALIBRATION_DAYS = 7;

export function useRatingPrompt(daysComplete: number): void {
  // One attempt per app session even if the effect re-fires while the
  // AsyncStorage write is still in flight.
  const attempted = useRef(false);

  useEffect(() => {
    if (daysComplete < CALIBRATION_DAYS || attempted.current) return;

    let cancelled = false;
    (async () => {
      try {
        const already = await AsyncStorage.getItem(PROMPTED_KEY);
        if (already || cancelled) return;
        attempted.current = true;
        await AsyncStorage.setItem(PROMPTED_KEY, new Date().toISOString());
        if (await StoreReview.hasAction()) {
          await StoreReview.requestReview();
        }
      } catch {
        // Never let a review-sheet failure surface anywhere.
      }
    })();

    return () => { cancelled = true; };
  }, [daysComplete]);
}
