/**
 * How the 3-day forecast has been doing: each day-ahead forecast (made the
 * evening before) against the score actually recorded. Only the 1-day lead is
 * judged; it is the one the user acts on, and the one the "likely range" is
 * calibrated for. Pure, so it can be tested against a fixed log.
 */

import type { ForecastLog } from '@services/forecastLog';

export interface TrackRecord {
  /** Days with both a 1-day forecast and a recorded score */
  compared: number;
  /** Of those, how many landed inside the forecast's likely range */
  inRange:  number;
  /** Mean absolute gap between forecast and actual, rounded */
  avgError: number;
}

/** Fewer comparisons than this say nothing worth showing. */
export const MIN_COMPARED = 5;

export function forecastTrackRecord(
  log: ForecastLog,
  actualByDate: Record<string, number>,
  lastDays: number,
  today: string,
): TrackRecord | null {
  const since = new Date(today + 'T12:00:00');
  since.setDate(since.getDate() - lastDays);
  const cutoff = since.toISOString().slice(0, 10);

  let compared = 0, inRange = 0, errorSum = 0;
  for (const [date, byLead] of Object.entries(log)) {
    if (date < cutoff || date >= today) continue;
    const f = byLead['1'];
    const actual = actualByDate[date];
    if (!f || actual == null || actual <= 0) continue;
    compared++;
    if (actual >= f.low && actual <= f.high) inRange++;
    errorSum += Math.abs(actual - f.score);
  }
  if (compared < MIN_COMPARED) return null;
  return { compared, inRange, avgError: Math.round(errorSum / compared) };
}

export function trackRecordLine(r: TrackRecord, lastDays: number): string {
  return `Last ${lastDays} days: inside the likely range ${r.inRange} of ${r.compared} times, off by ${r.avgError} on average.`;
}
