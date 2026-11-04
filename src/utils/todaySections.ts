/**
 * Pure rules for the regrouped Today screen (plans/today-redesign.md):
 * which single alert the alert slot shows, when the slim Pro banner shows,
 * and the one-line summary of the folded "This week" section.
 */

import type { ReadinessForecast } from '@services/readinessForecast';

export type TodayAlertKey = 'illness' | 'illnessNudge' | 'readingCheck' | 'overtraining' | 'calibration';

/** Most urgent first. Only one alert renders per day. */
export const TODAY_ALERT_ORDER: readonly TodayAlertKey[] = [
  'illness', 'illnessNudge', 'readingCheck', 'overtraining', 'calibration',
];

export function pickTodayAlert(active: Partial<Record<TodayAlertKey, boolean>>): TodayAlertKey | null {
  return TODAY_ALERT_ORDER.find(k => active[k]) ?? null;
}

/** The last days of the free Pro week always show the banner, undismissable. */
export const TRIAL_BANNER_DAYS = 3;

export type ProBannerMode = 'trial' | 'upsell' | null;

/**
 * Free users see one slim banner under the ring: every day in the last
 * TRIAL_BANNER_DAYS of the trial, otherwise once per day until dismissed.
 */
export function proBannerMode(input: {
  isPro: boolean;
  hasUsableScore: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  dismissedDay: string | null;
  today: string;
}): ProBannerMode {
  const { isPro, hasUsableScore, isTrialActive, trialDaysLeft, dismissedDay, today } = input;
  if (isPro && !isTrialActive) return null;
  if (!hasUsableScore) return null;
  if (isTrialActive && trialDaysLeft <= TRIAL_BANNER_DAYS) return 'trial';
  if (isTrialActive) return null;
  return dismissedDay === today ? null : 'upsell';
}

/** One line under the folded "This week" header, from what the screen already has. */
export function weekSummary(input: {
  isPro: boolean;
  forecast: ReadinessForecast | null;
  lastWorkoutName: string | null;
  eventsTaggedToday: number;
}): string {
  const { isPro, forecast, lastWorkoutName, eventsTaggedToday } = input;
  const parts: string[] = [];
  if (isPro && forecast) {
    const t = forecast[0];
    const trend = t.trend === 'up' ? 'rising' : t.trend === 'down' ? 'easing' : 'steady';
    parts.push(`${t.label} likely ${Math.round(t.score)}, ${trend}`);
  }
  if (lastWorkoutName) parts.push(`Last workout: ${lastWorkoutName}`);
  parts.push(eventsTaggedToday > 0
    ? `${eventsTaggedToday} ${eventsTaggedToday === 1 ? 'tag' : 'tags'} today`
    : 'Tag today');
  if (!isPro) parts.push('Trend and forecast are Pro');
  return parts.join(' · ');
}
