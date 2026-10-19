/**
 * When to warn that the free Pro week is ending: on the calendar day before
 * it ends, and on the day itself. Calendar days, not hours, so "tomorrow"
 * means tomorrow on the user's clock.
 */

import { localDateStr } from './index';

export function trialEndingWhen(trialEndsAt: number | null, now: Date = new Date()): 'today' | 'tomorrow' | null {
  if (trialEndsAt == null || trialEndsAt <= now.getTime()) return null;
  const end      = localDateStr(new Date(trialEndsAt));
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (end === localDateStr(now))      return 'today';
  if (end === localDateStr(tomorrow)) return 'tomorrow';
  return null;
}

/** "Pro · 5 days left" for the Today header. */
export function trialPillText(daysLeft: number): string {
  return `Pro · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
}
