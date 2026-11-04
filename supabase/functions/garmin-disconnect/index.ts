/**
 * garmin-disconnect: the in-app "Disconnect Garmin".
 *
 *   POST /functions/v1/garmin-disconnect   Authorization: Bearer <user jwt>
 *
 * Tells Garmin (DELETE /user/registration, required by the programme when an
 * app offers its own disconnect), then deletes every stored Garmin row and
 * the connection. Garmin's own revocation arrives separately as a
 * deregistration push and does the same.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { CORS, json, adminClient, userFromRequest, deleteRegistration, deleteGarminData } from '../_shared/garminApi.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  const user = await userFromRequest(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const db = adminClient();
  try {
    const { data: conn } = await db.from('garmin_connections').select('access_token').eq('user_id', user.id).maybeSingle();
    if (conn) {
      // Best effort: if Garmin is unreachable the local data still goes.
      await deleteRegistration(conn.access_token).catch(e => console.warn('[garmin-disconnect] Garmin side:', e.message));
    }
    await deleteGarminData(db, user.id);
    return json({ ok: true });
  } catch (err) {
    console.error('[garmin-disconnect]', err instanceof Error ? err.message : err);
    return json({ error: 'Disconnect failed' }, 500);
  }
});
