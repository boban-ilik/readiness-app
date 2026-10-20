import { forecastTrackRecord, trackRecordLine } from '../forecastTrackRecord';
import type { ForecastLog } from '@services/forecastLog';

const d = (n: number) => `2026-10-${String(n).padStart(2, '0')}`;
const log: ForecastLog = {};
const actual: Record<string, number> = {};
// 10 days of day-ahead forecasts of 60 with range 55–65; actuals alternate in/out
for (let i = 1; i <= 10; i++) {
  log[d(i)] = { '1': { madeOn: d(i - 1), score: 60, low: 55, high: 65 }, '2': { madeOn: d(i - 2), score: 99, low: 90, high: 100 } };
  actual[d(i)] = i % 2 ? 62 : 70;
}

describe('forecast track record', () => {
  it('judges only the day-ahead forecast, before today', () => {
    const r = forecastTrackRecord(log, actual, 14, d(11))!;
    expect(r).toEqual({ compared: 10, inRange: 5, avgError: 6 });
  });

  it('respects the window and skips days without a score', () => {
    expect(forecastTrackRecord(log, actual, 5, d(11))!.compared).toBe(5);
    const { [d(3)]: _, ...fewer } = actual;
    expect(forecastTrackRecord(log, fewer, 14, d(11))!.compared).toBe(9);
  });

  it('says nothing under 5 comparisons', () => {
    expect(forecastTrackRecord(log, actual, 14, d(5))).toBeNull();
  });

  it('reads as one line', () => {
    expect(trackRecordLine({ compared: 10, inRange: 5, avgError: 6 }, 14))
      .toBe('Last 14 days: inside the likely range 5 of 10 times, off by 6 on average.');
  });
});
