/**
 * garmin-keepalive: refresh Garmin tokens before they lapse.
 *
 *   POST /functions/v1/garmin-keepalive   x-cron-secret: <GARMIN_CRON_SECRET>
 *
 * Run by pg_cron every six hours. Access tokens last a day, refresh tokens
 * three months and they rotate on every refresh, so refreshing whenever the
 * access token is near expiry keeps a connection alive indefinitely. A
 * connection Garmin refuses to refresh (400 or 401) is marked revoked, never
 * silently dropped. A timeout, a network error or a Garmin 5xx is transient:
 * the row is left as it is and the next run tries again.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { json, secretMatches, adminClient, refreshTokens, expiries } from '../_shared/garminApi.ts';
import { isRevokedTokenError } from '../_shared/garmin.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!secretMatches('GARMIN_CRON_SECRET', req.headers.get('x-cron-secret'))) return json({ error: 'Forbidden' }, 403);

  const db  = adminClient();
  const due = new Date(Date.now() + 12 * 3_600_000).toISOString();
  const { data: conns, error } = await db
    .from('garmin_connections')
    .select('user_id, refresh_token')
    .eq('status', 'active')
    .lt('access_expires_at', due)
    .limit(500);
  if (error) return json({ error: error.message }, 500);

  let refreshed = 0, failed = 0, transient = 0;
  for (const c of conns ?? []) {
    try {
      const t = await refreshTokens(c.refresh_token);
      const { error: writeErr } = await db.from('garmin_connections').update({ access_token: t.access_token, refresh_token: t.refresh_token, ...expiries(t) }).eq('user_id', c.user_id);
      if (writeErr) {
        // Garmin has already rotated the refresh token and we failed to keep
        // the new one. The status stays as it is: the next run gets an
        // invalid-grant answer for the old token and revokes properly.
        transient++;
        console.error('[garmin-keepalive] TOKEN WRITE FAILED for', c.user_id, writeErr.message);
        continue;
      }
      refreshed++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (isRevokedTokenError(e)) {
        failed++;
        console.warn('[garmin-keepalive] refresh refused for', c.user_id, message);
        await db.from('garmin_connections').update({ status: 'revoked' }).eq('user_id', c.user_id);
      } else {
        transient++;
        console.warn('[garmin-keepalive] refresh failed for', c.user_id, '(left for the next run)', message);
      }
    }
  }
  return json({ ok: true, refreshed, failed, transient });
});
