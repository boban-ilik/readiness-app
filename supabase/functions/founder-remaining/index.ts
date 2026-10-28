/**
 * founder-remaining: Supabase Edge Function
 *
 * Returns how many Founder (lifetime) places are left out of the first 200.
 *
 * ── Deployment ───────────────────────────────────────────────────────────────
 *   supabase functions deploy founder-remaining --no-verify-jwt
 *
 * ── Request ──────────────────────────────────────────────────────────────────
 *   POST /functions/v1/founder-remaining
 *   Authorization: Bearer <user session access token>
 *
 * ── Response ─────────────────────────────────────────────────────────────────
 *   200 { "cap": 200, "sold": n, "remaining": max(0, 200 - n) }
 *   401 { "error": "Unauthorized" }
 *   500 { "error": "..." }
 *
 * ── Known limitation ─────────────────────────────────────────────────────────
 * "sold" is the number of distinct users with a client-reported
 * purchase_success event whose props.cycle is 'lifetime' in public.app_events.
 * Those events are written by the app itself, so the count can undercount
 * (an event lost to a network failure or an app kill) or be inflated by a
 * tampered client inserting fake events for its own user. This is a display
 * counter only. The real cap is removing the product from sale in App Store
 * Connect once 200 have sold.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/entitlement.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CAP = 200;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const user = await authenticateUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // supabase-js has no COUNT(DISTINCT), so fetch the user ids and dedupe.
    // 1000 rows is far above the 200 cap even with duplicate events.
    const { data, error } = await admin
      .from('app_events')
      .select('user_id')
      .eq('event', 'purchase_success')
      .eq('props->>cycle', 'lifetime')
      .limit(1000);

    if (error) {
      console.warn('[founder-remaining] query failed:', error.message);
      return json({ error: 'Could not read the founder count' }, 500);
    }

    const sold = new Set((data ?? []).map((r: { user_id: string }) => r.user_id)).size;
    return json({ cap: CAP, sold, remaining: Math.max(0, CAP - sold) }, 200);
  } catch (e) {
    console.warn('[founder-remaining] failed:', (e as Error)?.message ?? e);
    return json({ error: 'Internal error' }, 500);
  }
});
