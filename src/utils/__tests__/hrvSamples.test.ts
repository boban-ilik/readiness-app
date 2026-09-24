import { summariseTodayHRV, dailyOvernightHRV, toMs } from '@utils/hrvSamples';

// All times local. Tests run in whatever TZ the machine has; we only build
// dates through the Date(y, m, d, h) constructor, so the assertions hold in
// any zone.
function at(y: number, m: number, d: number, h: number, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

describe('toMs', () => {
  it('treats sub-1 values as seconds and larger values as milliseconds', () => {
    expect(toMs(0.058)).toBe(58);
    expect(toMs(58)).toBe(58);
  });
});

describe('summariseTodayHRV', () => {
  const now = new Date(2026, 8, 4, 9, 30); // 4 Sep 2026, 09:30

  it('averages overnight samples and ignores yesterday afternoon', () => {
    const r = summariseTodayHRV([
      { value: 0.040, startDate: at(2026, 9, 3, 15) },   // yesterday 3 pm: excluded
      { value: 0.060, startDate: at(2026, 9, 4, 2) },
      { value: 0.070, startDate: at(2026, 9, 4, 5) },
    ], now);
    expect(r).toEqual({ value: 65, count: 2, daytime: false });
  });

  it('counts a late-evening sample towards this morning', () => {
    const r = summariseTodayHRV([{ value: 0.050, startDate: at(2026, 9, 3, 23) }], now);
    expect(r?.value).toBe(50);
    expect(r?.daytime).toBe(false);
  });

  it('falls back to the newest daytime sample within 24 h and flags it', () => {
    const later = new Date(2026, 8, 4, 16);
    const r = summariseTodayHRV([
      { value: 0.045, startDate: at(2026, 9, 4, 13) },
      { value: 0.055, startDate: at(2026, 9, 4, 15) },
    ], later);
    expect(r).toEqual({ value: 55, count: 1, daytime: true });
  });

  it('returns null when the newest sample is older than a day', () => {
    const r = summariseTodayHRV([{ value: 0.065, startDate: at(2026, 8, 29, 3) }], now);
    expect(r).toBeNull();
  });

  it('never uses samples from the future', () => {
    const r = summariseTodayHRV([{ value: 0.065, startDate: at(2026, 9, 4, 11) }], now);
    expect(r).toBeNull();
  });
});

describe('dailyOvernightHRV', () => {
  it('keys the night by the morning it ends on and prefers overnight over daytime', () => {
    const byDay = dailyOvernightHRV([
      { value: 0.050, startDate: at(2026, 9, 2, 22) },   // night into 3 Sep
      { value: 0.070, startDate: at(2026, 9, 3, 4) },    // same night
      { value: 0.030, startDate: at(2026, 9, 3, 14) },   // daytime 3 Sep: ignored
      { value: 0.040, startDate: at(2026, 9, 4, 15) },   // only a daytime reading for 4 Sep
    ]);
    expect(byDay['2026-09-03']).toBe(60);
    expect(byDay['2026-09-04']).toBe(40);
  });
});
