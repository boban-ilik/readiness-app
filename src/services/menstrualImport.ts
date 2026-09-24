/**
 * Menstrual-flow import from Apple Health.
 *
 * Reads HKCategoryTypeIdentifierMenstrualFlow samples through
 * getMenstrualFlowSamples, which is added to react-native-health by
 * patches/react-native-health+1.19.0.patch (applied on postinstall).
 */

import { Platform } from 'react-native';
import { localDateStr } from '@utils/index';

// react-native-health is only available on iOS native builds.
// We lazy-import to prevent crashes on web/Android/Expo Go.
let AppleHealthKit: any = null;

if (Platform.OS === 'ios') {
  try {
    // react-native-health uses `module.exports = HealthKit` (CommonJS),
    // so we take the module itself, NOT .default (which would be undefined).
    const rnh = require('react-native-health');
    const candidate = rnh.default ?? rnh;
    // Only mark as available if the native module is actually linked
    // (i.e. initHealthKit is a real function, not missing from NativeModules)
    if (typeof candidate?.initHealthKit === 'function') {
      AppleHealthKit = candidate;
    }
  } catch {
    // Not available (Expo Go / web). Callers get false / [].
  }
}

export type MenstrualFlowValue = 'unspecified' | 'light' | 'medium' | 'heavy' | 'none';

export interface MenstrualFlowSample {
  startDate: string; // ISO
  endDate: string;   // ISO
  value: MenstrualFlowValue;
  isCycleStart: boolean;
}

/** Days without flow before a flow day counts as a new period start. */
export const MIN_GAP_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from a to b (both YYYY-MM-DD), DST-safe. */
function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDay(b).getTime() - parseLocalDay(a).getTime()) / DAY_MS);
}

/** Local calendar days a sample covers. An end exactly at midnight does not add the next day. */
function flowDaysOf(sample: MenstrualFlowSample): string[] {
  const start = new Date(sample.startDate);
  const end = new Date(sample.endDate);
  if (isNaN(start.getTime())) return [];
  const first = localDateStr(start);
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) return [first];
  const last = localDateStr(new Date(end.getTime() - 1));
  const days: string[] = [];
  const cursor = parseLocalDay(first);
  const lastDay = parseLocalDay(last);
  while (cursor.getTime() <= lastDay.getTime()) {
    days.push(localDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Samples -> period start dates (local YYYY-MM-DD, ascending, unique).
 *
 * A start is the local day of a sample flagged isCycleStart, or the first
 * flow day after at least `minGapDays` days with no flow. Samples with value
 * "none" are ignored entirely.
 *
 * `windowStart` is the beginning of the queried range. When given, the
 * earliest flow day only counts as a gap-based start if at least `minGapDays`
 * days from windowStart (inclusive) precede it (otherwise it may be the tail
 * of a period that began before the window). When omitted, the earliest flow
 * day counts as a start.
 */
export function derivePeriodStarts(
  samples: MenstrualFlowSample[],
  options: { windowStart?: Date; minGapDays?: number } = {},
): string[] {
  const minGap = options.minGapDays ?? MIN_GAP_DAYS;
  const flowSamples = samples.filter((s) => s.value !== 'none');

  const starts = new Set<string>();
  const flowDays = new Set<string>();

  for (const s of flowSamples) {
    const days = flowDaysOf(s);
    days.forEach((d) => flowDays.add(d));
    if (s.isCycleStart && days.length > 0) starts.add(days[0]);
  }

  const sortedDays = Array.from(flowDays).sort();
  // The window's own first day is a no-flow day, so seed with the day before it.
  let previous: string | null = null;
  if (options.windowStart) {
    const beforeWindow = new Date(options.windowStart);
    beforeWindow.setDate(beforeWindow.getDate() - 1);
    previous = localDateStr(beforeWindow);
  }
  for (const day of sortedDays) {
    // "At least minGap days with no flow" between previous and day means
    // the calendar difference is minGap + 1 or more.
    if (previous === null || daysBetween(previous, day) > minGap) starts.add(day);
    previous = day;
  }

  return Array.from(starts).sort();
}

/**
 * Ask for read access to menstrual flow. Calling initHealthKit again with a
 * different read set only prompts for types that are still undetermined.
 */
export async function requestMenstrualPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return false;
  return new Promise((resolve) => {
    try {
      AppleHealthKit.initHealthKit(
        { permissions: { read: ['MenstrualFlow'], write: [] } },
        (error: string) => resolve(!error),
      );
    } catch {
      resolve(false);
    }
  });
}

/** Period start dates from the last `days` days of Apple Health data. [] on any failure. */
export async function fetchPeriodStartsFromHealth(days = 200): Promise<string[]> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return [];
  if (typeof AppleHealthKit.getMenstrualFlowSamples !== 'function') return [];

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  try {
    const samples = await new Promise<MenstrualFlowSample[]>((resolve, reject) => {
      AppleHealthKit.getMenstrualFlowSamples(
        { startDate: start.toISOString(), endDate: end.toISOString(), ascending: true },
        (error: string, results: MenstrualFlowSample[]) => {
          if (error) reject(error);
          else resolve(Array.isArray(results) ? results : []);
        },
      );
    });
    return derivePeriodStarts(samples, { windowStart: start });
  } catch {
    return [];
  }
}
