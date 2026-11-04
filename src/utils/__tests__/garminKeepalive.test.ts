import { isRevokedTokenError } from '../../../supabase/functions/_shared/garmin';

const withStatus = (status: number) => Object.assign(new Error(`Garmin token endpoint ${status}`), { status });

describe('garmin keepalive: which refresh failures revoke (1.2.1)', () => {
  it('revokes on 400 and 401, the answers for a refresh token Garmin no longer accepts', () => {
    expect(isRevokedTokenError(withStatus(400))).toBe(true);
    expect(isRevokedTokenError(withStatus(401))).toBe(true);
  });

  it('leaves a Garmin outage for the next run', () => {
    expect(isRevokedTokenError(withStatus(500))).toBe(false);
    expect(isRevokedTokenError(withStatus(503))).toBe(false);
  });

  it('leaves a timeout or network error (a plain Error) and a non-Error value alone', () => {
    expect(isRevokedTokenError(new Error('fetch failed'))).toBe(false);
    expect(isRevokedTokenError('invalid_grant')).toBe(false);
    expect(isRevokedTokenError(null)).toBe(false);
  });
});
