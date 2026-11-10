import { TRIAL_DAYS, TRIAL_MS, isInTrial } from '../../../supabase/functions/_shared/trial';

describe('trial window (server entitlement)', () => {
  it('is seven days, and the client SubscriptionContext.TRIAL_DAYS must match', () => {
    // SubscriptionContext.tsx defines TRIAL_DAYS = 7 separately. If either
    // changes without the other, the server gate and the app disagree.
    expect(TRIAL_DAYS).toBe(7);
    expect(TRIAL_MS).toBe(7 * 86_400_000);
  });

  it('is active inside the window and expired at its end', () => {
    const created = Date.parse('2026-10-01T00:00:00Z');
    expect(isInTrial(created, created + TRIAL_MS - 1)).toBe(true);
    expect(isInTrial(created, created + TRIAL_MS)).toBe(false);
    expect(isInTrial(created, created + TRIAL_MS + 1)).toBe(false);
  });

  it('treats a missing or invalid created_at as not in trial', () => {
    expect(isInTrial(NaN, Date.now())).toBe(false);
  });

  it('mirrors the old inline check for every boundary', () => {
    // The gate used to inline this: !isNaN(created) && now < created + TRIAL_MS.
    const created = Date.parse('2026-10-01T00:00:00Z');
    for (const now of [created, created + 1, created + TRIAL_MS - 1, created + TRIAL_MS]) {
      expect(isInTrial(created, now)).toBe(!Number.isNaN(created) && now < created + TRIAL_MS);
    }
  });
});
