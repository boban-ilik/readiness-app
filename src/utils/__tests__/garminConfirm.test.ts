import { decideGarminConfirm } from '../../../supabase/functions/_shared/garmin';

const now = Date.parse('2026-10-29T10:00:00Z');
const row = (over: Partial<{ user_id: string; status: string; confirm_expires_at: string | null }> = {}) => ({
  user_id: 'u1', status: 'pending', confirm_expires_at: '2026-10-29T10:09:00Z', ...over,
});

describe('garmin confirm decision (1.2.1)', () => {
  it('activates a pending row of the signed-in user inside the window', () => {
    expect(decideGarminConfirm({ row: row(), jwtUserId: 'u1', now })).toBe('activate');
  });

  it('rejects when there is no row for the nonce', () => {
    expect(decideGarminConfirm({ row: null, jwtUserId: 'u1', now })).toBe('reject');
  });

  it('rejects a row started from another account', () => {
    expect(decideGarminConfirm({ row: row({ user_id: 'attacker' }), jwtUserId: 'u1', now })).toBe('reject');
  });

  it('rejects a row that is no longer pending', () => {
    expect(decideGarminConfirm({ row: row({ status: 'active' }), jwtUserId: 'u1', now })).toBe('reject');
  });

  it('expires a row past its window or without an expiry', () => {
    expect(decideGarminConfirm({ row: row({ confirm_expires_at: '2026-10-29T09:59:00Z' }), jwtUserId: 'u1', now })).toBe('expired');
    expect(decideGarminConfirm({ row: row({ confirm_expires_at: null }), jwtUserId: 'u1', now })).toBe('expired');
  });
});
