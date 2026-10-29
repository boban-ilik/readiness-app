jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('expo-store-review', () => ({}));
jest.mock('@services/analytics', () => ({ track: jest.fn() }));

import { addOpenDay, gapAllowsAsk, isGoodDayMoment, MIN_DEVICE_DAYS } from '../useRatingPrompt';

const DAY = 86_400_000;
const now = Date.parse('2026-10-15T08:00:00Z');

describe('good-day rating ask', () => {
  it('needs a score of 75+ and at least 3 days in', () => {
    expect(isGoodDayMoment(81, 3)).toBe(true);
    expect(isGoodDayMoment(74, 10)).toBe(false);
    expect(isGoodDayMoment(90, 2)).toBe(false);
  });
  it('treats accounts without a join date as long-standing', () => {
    expect(isGoodDayMoment(80, null)).toBe(true);
  });
});

describe('spacing between rating asks', () => {
  it('allows an ask when there has never been one', () => {
    expect(gapAllowsAsk([null], now)).toBe(true);
  });
  it('blocks a second ask within 14 days and allows it after', () => {
    expect(gapAllowsAsk([new Date(now - 5 * DAY).toISOString()], now)).toBe(false);
    expect(gapAllowsAsk([new Date(now - 14 * DAY).toISOString()], now)).toBe(true);
  });
});

describe('days the app was opened on this device', () => {
  it('counts each calendar day once', () => {
    expect(addOpenDay(['2026-10-28'], '2026-10-28')).toEqual(['2026-10-28']);
    expect(addOpenDay(['2026-10-28'], '2026-10-29')).toEqual(['2026-10-28', '2026-10-29']);
  });
  it('a first launch is below the threshold, the third day reaches it', () => {
    expect(addOpenDay([], '2026-10-28').length).toBeLessThan(MIN_DEVICE_DAYS);
    expect(addOpenDay(['2026-10-26', '2026-10-27'], '2026-10-28').length).toBe(MIN_DEVICE_DAYS);
  });
  it('keeps the list no longer than the threshold', () => {
    expect(addOpenDay(['a', 'b', 'c'], 'd')).toEqual(['b', 'c', 'd']);
  });
});
