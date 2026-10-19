/**
 * Week-1 morning teaser: tomorrow's notification names the forecast the app
 * made today for tomorrow ("We forecast 68 for today"), which is the one
 * thing about tomorrow morning that is known tonight.
 */

import type { ForecastLog } from '@services/forecastLog';
import { localDateStr } from './index';

/** Tomorrow is day 1 to 6 after joining (day 0 = the join day). */
const LAST_TEASER_DAY = 6;

function dayIndex(joinedAt: string, date: Date): number {
  const j = new Date(joinedAt);
  const a = Date.UTC(j.getFullYear(), j.getMonth(), j.getDate());
  const b = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b - a) / 86_400_000);
}

export function digestTeaser(
  joinedAt: string | null,
  log: ForecastLog | null,
  now: Date = new Date(),
): { title: string; body: string } | null {
  if (!joinedAt || !log) return null;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = dayIndex(joinedAt, tomorrow);
  if (!Number.isFinite(day) || day < 1 || day > LAST_TEASER_DAY) return null;

  // Made today, one day ahead: the forecast the user saw for tomorrow
  const e = log[localDateStr(tomorrow)]?.['1'];
  if (!e || e.madeOn !== localDateStr(now)) return null;
  return { title: `We forecast ${Math.round(e.score)} for today`, body: 'See how it held up →' };
}
