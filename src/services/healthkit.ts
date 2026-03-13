/**
 * HealthKit service — reads Apple Watch + Garmin (via Garmin Connect sync) data.
 *
 * Requires a development build (npx expo run:ios).
 * Will not work in Expo Go.
 *
 * Data sources supported:
 *  - Apple Watch (native HRV, RHR, sleep)
 *  - Garmin devices (via Garmin Connect → Apple Health sync)
 *  - iPhone sensors (steps, some HR data)
 */

import { Platform } from 'react-native';
import type { HealthData } from '@types/index';

// react-native-health is only available on iOS native builds.
// We lazy-import to prevent crashes on web/Android/Expo Go.
let AppleHealthKit: any = null;

if (Platform.OS === 'ios') {
  try {
    // react-native-health uses `module.exports = HealthKit` (CommonJS),
    // so we take the module itself — NOT .default (which would be undefined).
    const rnh = require('react-native-health');
    const candidate = rnh.default ?? rnh;
    // Only mark as available if the native module is actually linked
    // (i.e. initHealthKit is a real function, not missing from NativeModules)
    if (typeof candidate?.initHealthKit === 'function') {
      AppleHealthKit = candidate;
    } else {
      console.log('react-native-health: native module not linked. Use npx expo run:ios to test.');
    }
  } catch {
    console.log('react-native-health not available (Expo Go). Use npx expo run:ios to test.');
  }
}

// ─── Availability check ───────────────────────────────────────────────────────

export function isHealthKitAvailable(): boolean {
  return AppleHealthKit !== null;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

// ⚠️  These strings must match the Obj-C key map in
//     RCTAppleHealthKit+TypesAndPermissions.m exactly.
//     'HeartRateVariability' (NOT '...SDNN') is what the library expects.
const READ_PERMISSIONS = [
  'HeartRateVariability',  // → HKQuantityTypeIdentifierHeartRateVariabilitySDNN
  'RestingHeartRate',      // → HKQuantityTypeIdentifierRestingHeartRate
  'SleepAnalysis',         // → HKCategoryTypeIdentifierSleepAnalysis
  'HeartRate',             // → HKQuantityTypeIdentifierHeartRate
  'StepCount',             // → HKQuantityTypeIdentifierStepCount
  'ActiveEnergyBurned',    // → HKQuantityTypeIdentifierActiveEnergyBurned
  'AppleExerciseTime',     // → HKQuantityTypeIdentifierAppleExerciseTime
  'Workout',               // → HKWorkoutType — for training load computation
];

export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return false;

  return new Promise((resolve) => {
    const options = {
      permissions: {
        read: READ_PERMISSIONS,
        write: [],
      },
    };
    AppleHealthKit.initHealthKit(options, (error: string) => {
      if (error) {
        console.error('HealthKit permission error:', error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

export async function fetchTodaysHealthData(): Promise<HealthData | null> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return null;

  const now = new Date();

  // RHR: look back 48 h — Garmin writes yesterday's resting HR after sync
  const rhrStart = new Date(now);
  rhrStart.setHours(rhrStart.getHours() - 48);

  // Sleep: anchor to 6 pm two days ago so we always capture the full sleep session
  // regardless of when you went to bed. HealthKit filters by sample START date,
  // so we need to be earlier than any realistic bedtime.
  const sleepStart = new Date(now);
  sleepStart.setDate(sleepStart.getDate() - 2);
  sleepStart.setHours(18, 0, 0, 0); // 6 pm, two days ago

  const [hrv, rhr, sleep, daytimeHR, steps, activeCalories, exerciseMinutes] = await Promise.allSettled([
    fetchLatestHRV(),                                        // has its own 24 h window
    fetchRestingHeartRate(rhrStart.toISOString(), now.toISOString()),
    fetchSleepData(sleepStart.toISOString(), now.toISOString()),
    fetchDaytimeAvgHR(),                                     // waking-hours HR for stress proxy
    fetchYesterdaySteps(),                                   // yesterday midnight→midnight
    fetchYesterdayActiveCalories(),                          // yesterday active kcal
    fetchYesterdayExerciseMinutes(),                         // yesterday exercise ring minutes
  ]);

  const result: HealthData = {
    date: now.toISOString().split('T')[0],
    hrv:             hrv.status       === 'fulfilled' ? hrv.value               : null,
    restingHeartRate: rhr.status      === 'fulfilled' ? rhr.value               : null,
    sleepDuration:   sleep.status     === 'fulfilled' ? sleep.value?.duration   ?? null : null,
    deepSleep:       sleep.status     === 'fulfilled' ? sleep.value?.deep       ?? null : null,
    remSleep:        sleep.status     === 'fulfilled' ? sleep.value?.rem        ?? null : null,
    sleepEfficiency: sleep.status     === 'fulfilled' ? sleep.value?.efficiency ?? null : null,
    stressScore:     null,            // Garmin stress doesn't sync to Apple Health
    daytimeAvgHR:    daytimeHR.status === 'fulfilled' ? daytimeHR.value         : null,
    steps:           steps.status          === 'fulfilled' ? steps.value          : null,
    activeCalories:  activeCalories.status === 'fulfilled' ? activeCalories.value : null,
    exerciseMinutes: exerciseMinutes.status === 'fulfilled' ? exerciseMinutes.value : null,
  };

  console.log('[Readiness] HealthKit →', `HRV:${result.hrv ?? '—'} RHR:${result.restingHeartRate ?? '—'} Sleep:${result.sleepDuration ?? '—'}min | Steps:${result.steps ?? '—'} ExMins:${result.exerciseMinutes ?? '—'}`);

  return result;
}

// ─── Individual metric fetchers ───────────────────────────────────────────────

function fetchLatestHRV(): Promise<number | null> {
  // Look back 7 days — catches infrequent syncs and tests if SDNN exists at all.
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateVariabilitySamples(
      {
        startDate: startDate.toISOString(),
        ascending: false,
        limit: 5, // grab a few so we can log them
      },
      (err: any, results: any[]) => {
        if (err) {
          console.log('[Readiness] HRV error:', err);
          return resolve(null);
        }
        if (!results?.length) {
          console.log('[Readiness] HRV: no samples in last 7 days');
          return resolve(null);
        }
        console.log('[Readiness] HRV samples (raw):', results.slice(0, 2));
        // HealthKit stores HRV SDNN in seconds; convert to ms
        const valueSeconds = results[0].value;
        const valueMs = valueSeconds > 1
          ? Math.round(valueSeconds)          // already in ms (some wrappers convert)
          : Math.round(valueSeconds * 1000);  // raw seconds → ms
        resolve(valueMs);
      }
    );
  });
}

function fetchRestingHeartRate(startDate: string, endDate: string): Promise<number | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getRestingHeartRate(
      { startDate, endDate, ascending: false, limit: 1 },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve(null);
        resolve(Math.round(results[0].value));
      }
    );
  });
}

