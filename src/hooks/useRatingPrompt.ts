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
import { track } from '@services/analytics';

const PROMPTED_KEY = '@readiness/rating_prompted';
const GOOD_DAY_PROMPTED_KEY = '@readiness/rating_prompted_good_day';
const CALIBRATION_DAYS = 7;

// The second ask (1.0.5): a high-score day once the user has a few days of
// scores. Both keys hold the ISO time of their ask, so the two can be kept
// apart: nobody is asked twice within MIN_GAP_DAYS.
export const GOOD_DAY_MIN_SCORE = 75;
export const GOOD_DAY_MIN_DAYS  = 3;
export const MIN_GAP_DAYS       = 14;
const GOOD_DAY_DELAY_MS         = 3_000;   // let the score land before the sheet

const DAY_MS = 86_400_000;

/** Pure: whether another ask is allowed `MIN_GAP_DAYS` after the last one. */
export function gapAllowsAsk(lastAsks: Array<string | null>, now: number): boolean {
  const last = Math.max(0, ...lastAsks.map(t => (t ? Date.parse(t) || 0 : 0)));
  return now - last >= MIN_GAP_DAYS * DAY_MS;
}

/** Pure: is this a good-day moment for someone who has not had that ask yet? */
export function isGoodDayMoment(score: number, daysSinceJoined: number | null): boolean {
  // null = an account from before join dates were recorded: long past day 3
  return score >= GOOD_DAY_MIN_SCORE && (daysSinceJoined === null || daysSinceJoined >= GOOD_DAY_MIN_DAYS);
}

export function useRatingPrompt(daysComplete: number): void {
  // One attempt per app session even if the effect re-fires while the
  // AsyncStorage write is still in flight.
  const attempted = useRef(false);

  useEffect(() => {
    if (daysComplete < CALIBRATION_DAYS || attempted.current) return;

    let cancelled = false;
    (async () => {
      try {
        const [already, goodDay] = await Promise.all([
          AsyncStorage.getItem(PROMPTED_KEY),
          AsyncStorage.getItem(GOOD_DAY_PROMPTED_KEY),
        ]);
        if (already || cancelled) return;
        // Asked on a good day recently: wait, this effect runs again on later launches.
        if (!gapAllowsAsk([goodDay], Date.now())) return;
        attempted.current = true;
        await AsyncStorage.setItem(PROMPTED_KEY, new Date().toISOString());
        if (await StoreReview.hasAction()) {
          track('rating_prompted', { moment: 'day7' });
          await StoreReview.requestReview();
        }
      } catch {
        // Never let a review-sheet failure surface anywhere.
      }
    })();

    return () => { cancelled = true; };
  }, [daysComplete]);
}

/**
 * The good-day ask: once per device, the first time Today shows a score of
 * GOOD_DAY_MIN_SCORE or more from day GOOD_DAY_MIN_DAYS on, a few seconds
 * after the score appears and never while another sheet is open.
 *
 * @param score            today's usable score, or 0 when there is none
 * @param daysSinceJoined  null for accounts without a recorded join date
 * @param blocked          a modal is open, or the join date is still loading
 */
export function useGoodDayRatingPrompt(score: number, daysSinceJoined: number | null, blocked: boolean): void {
  const attempted = useRef(false);

  useEffect(() => {
    if (blocked || attempted.current || !isGoodDayMoment(score, daysSinceJoined)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [goodDay, day7] = await Promise.all([
          AsyncStorage.getItem(GOOD_DAY_PROMPTED_KEY),
          AsyncStorage.getItem(PROMPTED_KEY),
        ]);
        if (goodDay || cancelled || !gapAllowsAsk([day7], Date.now())) return;
        attempted.current = true;
        await AsyncStorage.setItem(GOOD_DAY_PROMPTED_KEY, new Date().toISOString());
        if (await StoreReview.hasAction()) {
          track('rating_prompted', { moment: 'good_day' });
          await StoreReview.requestReview();
        }
      } catch {
        // Never let a review-sheet failure surface anywhere.
      }
    }, GOOD_DAY_DELAY_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [score, daysSinceJoined, blocked]);
}
