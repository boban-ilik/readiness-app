/**
 * Why there is no score today, worked out from what Apple Health returns.
 *
 * iOS never tells an app that read access was turned off; it returns empty
 * results, which look the same as a night the watch didn't sync. Looking back
 * 30 days and at today's steps separates the cases well enough to give the
 * right advice. It is a best guess, never shown as a fact.
 */

export type NoDataReason =
  /** Heart-rate or sleep data exists in the last 30 days, just not for last night */
  | 'missed_night'
  /** Health is readable (steps today) but nothing from a watch in 30 days */
  | 'no_wearable'
  /** Nothing readable at all: Health access off, or a brand-new phone */
  | 'no_health_access';

export function noDataReason(input: {
  hrvSamples:   number;
  rhrDays:   number;
  sleepDays: number;
  stepsToday: number | null;
}): NoDataReason {
  if (input.hrvSamples + input.rhrDays + input.sleepDays > 0) return 'missed_night';
  if ((input.stepsToday ?? 0) > 0) return 'no_wearable';
  return 'no_health_access';
}
