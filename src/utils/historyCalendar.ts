/**
 * historyCalendar — the pure date/grid helpers behind the History screen.
 *
 * Kept out of the 1,600-line screen so the calendar layout is unit-testable.
 */

import { localDateStr } from '@utils/index';
import type { DayHistory } from '@/types/index';

export interface CalendarCell {
  date:      string;       // YYYY-MM-DD
  dayNum:    number;       // 1–31
  isToday:   boolean;
  history:   DayHistory | null;
}

/** Builds a Monday-aligned calendar grid for the given month. Null = padding cell. */
export function buildCalendarGrid(
  history:  DayHistory[],
  year:     number,
  month:    number,  // 0–11
  todayStr: string,
): (CalendarCell | null)[][] {
  const histMap      = new Map(history.map(d => [d.date, d]));
  const firstDay     = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  // Monday = 0, Sunday = 6 offset
  const startPad     = (firstDay.getDay() + 6) % 7;

  const cells: (CalendarCell | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = localDateStr(new Date(year, month, d));
    cells.push({
      date:    dateStr,
      dayNum:  d,
      isToday: dateStr === todayStr,
      history: histMap.get(dateStr) ?? null,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** "Mar 9" — short date for rows and chart labels. */
export function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}
