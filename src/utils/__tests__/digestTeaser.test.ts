import { digestTeaser } from '../digestTeaser';
import type { ForecastLog } from '@services/forecastLog';

const log: ForecastLog = {
  '2026-10-22': { '1': { madeOn: '2026-10-21', score: 68, low: 62, high: 74 } },
};
const now = new Date('2026-10-21T20:00:00');

describe('digest teaser', () => {
  it("names tomorrow's forecast in the first week", () => {
    expect(digestTeaser('2026-10-19T09:00:00', log, now)).toEqual({ title: 'We forecast 68 for today', body: 'See how it held up →' });
  });

  it('only for days 1 to 6', () => {
    expect(digestTeaser('2026-10-22T09:00:00', log, now)).toBeNull();  // tomorrow is the join day
    expect(digestTeaser('2026-10-15T09:00:00', log, now)).toBeNull();  // tomorrow is day 7
    expect(digestTeaser('2026-10-16T09:00:00', log, now)).not.toBeNull(); // day 6
  });

  it('needs a forecast made today', () => {
    const stale: ForecastLog = { '2026-10-22': { '1': { madeOn: '2026-10-20', score: 68, low: 62, high: 74 } } };
    expect(digestTeaser('2026-10-19T09:00:00', stale, now)).toBeNull();
    expect(digestTeaser('2026-10-19T09:00:00', {}, now)).toBeNull();
    expect(digestTeaser(null, log, now)).toBeNull();
  });
});
