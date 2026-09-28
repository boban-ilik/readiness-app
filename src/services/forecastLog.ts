/**
 * forecastLog
 *
 * Keeps what the 3-day forecast predicted, so a later version can show how
 * close it came against the scores actually recorded. Nothing reads it back
 * yet: 1.0.4 only starts collecting, because a track record needs weeks of
 * history before it says anything.
 *
 * Stored on the device. For each target date and lead time (1, 2 or 3 days
 * ahead) it keeps the last forecast made that day, which is the one the user
 * saw after the day's data had synced.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateStr } from '@utils/index';
import type { ReadinessForecast } from '@services/readinessForecast';

export const FORECAST_LOG_KEY = '@readiness/forecast_log_v1';
const KEEP_DAYS = 120;

export interface ForecastEntry {
  madeOn: string;            // YYYY-MM-DD the forecast was computed
  score:  number;
  low:    number;
  high:   number;
}

/** targetDate -> lead time in days ("1" | "2" | "3") -> entry */
export type ForecastLog = Record<string, Record<string, ForecastEntry>>;

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Pure: the log with today's forecast written in and old dates dropped. */
export function mergeForecast(log: ForecastLog, forecast: ReadinessForecast, madeOn: string): ForecastLog {
  const next: ForecastLog = {};
  const cutoff = addDays(madeOn, -KEEP_DAYS);
  for (const [date, byLead] of Object.entries(log)) if (date >= cutoff) next[date] = { ...byLead };

  forecast.forEach((day, i) => {
    const target = addDays(madeOn, i + 1);
    next[target] = {
      ...next[target],
      [String(i + 1)]: { madeOn, score: day.score, low: day.range[0], high: day.range[1] },
    };
  });
  return next;
}

export async function recordForecast(forecast: ReadinessForecast): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FORECAST_LOG_KEY);
    const log = raw ? (JSON.parse(raw) as ForecastLog) : {};
    await AsyncStorage.setItem(FORECAST_LOG_KEY, JSON.stringify(mergeForecast(log, forecast, localDateStr())));
  } catch {
    // Best effort: a missed day only thins the future track record.
  }
}
