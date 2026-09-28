jest.mock('@react-native-async-storage/async-storage', () => ({}));

import { mergeForecast, type ForecastLog } from '../forecastLog';
import type { DayForecast, ReadinessForecast } from '../readinessForecast';

const day = (score: number): DayForecast => ({
  label: '', dateLabel: '', dateLabelLong: '', score, range: [score - 5, score + 5],
  trend: 'flat', confidence: 'high', keyFactor: '',
});
const fc = (a: number, b: number, c: number) => [day(a), day(b), day(c)] as ReadinessForecast;

describe('mergeForecast', () => {
  it('files each day under its target date and lead time', () => {
    const log = mergeForecast({}, fc(70, 65, 60), '2026-09-30');
    expect(log['2026-10-01']['1']).toEqual({ madeOn: '2026-09-30', score: 70, low: 65, high: 75 });
    expect(log['2026-10-02']['2'].score).toBe(65);
    expect(log['2026-10-03']['3'].score).toBe(60);
  });

  it('keeps yesterday\'s longer-range call next to today\'s 1-day call', () => {
    const first = mergeForecast({}, fc(70, 65, 60), '2026-09-30');
    const second = mergeForecast(first, fc(62, 58, 55), '2026-10-01');
    expect(second['2026-10-02']).toMatchObject({ '1': { score: 62 }, '2': { score: 65 } });
  });

  it('lets a later forecast the same day replace an earlier one', () => {
    const early = mergeForecast({}, fc(50, 50, 50), '2026-09-30');
    const late  = mergeForecast(early, fc(72, 70, 68), '2026-09-30');
    expect(late['2026-10-01']['1'].score).toBe(72);
  });

  it('drops dates older than 120 days', () => {
    const old: ForecastLog = { '2026-01-01': { '1': { madeOn: '2025-12-31', score: 60, low: 55, high: 65 } } };
    expect(mergeForecast(old, fc(70, 65, 60), '2026-09-30')['2026-01-01']).toBeUndefined();
  });
});
