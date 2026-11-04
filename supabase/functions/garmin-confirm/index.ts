/**
 * garmin-confirm: the app proves it is the account that started the flow.
 *
 *   POST /functions/v1/garmin-confirm   Authorization: Bearer <user jwt>
 *   body { nonce }   the nonce garmin-callback bounced back with
 *   200 { ok: true } | 403 { error: 'not_yours' }
 *
 * garmin-callback has no user session, so it leaves the connection 'pending'
 * with a short-lived nonce. Only a confirm from the same user activates it;
 * anything else (unknown, expired, another account) deletes the pending row.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { CORS, json, adminClient, userFromRequest } from '../_shared/garminApi.ts';
import { decideGarminConfirm } from '../_shared/garmin.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  const user = await userFromRequest(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body  = await req.json().catch(() => null) as { nonce?: unknown } | null;
  const nonce = typeof body?.nonce === 'string' ? body.nonce : '';
  if (!nonce) return json({ error: 'missing_nonce' }, 400);

  const db = adminClient();
  try {
    const { data: row, error } = await db
      .from('garmin_connections')
      .select('user_id, garmin_user_id, status, confirm_expires_at')
      .eq('confirm_nonce', nonce)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const decision = decideGarminConfirm({ row, jwtUserId: user.id });
    if (decision !== 'activate' || !row) {
      if (row) await db.from('garmin_connections').delete().eq('confirm_nonce', nonce).eq('status', 'pending');
      console.warn(`[garmin-confirm] ${decision} for`, user.id);
      return json({ error: 'not_yours' }, 403);
    }

    // A Garmin account can be linked to one Readiness account at a time.
    await db.from('garmin_connections').delete().eq('garmin_user_id', row.garmin_user_id).neq('user_id', user.id);

    const { error: upErr } = await db
      .from('garmin_connections')
      .update({ status: 'active', confirm_nonce: null, confirm_expires_at: null })
      .eq('user_id', user.id)
      .eq('confirm_nonce', nonce);
    if (upErr) throw new Error(upErr.message);

    return json({ ok: true });
  } catch (err) {
    console.error('[garmin-confirm]', err instanceof Error ? err.message : err);
    return json({ error: 'Could not confirm the Garmin connection' }, 500);
  }
});
