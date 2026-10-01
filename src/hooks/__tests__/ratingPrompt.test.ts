jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('expo-store-review', () => ({}));
jest.mock('@services/analytics', () => ({ track: jest.fn() }));

import { gapAllowsAsk, isGoodDayMoment } from '../useRatingPrompt';

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
