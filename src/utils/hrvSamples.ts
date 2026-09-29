/**
 * HRV sample selection
 *
 * Apple Watch writes several SDNN samples a day: a handful overnight, and
 * ultra-short daytime readings whenever the wearer is still. The score's
 * copy promises "your overnight HRV", so only the overnight readings may
 * feed it. Picking "the newest sample" gave a 3 pm daytime reading in the
 * afternoon and a six-day-old value when the watch had not synced, both
 * scored with full confidence.
 *
 * Pure functions so they can be unit-tested without HealthKit.
 */

export interface HRVSample {
  /** SDNN. react-native-health returns seconds; some wrappers return ms. */
  value:      number;
  startDate:  string;
  endDate?:   string;
}

/** Overnight window edges, local time. */
export const OVERNIGHT_START_HOUR = 20; // 8 pm the evening before
export const OVERNIGHT_END_HOUR   = 12; // noon

/** Normalise to milliseconds: raw seconds → ×1000, already-ms → keep. */
export function toMs(value: number): number {
  return value > 1 ? Math.round(value) : Math.round(value * 1000);
}

function sampleTime(s: HRVSample): Date {
  return new Date(s.startDate ?? s.endDate ?? 0);
}

function localDate(d: Date): string {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/**
 * The calendar day a sample "belongs to" for overnight purposes: readings
 * taken at or after 8 pm count towards the following morning.
 */
export function overnightDayKey(when: Date): string {
  const d = new Date(when);
  if (d.getHours() >= OVERNIGHT_START_HOUR) d.setDate(d.getDate() + 1);
  return localDate(d);
}

function isOvernightHour(when: Date): boolean {
  const h = when.getHours();
  return h >= OVERNIGHT_START_HOUR || h < OVERNIGHT_END_HOUR;
}

export interface TodayHRV {
  /** Mean of the overnight samples, or the fallback value. */
  value:  number;
  /** How many samples went into the mean. */
  count:  number;
  /** True when no overnight sample existed and a daytime one was used. */
  daytime: boolean;
}

/**
 * Today's HRV.
 *
 * 1. Mean of samples in the window [yesterday 20:00, today 12:00] local.
 * 2. Otherwise the newest sample taken today since local midnight (a
 *    daytime reading: usable, flagged).
 * 3. Otherwise null. Yesterday's afternoon reading is not "today's HRV";
 *    the UI shows the missing-HRV banner and offers manual entry instead.
 */
export interface SleepWindow { start: string | Date; end: string | Date }

function inWindow(t: Date, w: SleepWindow): boolean {
  return t >= new Date(w.start) && t <= new Date(w.end);
}

export function summariseTodayHRV(
  samples: HRVSample[],
  now: Date = new Date(),
  sleep: SleepWindow | null = null,
): TodayHRV | null {
  if (!samples?.length) return null;

  // When last night's sleep is known, only readings taken while asleep count.
  // Apple Watch also writes an HRV sample during every Breathe session (and
  // other still, awake moments); those raise the number by the act of slow
  // breathing and are not overnight recovery. Without sleep data, fall back
  // to the fixed evening-to-noon window below.
  if (sleep) {
    const asleep = samples.filter(s => { const t = sampleTime(s); return inWindow(t, sleep) && t <= now; });
    if (asleep.length > 0) {
      const mean = asleep.reduce((sum, s) => sum + toMs(s.value), 0) / asleep.length;
      return { value: Math.round(mean), count: asleep.length, daytime: false };
    }
  }

  const windowEnd = new Date(now);
  windowEnd.setHours(OVERNIGHT_END_HOUR, 0, 0, 0);
  // Before noon the window is still "this morning"; after noon it is too,
  // just closed. Either way it ends at today's noon.
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - 1);
  windowStart.setHours(OVERNIGHT_START_HOUR, 0, 0, 0);

  const overnight = samples.filter(s => {
    const t = sampleTime(s);
    return t >= windowStart && t <= windowEnd && t <= now;
  });
  if (overnight.length > 0) {
    const mean = overnight.reduce((sum, s) => sum + toMs(s.value), 0) / overnight.length;
    return { value: Math.round(mean), count: overnight.length, daytime: false };
  }

  // Today only. A rolling 24 h let yesterday afternoon's reading stand in for
  // this morning's, so a user without an overnight reading saw yesterday's
  // number and was never asked for today's.
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const recent = samples
    .filter(s => { const t = sampleTime(s); return t >= midnight && t <= now; })
    .sort((a, b) => sampleTime(b).getTime() - sampleTime(a).getTime());
  if (recent.length > 0) {
    return { value: toMs(recent[0].value), count: 1, daytime: true };
  }

  return null;
}

/**
 * One HRV value per local day, keyed "YYYY-MM-DD": the mean of that day's
 * overnight samples (evening-before through noon). Days with only daytime
 * readings fall back to the mean of those, so a watch that never samples at
 * night still gets a baseline.
 */
export function dailyOvernightHRV(
  samples: HRVSample[],
  sleepByDay: Record<string, SleepWindow> = {},
): Record<string, number> {
  const overnight: Record<string, number[]> = {};
  const daytime:   Record<string, number[]> = {};
  const inSleep:   Record<string, number[]> = {};

  for (const s of samples) {
    const t = sampleTime(s);
    if (isNaN(t.getTime())) continue;
    const ms = toMs(s.value);
    // A sample inside a known sleep session belongs to that night; samples
    // outside it (a morning Breathe session, say) never count as overnight
    // for a day whose sleep is known.
    const nightKey = overnightDayKey(t);
    const w = sleepByDay[nightKey];
    if (w && inWindow(t, w)) (inSleep[nightKey] ??= []).push(ms);
    if (isOvernightHour(t)) {
      (overnight[overnightDayKey(t)] ??= []).push(ms);
    } else {
      (daytime[localDate(t)] ??= []).push(ms);
    }
  }

  const out: Record<string, number> = {};
  const keys = new Set([...Object.keys(inSleep), ...Object.keys(overnight), ...Object.keys(daytime)]);
  for (const k of keys) {
    const vals = inSleep[k]?.length ? inSleep[k] : overnight[k]?.length ? overnight[k] : daytime[k];
    if (!vals?.length) continue;
    out[k] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return out;
}