// ─── Baseline fetchers ────────────────────────────────────────────────────────

/**
 * Returns up to `days` days of daily resting heart rate values.
 * Used to compute a personal RHR baseline (median of last 30 days).
 */
export function fetchRHRHistory(days = 30): Promise<number[]> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return Promise.resolve([]);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return new Promise((resolve) => {
    AppleHealthKit.getRestingHeartRate(
      {
        startDate: start.toISOString(),
        endDate:   end.toISOString(),
        ascending: true,
        limit: days,
      },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve([]);
        resolve(results.map((r: any) => Math.round(r.value)));
      }
    );
  });
}

/**
 * Returns up to `days` daily HRV SDNN values (ms).
 * Used to compute a personal HRV baseline (trimmed median of last 30 days).
 * Multiple samples per day are de-duplicated — we keep the most recent reading
 * each day, matching the overnight measurement that `fetchLatestHRV` uses.
 */
export function fetchHRVHistory(days = 30): Promise<number[]> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return Promise.resolve([]);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateVariabilitySamples(
      {
        startDate: start.toISOString(),
        endDate:   end.toISOString(),
        ascending: false,           // most-recent first so we keep the latest per day
        limit:     days * 2,        // buffer for days with multiple samples
      },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve([]);

        // One value per calendar day (already descending → first hit per date wins)
        const byDay: Record<string, number> = {};
        for (const r of results) {
          const key = localDateStr(new Date(r.startDate ?? r.endDate));
          if (!(key in byDay)) {
            // Apply the same unit check as fetchLatestHRV:
            // raw seconds → multiply by 1000; already in ms → keep as-is
            const s = r.value as number;
            byDay[key] = s > 1 ? Math.round(s) : Math.round(s * 1000);
          }
        }
        console.log('[Readiness] HRV history samples:', Object.keys(byDay).length);
        resolve(Object.values(byDay));
      },
    );
  });
}

