/**
 * garmin-callback: where Garmin sends the user after consent.
 *
 *   GET /functions/v1/garmin-callback?code=...&state=...
 *
 * Exchanges the code (with the stored verifier), fetches the Garmin user id
 * and permissions, stores the connection, then bounces the user back into
 * the app at readiness://garmin-callback?status=ok|error. No JWT: Garmin
 * calls this, so the state is the only thing tying it to a user.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { GARMIN, adminClient, exchangeCode, fetchGarminUserId, fetchPermissions, expiries } from '../_shared/garminApi.ts';

const back = (status: 'ok' | 'error', reason = '') =>
  new Response(null, { status: 302, headers: { Location: `${GARMIN.appReturnUrl}?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}` } });

serve(async (req: Request) => {
  const url   = new URL(req.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (url.searchParams.get('error')) return back('error', 'declined');
  if (!code || !state)                 return back('error', 'missing_code');

  const db = adminClient();
  try {
    // Sweep stale attempts, then claim this one.
    await db.from('garmin_oauth_states').delete().lt('created_at', new Date(Date.now() - 3_600_000).toISOString());
    const { data: attempt } = await db.from('garmin_oauth_states').select('user_id, code_verifier').eq('state', state).maybeSingle();
    if (!attempt) return back('error', 'unknown_state');
    await db.from('garmin_oauth_states').delete().eq('state', state);

    const tokens       = await exchangeCode(code, attempt.code_verifier);
    const garminUserId = await fetchGarminUserId(tokens.access_token);
    const permissions  = await fetchPermissions(tokens.access_token).catch(() => []);

    // A Garmin account can be linked to one Readiness account at a time.
    await db.from('garmin_connections').delete().eq('garmin_user_id', garminUserId).neq('user_id', attempt.user_id);

    const { error } = await db.from('garmin_connections').upsert({
      user_id:        attempt.user_id,
      garmin_user_id: garminUserId,
      access_token:   tokens.access_token,
      refresh_token:  tokens.refresh_token,
      permissions,
      status:         'active',
      connected_at:   new Date().toISOString(),
      ...expiries(tokens),
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);

    return back('ok');
  } catch (err) {
    console.error('[garmin-callback]', err instanceof Error ? err.message : err);
    return back('error', 'exchange_failed');
  }
});
