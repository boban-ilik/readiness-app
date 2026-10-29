/**
 * garmin-callback: where Garmin sends the user after consent.
 *
 *   GET /functions/v1/garmin-callback?code=...&state=...
 *
 * Exchanges the code (with the stored verifier), fetches the Garmin user id
 * and permissions, stores the connection as 'pending' with a one-time nonce,
 * then bounces the user back into the app at
 * readiness://garmin-callback?status=ok&nonce=...|status=error. No JWT:
 * Garmin calls this, so the state is the only thing tying it to a user, and
 * the app must confirm the nonce (garmin-confirm) from the same account
 * before the connection becomes active.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { GARMIN, adminClient, exchangeCode, fetchGarminUserId, fetchPermissions, expiries, randomToken } from '../_shared/garminApi.ts';

const CONFIRM_WINDOW_MS = 10 * 60_000;

const back = (status: 'ok' | 'error', extra: Record<string, string> = {}) => {
  const params = new URLSearchParams({ status, ...extra });
  return new Response(null, { status: 302, headers: { Location: `${GARMIN.appReturnUrl}?${params.toString()}` } });
};

serve(async (req: Request) => {
  const url   = new URL(req.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (url.searchParams.get('error')) return back('error', { reason: 'declined' });
  if (!code || !state)                 return back('error', { reason: 'missing_code' });

  const db = adminClient();
  try {
    // Sweep stale attempts, then claim this one.
    await db.from('garmin_oauth_states').delete().lt('created_at', new Date(Date.now() - 3_600_000).toISOString());
    await db.from('garmin_connections').delete().eq('status', 'pending').lt('confirm_expires_at', new Date().toISOString());
    const { data: attempt } = await db.from('garmin_oauth_states').select('user_id, code_verifier').eq('state', state).maybeSingle();
    if (!attempt) return back('error', { reason: 'unknown_state' });
    await db.from('garmin_oauth_states').delete().eq('state', state);

    const tokens       = await exchangeCode(code, attempt.code_verifier);
    const garminUserId = await fetchGarminUserId(tokens.access_token);
    const permissions  = await fetchPermissions(tokens.access_token).catch(() => []);

    // Pending until garmin-confirm proves the app is signed in as this user.
    // Unlinking the same Garmin account from another Readiness account also
    // waits for that step, so an unconfirmed attempt cannot unlink anyone.
    const nonce = randomToken(24);
    const { error } = await db.from('garmin_connections').upsert({
      user_id:            attempt.user_id,
      garmin_user_id:     garminUserId,
      access_token:       tokens.access_token,
      refresh_token:      tokens.refresh_token,
      permissions,
      status:             'pending',
      confirm_nonce:      nonce,
      confirm_expires_at: new Date(Date.now() + CONFIRM_WINDOW_MS).toISOString(),
      connected_at:       new Date().toISOString(),
      ...expiries(tokens),
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);

    return back('ok', { nonce });
  } catch (err) {
    console.error('[garmin-callback]', err instanceof Error ? err.message : err);
    return back('error', { reason: 'exchange_failed' });
  }
});