// ─── History fetchers ─────────────────────────────────────────────────────────

/** Local YYYY-MM-DD string (timezone-aware) */
function localDateStr(d: Date): string {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/**
 * Returns daily RHR values for the last N days, keyed by local date (YYYY-MM-DD).
 * Used by the History screen for the 7-day trend.
 */
export function fetchRHRByDay(days: number): Promise<Record<string, number>> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return Promise.resolve({});

  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return new Promise((resolve) => {
    AppleHealthKit.getRestingHeartRate(
      { startDate: start.toISOString(), endDate: end.toISOString(), ascending: false, limit: days * 3 },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve({});
        const byDay: Record<string, number> = {};
        // Descending order → first entry per date = most recent reading that day
        for (const r of results) {
          const key = localDateStr(new Date(r.startDate ?? r.endDate));
          if (!(key in byDay)) byDay[key] = Math.round(r.value);
        }
        resolve(byDay);
      },
    );
  });
}

export interface SleepDay {
  duration:   number;  // total asleep minutes
  deep:       number;  // deep sleep minutes
  rem:        number;  // REM minutes
  efficiency: number;  // 0–100
}

/**
 * Returns sleep summaries for the last N nights, keyed by wake-up date (YYYY-MM-DD).
 * "Wake-up date" = the calendar date when the sleep session ended (local time).
 * Samples ending at or after 14:00 local time are treated as naps and skipped.
 */
export function fetchSleepByDay(days: number): Promise<Record<string, SleepDay>> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return Promise.resolve({});

  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days + 1)); // +1 day buffer for overnight sessions
  start.setHours(18, 0, 0, 0);

  return new Promise((resolve) => {
    AppleHealthKit.getSleepSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, samples: any[]) => {
        if (err || !samples?.length) return resolve({});

        // Group samples by wake-up date; skip afternoon naps / misattributed chunks
        const groups: Record<string, any[]> = {};
        for (const s of samples) {
          const endDate = new Date(s.endDate);
          if (endDate.getHours() >= 14) continue; // nap / noise
          const key = localDateStr(endDate);
          if (!groups[key]) groups[key] = [];
          groups[key].push(s);
        }

        const result: Record<string, SleepDay> = {};
        for (const [date, daySamples] of Object.entries(groups)) {
          // Guard against Garmin double-counting: it writes both a generic ASLEEP
          // sample AND CORE/DEEP/REM stage samples for the same period. Only count
          // the generic sample when no stage-specific data is present.
          const hasStages = daySamples.some(s =>
            ['CORE', 'DEEP', 'REM', 'ASLEEP_CORE', 'ASLEEP_DEEP', 'ASLEEP_REM'].includes(s.value),
          );

          let asleepMin = 0, deepMin = 0, remMin = 0, inBedMin = 0;
          for (const s of daySamples) {
            const mins = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
            switch (s.value) {
              case 'INBED':
                inBedMin  += mins; break;
              case 'ASLEEP':
              case 'ASLEEP_UNSPECIFIED':
                if (!hasStages) asleepMin += mins; break;  // skip if finer stages exist
              case 'ASLEEP_CORE':
              case 'CORE':
                asleepMin += mins; break;
              case 'ASLEEP_DEEP':
              case 'DEEP':
                deepMin   += mins; asleepMin += mins; break;
              case 'ASLEEP_REM':
              case 'REM':
                remMin    += mins; asleepMin += mins; break;
            }
          }
          if (asleepMin >= 60) { // at least 1 h — filter sensor noise
            result[date] = {
              duration:   Math.round(asleepMin),
              deep:       Math.round(deepMin),
              rem:        Math.round(remMin),
              efficiency: inBedMin > 0 ? Math.round((asleepMin / inBedMin) * 100) : 85,
            };
          }
        }
        resolve(result);
      },
    );
  });
}

/**
 * Fetches raw heart rate samples from today's waking hours (6 am → now),
 * filters out workout-intensity readings (≥ 100 bpm), and returns the
 * average of the remaining "resting-context" samples.
 *
 * Garmin syncs HR samples to Apple Health throughout the day even though it
 * doesn't sync HRV or its proprietary Stress Score. An elevated daytime HR
 * relative to the personal RHR baseline is a valid physiological stress proxy.
 *
 * Returns null if fewer than 5 qualifying samples are found (not enough
 * data to make a meaningful estimate — e.g. user just woke up).
 */
