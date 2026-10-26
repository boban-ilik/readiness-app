/**
 * garmin-keepalive: refresh Garmin tokens before they lapse.
 *
 *   POST /functions/v1/garmin-keepalive   x-cron-secret: <GARMIN_CRON_SECRET>
 *
 * Run by pg_cron every six hours. Access tokens last a day, refresh tokens
 * three months and they rotate on every refresh, so refreshing whenever the
 * access token is near expiry keeps a connection alive indefinitely. A
 * connection whose refresh fails is marked revoked, never silently dropped.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { json, env, adminClient, refreshTokens, expiries } from '../_shared/garminApi.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (req.headers.get('x-cron-secret') !== env('GARMIN_CRON_SECRET')) return json({ error: 'Forbidden' }, 403);

  const db  = adminClient();
  const due = new Date(Date.now() + 12 * 3_600_000).toISOString();
  const { data: conns, error } = await db
    .from('garmin_connections')
    .select('user_id, refresh_token')
    .eq('status', 'active')
    .lt('access_expires_at', due)
    .limit(500);
  if (error) return json({ error: error.message }, 500);

  let refreshed = 0, failed = 0;
  for (const c of conns ?? []) {
    try {
      const t = await refreshTokens(c.refresh_token);
      await db.from('garmin_connections').update({ access_token: t.access_token, refresh_token: t.refresh_token, ...expiries(t) }).eq('user_id', c.user_id);
      refreshed++;
    } catch (e) {
      failed++;
      console.warn('[garmin-keepalive] refresh failed for', c.user_id, e instanceof Error ? e.message : e);
      await db.from('garmin_connections').update({ status: 'revoked' }).eq('user_id', c.user_id);
    }
  }
  return json({ ok: true, refreshed, failed });
});
