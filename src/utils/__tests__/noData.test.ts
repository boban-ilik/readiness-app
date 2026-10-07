import { noDataReason } from '../noData';

describe('noDataReason', () => {
  const none = { hrvSamples: 0, rhrDays: 0, sleepDays: 0, stepsToday: null };

  it('any watch data in the last 30 days means a missed night', () => {
    expect(noDataReason({ ...none, rhrDays: 3 })).toBe('missed_night');
    expect(noDataReason({ ...none, sleepDays: 1, stepsToday: 0 })).toBe('missed_night');
    expect(noDataReason({ ...none, hrvSamples: 12, stepsToday: 4000 })).toBe('missed_night');
  });

  it('steps but no watch data means no wearable is writing to Health', () => {
    expect(noDataReason({ ...none, stepsToday: 850 })).toBe('no_wearable');
  });

  it('nothing at all points to Health access', () => {
    expect(noDataReason(none)).toBe('no_health_access');
    expect(noDataReason({ ...none, stepsToday: 0 })).toBe('no_health_access');
  });
});