function fetchDaytimeAvgHR(): Promise<number | null> {
  const now   = new Date();
  const start = new Date(now);
  start.setHours(6, 0, 0, 0); // 6 am local time

  // Nothing useful before 6 am or if it's still very early
  if (now <= start) return Promise.resolve(null);

  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateSamples(
      {
        startDate: start.toISOString(),
        endDate:   now.toISOString(),
        ascending: true,
        limit:     500, // more than enough for a day's worth of samples
      },
      (err: any, results: any[]) => {
        if (err || !results?.length) {
          console.log('[Readiness] Daytime HR: no samples', err);
          return resolve(null);
        }

        // Filter to resting-context readings only (exclude workout spikes)
        const restingReadings = results
          .map((r: any) => r.value as number)
          .filter((bpm) => bpm < 100);

        if (restingReadings.length < 5) {
          console.log('[Readiness] Daytime HR: too few resting samples', restingReadings.length);
          return resolve(null);
        }

        const avg = Math.round(
          restingReadings.reduce((sum, bpm) => sum + bpm, 0) / restingReadings.length
        );
        console.log(`[Readiness] Daytime avg HR: ${avg} bpm from ${restingReadings.length} resting samples`);
        resolve(avg);
      }
    );
  });
}

// ─── Yesterday's activity fetchers ───────────────────────────────────────────
// We use midnight-to-midnight yesterday (local time) so the numbers match
// what the user sees in Apple Health: "yesterday's steps", etc.

function getYesterdayWindow(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);          // midnight today = end of yesterday
  const start = new Date(end);
  start.setDate(start.getDate() - 1); // midnight yesterday = start
  return { start, end };
}

/**
 * Shared step-count fetcher with source deduplication.
 * getDailyStepCountSamples exposes per-source metadata so we can pick a single
 * authoritative source (Garmin preferred) and avoid double-counting when
 * multiple devices all write to HealthKit simultaneously.
 */
function fetchStepsDeduped(start: Date, end: Date, label: string): Promise<number | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate: start.toISOString(), endDate: end.toISOString(), ascending: true },
      (err: any, results: any[]) => {
        if (err || !results?.length) {
          // Fall back to simple aggregate — no source filtering but better than null.
          console.log(`[Readiness] ${label} getDailyStepCountSamples failed, falling back:`, err);
          AppleHealthKit.getStepCount(
            { date: start.toISOString() },
            (err2: any, result: any) => {
              if (err2 || result?.value == null) return resolve(null);
              resolve(Math.round(result.value));
            },
          );
          return;
        }

        // Sum per-source quantities across all period buckets.
        const bySource: Record<string, number> = {};
        for (const bucket of results) {
          const sources = bucket.metadata as Array<{
            sourceName?: string;
            sourceId?: string;
            quantity?: number;
          }> | undefined;

          if (sources?.length) {
            for (const s of sources) {
              const name = s.sourceName ?? s.sourceId ?? 'Unknown';
              bySource[name] = (bySource[name] ?? 0) + (s.quantity ?? 0);
            }
          } else {
            bySource['Unknown'] = (bySource['Unknown'] ?? 0) + (bucket.value ?? 0);
          }
        }

        console.log(`[Readiness] ${label} steps by source:`, JSON.stringify(bySource));

        const entries = Object.entries(bySource);
        if (!entries.length) return resolve(null);

        // Prefer Garmin Connect; otherwise take the single highest-count source.
        const garminEntry = entries.find(([src]) =>
          src.toLowerCase().includes('garmin') || src.toLowerCase().includes('connect'),
        );

        let total: number;
        if (garminEntry) {
          total = garminEntry[1];
          console.log(`[Readiness] ${label} → Garmin "${garminEntry[0]}": ${Math.round(total)}`);
        } else {
          entries.sort((a, b) => b[1] - a[1]);
          total = entries[0][1];
          console.log(`[Readiness] ${label} → best source "${entries[0][0]}": ${Math.round(total)}`);
        }

        resolve(Math.round(total));
      },
    );
  });
}

function fetchYesterdaySteps(): Promise<number | null> {
  const { start, end } = getYesterdayWindow();
  return fetchStepsDeduped(start, end, 'Yesterday');
}

