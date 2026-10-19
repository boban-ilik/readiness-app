import { trialEndingWhen, trialPillText } from '../trialEnding';

const at = (s: string) => new Date(s);

describe('trial ending', () => {
  const now = at('2026-10-25T09:00:00');

  it('warns the day before and on the day', () => {
    expect(trialEndingWhen(at('2026-10-26T10:42:00').getTime(), now)).toBe('tomorrow');
    expect(trialEndingWhen(at('2026-10-25T21:00:00').getTime(), now)).toBe('today');
  });

  it('stays quiet earlier, after the end, and off the trial', () => {
    expect(trialEndingWhen(at('2026-10-27T08:00:00').getTime(), now)).toBeNull();
    expect(trialEndingWhen(at('2026-10-25T08:00:00').getTime(), now)).toBeNull();
    expect(trialEndingWhen(null, now)).toBeNull();
  });

  it('counts days in the pill', () => {
    expect(trialPillText(5)).toBe('Pro · 5 days left');
    expect(trialPillText(1)).toBe('Pro · 1 day left');
  });
});
