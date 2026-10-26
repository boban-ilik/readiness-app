/**
 * garmin-authorize: start the Garmin OAuth2 PKCE flow for the signed-in user.
 *
 *   POST /functions/v1/garmin-authorize   Authorization: Bearer <user jwt>
 *   200 { url }   the Garmin consent page the app opens in the browser
 *
 * The code verifier never reaches the device: it is kept server-side against
 * a random state, and garmin-callback uses it for the exchange.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { GARMIN, CORS, json, env, adminClient, userFromRequest, randomToken, codeChallenge } from '../_shared/garminApi.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  const user = await userFromRequest(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  try {
    const state    = randomToken(24);
    const verifier = randomToken(48);
    const db       = adminClient();

    // One attempt at a time per user; stale states older than an hour are
    // swept by the callback.
    await db.from('garmin_oauth_states').delete().eq('user_id', user.id);
    const { error } = await db.from('garmin_oauth_states').insert({ state, user_id: user.id, code_verifier: verifier });
    if (error) throw new Error(error.message);

    const params = new URLSearchParams({
      response_type:         'code',
      client_id:             env('GARMIN_CONSUMER_KEY'),
      code_challenge:        await codeChallenge(verifier),
      code_challenge_method: 'S256',
      redirect_uri:          GARMIN.redirectUri,
      state,
    });
    return json({ url: `${GARMIN.authorizeUrl}?${params.toString()}` });
  } catch (err) {
    console.error('[garmin-authorize]', err instanceof Error ? err.message : err);
    return json({ error: 'Could not start the Garmin connection' }, 500);
  }
});
