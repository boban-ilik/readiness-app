import { buildCalendarGrid, shortDate, type CalendarCell } from '../historyCalendar';
import type { DayHistory } from '@hooks/useHistoryData';

function day(date: string, score: number | null = 70): DayHistory {
  return {
    date,
    dayLabel: 'Mon',
    score,
    components: null,
    rhr: null,
    hrv: null,
    sleepMinutes: null,
    sleepEfficiency: null,
  };
}

function cells(rows: (CalendarCell | null)[][]): CalendarCell[] {
  return rows.flat().filter((c): c is CalendarCell => c !== null);
}

describe('buildCalendarGrid', () => {
  it('lays out a month in Monday-aligned weeks of seven', () => {
    const rows = buildCalendarGrid([], 2026, 2, '2026-03-15'); // March 2026
    expect(rows.every(r => r.length === 7)).toBe(true);
    expect(cells(rows).map(c => c.dayNum)).toEqual(
      Array.from({ length: 31 }, (_, i) => i + 1),
    );
  });

  it('flags today and joins stored history by date', () => {
    const rows = buildCalendarGrid([day('2026-03-10', 63)], 2026, 2, '2026-03-10');
    const today = cells(rows).find(c => c.date === '2026-03-10');
    expect(today?.isToday).toBe(true);
    expect(today?.history?.score).toBe(63);
  });

  it('leaves days without a stored score empty', () => {
    const rows = buildCalendarGrid([day('2026-03-10', 63)], 2026, 2, '2026-03-15');
    const other = cells(rows).find(c => c.date === '2026-03-11');
    expect(other?.history).toBeNull();
    expect(other?.isToday).toBe(false);
  });
});

describe('shortDate', () => {
  it('formats a YYYY-MM-DD as a short date', () => {
    expect(shortDate('2026-03-09')).toBe('Mar 9');
  });
});