function fetchYesterdayActiveCalories(): Promise<number | null> {
  const { start, end } = getYesterdayWindow();
  return new Promise((resolve) => {
    AppleHealthKit.getActiveEnergyBurned(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve(null);
        const total = results.reduce((sum: number, r: any) => sum + (r.value ?? 0), 0);
        resolve(Math.round(total));
      },
    );
  });
}

function fetchYesterdayExerciseMinutes(): Promise<number | null> {
  const { start, end } = getYesterdayWindow();
  return new Promise((resolve) => {
    AppleHealthKit.getAppleExerciseTime(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, results: any[]) => {
        if (err || !results?.length) return resolve(null);
        const total = results.reduce((sum: number, r: any) => sum + (r.value ?? 0), 0);
        resolve(Math.round(total));
      },
    );
  });
}

// ─── Today's activity (in-progress) ──────────────────────────────────────────

export interface TodayActivity {
  steps:          number | null;
  activeCalories: number | null;
  exerciseMinutes: number | null;
}

/**
 * Fetches today's activity metrics from midnight to now.
 * Used alongside yesterday's completed numbers so the user can pace themselves.
 * Uses simpler aggregation than the yesterday fetchers — no source-dedup needed
 * for a "how am I doing today?" glance value.
 */
export async function fetchTodayActivity(): Promise<TodayActivity> {
  const empty: TodayActivity = { steps: null, activeCalories: null, exerciseMinutes: null };
  if (Platform.OS !== 'ios' || !AppleHealthKit) return empty;

  const now   = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0); // midnight today

  const startISO = start.toISOString();
  const endISO   = now.toISOString();

  const [steps, calories, exercise] = await Promise.allSettled([
    // Steps — same source-dedup as yesterday to prevent double-counting
    fetchStepsDeduped(start, now, 'Today'),
    // Active calories
    new Promise<number | null>((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(
        { startDate: startISO, endDate: endISO },
        (err: any, results: any[]) => {
          if (err || !results?.length) return resolve(null);
          resolve(Math.round(results.reduce((s: number, r: any) => s + (r.value ?? 0), 0)));
        },
      );
    }),
    // Exercise ring minutes
    new Promise<number | null>((resolve) => {
      AppleHealthKit.getAppleExerciseTime(
        { startDate: startISO, endDate: endISO },
        (err: any, results: any[]) => {
          if (err || !results?.length) return resolve(null);
          resolve(Math.round(results.reduce((s: number, r: any) => s + (r.value ?? 0), 0)));
        },
      );
    }),
  ]);

  return {
    steps:           steps.status    === 'fulfilled' ? steps.value    : null,
    activeCalories:  calories.status === 'fulfilled' ? calories.value : null,
    exerciseMinutes: exercise.status === 'fulfilled' ? exercise.value : null,
  };
}

// ─── Workout fetchers ─────────────────────────────────────────────────────────

export interface RawWorkout {
  activityName: string;
  durationSecs: number;
  calories:     number | null;
  startDate:    string;
  endDate:      string;
}

/**
 * Fetches workouts from yesterday (midnight-to-midnight local time).
 * Returns an empty array if HealthKit is unavailable or there were no workouts.
 */
export function fetchYesterdayWorkouts(): Promise<RawWorkout[]> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return Promise.resolve([]);

  const { start, end } = getYesterdayWindow();

  return new Promise((resolve) => {
    // This version of react-native-health exposes getAnchoredWorkouts (not getWorkoutSamples).
    // Results are in results.data; each sample uses `start`/`end` (not startDate/endDate).
    // duration is in minutes — multiply by 60 to get seconds.
    AppleHealthKit.getAnchoredWorkouts(
      {
        startDate: start.toISOString(),
        endDate:   end.toISOString(),
        ascending: true,
        limit:     20,
      },
      (err: any, results: any) => {
        const data: any[] = results?.data ?? results ?? [];
        if (err || !data.length) return resolve([]);

        const workouts: RawWorkout[] = data.map((r: any) => {
          // duration field is in minutes in getAnchoredWorkouts
          const durationSecs = r.duration
            ? Math.round(r.duration * 60)
            : Math.round(
                (new Date(r.end ?? r.endDate).getTime() -
                 new Date(r.start ?? r.startDate).getTime()) / 1000,
              );
          return {
            activityName: r.activityName ?? 'Workout',
            durationSecs,
            calories:  r.calories ? Math.round(r.calories) : null,
            startDate: r.start    ?? r.startDate,
            endDate:   r.end      ?? r.endDate,
          };
        });

        console.log('[Readiness] Yesterday workouts:', workouts.map(w => `${w.activityName} ${Math.round(w.durationSecs / 60)}min`).join(', '));
        resolve(workouts);
      },
    );
  });
}

