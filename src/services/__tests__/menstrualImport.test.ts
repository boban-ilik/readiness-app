jest.mock('react-native-health', () => ({}));

import { derivePeriodStarts, type MenstrualFlowSample } from '@services/menstrualImport';

// All times local. Dates are built through the Date(y, m, d, h) constructor,
// so the assertions hold in any time zone.
function at(y: number, m: number, d: number, h = 0, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

/** A whole-day sample the way Health stores logged flow: midnight to next midnight. */
function day(
  y: number,
  m: number,
  d: number,
  value: MenstrualFlowSample['value'] = 'medium',
  isCycleStart = false,
): MenstrualFlowSample {
  return { startDate: at(y, m, d), endDate: at(y, m, d + 1), value, isCycleStart };
}

describe('derivePeriodStarts', () => {
  it('uses the cycle-start metadata even when the gap is short', () => {
    const samples = [
      day(2026, 6, 1, 'light'), // spotting
      day(2026, 6, 5, 'heavy', true),
      day(2026, 6, 6, 'heavy'),
    ];
    // 1 Jun is a gap-based start (first flow day, no window given);
    // 5 Jun is only 4 days later but is flagged.
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01', '2026-06-05']);
  });

  it('derives starts from gaps of at least 10 days without metadata', () => {
    const samples = [
      day(2026, 6, 1), day(2026, 6, 2), day(2026, 6, 3),
      // 10 empty days: 4..13 Jun, flow again on 14 Jun -> new start
      day(2026, 6, 14), day(2026, 6, 15),
      // 9 empty days: 16..24 Jun, flow on 25 Jun -> same period
      day(2026, 6, 25),
    ];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01', '2026-06-14']);
  });

  it('respects windowStart for the earliest flow day', () => {
    const tail = [day(2026, 6, 3), day(2026, 6, 4)];
    // Only 2 days after the window opened: could be the tail of an earlier period.
    expect(derivePeriodStarts(tail, { windowStart: new Date(2026, 5, 1) })).toEqual([]);
    // 10 empty days (1..10 Jun) before flow on 11 Jun: a start.
    expect(derivePeriodStarts([day(2026, 6, 11)], { windowStart: new Date(2026, 5, 1) }))
      .toEqual(['2026-06-11']);
    // Only 9 empty days (1..9 Jun): not enough.
    expect(derivePeriodStarts([day(2026, 6, 10)], { windowStart: new Date(2026, 5, 1) })).toEqual([]);
  });

  it('ignores samples with value "none", including their metadata', () => {
    const samples = [
      day(2026, 6, 1, 'none', true),
      day(2026, 6, 2, 'none'),
      day(2026, 6, 20, 'unspecified'),
    ];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-20']);
    expect(derivePeriodStarts([day(2026, 7, 1, 'none', true)])).toEqual([]);
  });

  it('dedupes two samples on the same day', () => {
    const samples: MenstrualFlowSample[] = [
      { startDate: at(2026, 6, 1, 8), endDate: at(2026, 6, 1, 9), value: 'light', isCycleStart: true },
      { startDate: at(2026, 6, 1, 18), endDate: at(2026, 6, 1, 19), value: 'heavy', isCycleStart: true },
    ];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01']);
  });

  it('treats a flow run crossing midnight as one period starting on the first day', () => {
    const samples: MenstrualFlowSample[] = [
      { startDate: at(2026, 6, 1, 22), endDate: at(2026, 6, 2, 3), value: 'medium', isCycleStart: false },
      { startDate: at(2026, 6, 2, 21), endDate: at(2026, 6, 3, 2), value: 'medium', isCycleStart: false },
    ];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01']);
  });

  it('does not count a midnight end as flow on the next day', () => {
    // 1 Jun ends exactly at midnight; the next flow is 12 Jun, 10 empty days (2..11).
    const samples = [day(2026, 6, 1), day(2026, 6, 12)];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01', '2026-06-12']);
  });

  it('returns sorted output regardless of input order', () => {
    const samples = [day(2026, 8, 1), day(2026, 6, 1), day(2026, 7, 1)];
    expect(derivePeriodStarts(samples)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
  });
});