interface SleepSummary {
  duration:   number;  // total asleep minutes
  deep:       number;  // deep sleep minutes
  rem:        number;  // REM minutes
  efficiency: number;  // 0–100
}

function fetchSleepData(startDate: string, endDate: string): Promise<SleepSummary | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getSleepSamples({ startDate, endDate }, (err: any, results: any[]) => {
      if (err) {
        console.log('[Readiness] Sleep error:', JSON.stringify(err));
        return resolve(null);
      }
      if (!results?.length) {
        console.log('[Readiness] Sleep: no samples found');
        return resolve(null);
      }

      // ── Isolate the most recent sleep session ────────────────────────────────
      // The 48-hour fetch window captures multiple nights. Garmin writes data for
      // each night separately, so we sort samples by start time, split into
      // sessions wherever there is a gap > 4 hours (daytime waking period),
      // and take only the final session = last night's sleep.
      const sorted = [...results].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

      const SESSION_GAP_MS = 4 * 60 * 60 * 1000; // 4 h gap = new sleep session
      const sessions: any[][] = [];
      let current: any[] = [];

      for (const s of sorted) {
        if (current.length === 0) {
          current.push(s);
        } else {
          const lastEnd   = new Date(current[current.length - 1].endDate).getTime();
          const thisStart = new Date(s.startDate).getTime();
          if (thisStart - lastEnd > SESSION_GAP_MS) {
            sessions.push(current);
            current = [s];
          } else {
            current.push(s);
          }
        }
      }
      if (current.length > 0) sessions.push(current);

      const session = sessions[sessions.length - 1] ?? [];
      console.log(`[Readiness] Sleep sessions in window: ${sessions.length} — using last (${session.length} samples)`);

      // Debug: show what Garmin wrote for this session
      const dbg: Record<string, { count: number; mins: number }> = {};
      session.forEach((s: any) => {
        const m = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
        const v = String(s.value ?? '?');
        if (!dbg[v]) dbg[v] = { count: 0, mins: 0 };
        dbg[v].count++;
        dbg[v].mins += m;
      });
      Object.entries(dbg).forEach(([v, d]) =>
        console.log(`  ${v}: ${d.count} samples, ${Math.round(d.mins)}min`),
      );

      // ── Sum stages — skip generic ASLEEP when stage-specific data exists ─────
      // Garmin writes both a generic ASLEEP and CORE/DEEP/REM for the same time,
      // so we only count the generic sample when no specific stages are present.
      const hasStages = session.some(s =>
        ['CORE', 'DEEP', 'REM', 'ASLEEP_CORE', 'ASLEEP_DEEP', 'ASLEEP_REM'].includes(s.value),
      );

      let asleepMin = 0, deepMin = 0, remMin = 0, inBedMin = 0;

      session.forEach((s: any) => {
        const mins = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
        switch (s.value) {
          case 'INBED':
            inBedMin += mins;
            break;
          case 'ASLEEP':
          case 'ASLEEP_UNSPECIFIED':
            // Only count if no finer-grained stages exist — avoids double-counting
            if (!hasStages) asleepMin += mins;
            break;
          case 'ASLEEP_CORE':
          case 'CORE':
            asleepMin += mins;
            break;
          case 'ASLEEP_DEEP':
          case 'DEEP':
            deepMin   += mins;
            asleepMin += mins;
            break;
          case 'ASLEEP_REM':
          case 'REM':
            remMin    += mins;
            asleepMin += mins;
            break;
          // 'AWAKE' / 'ASLEEP_AWAKE' during sleep intentionally ignored
        }
      });

      console.log(`[Readiness] Sleep parsed → total:${Math.round(asleepMin)}min deep:${Math.round(deepMin)}min rem:${Math.round(remMin)}min inBed:${Math.round(inBedMin)}min`);

      if (asleepMin === 0) return resolve(null);

      resolve({
        duration:   Math.round(asleepMin),
        deep:       Math.round(deepMin),
        rem:        Math.round(remMin),
        efficiency: inBedMin > 0
          ? Math.round((asleepMin / inBedMin) * 100)
          : 85,
      });
    });
  });
}
