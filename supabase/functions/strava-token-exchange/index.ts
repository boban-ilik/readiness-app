/**
 * strava-token-exchange — Supabase Edge Function
 *
 * Server-side proxy for Strava OAuth token operations so the client secret
 * never ships inside the mobile app binary.
 *
 * Supports two grant types:
 *   1. authorization_code  — initial OAuth code → token exchange
 *   2. refresh_token       — refresh an expired access token
 *
 * ── Secrets (set once via Supabase dashboard or CLI) ─────────────────────────
 *   supabase secrets set STRAVA_CLIENT_ID=211386
 *   supabase secrets set STRAVA_CLIENT_SECRET=<your_secret>
 *
 * ── Deployment ───────────────────────────────────────────────────────────────
 *   npx supabase functions deploy strava-token-exchange
 *
 * ── Request ──────────────────────────────────────────────────────────────────
 *   POST /functions/v1/strava-token-exchange
 *   Authorization: Bearer <supabase-user-jwt>
 *   Content-Type: application/json
 *
 *   // Code exchange
 *   { "grant_type": "authorization_code", "code": "abc123" }
 *
 *   // Token refresh
 *   { "grant_type": "refresh_token", "refresh_token": "xyz..." }
 *
 * ── Response ─────────────────────────────────────────────────────────────────
 *   200  { access_token, refresh_token, expires_at, athlete? }
 *   400  { error: "..." }
 *   401  { error: "Unauthorized" }
 *   500  { error: "..." }
 */

import { serve }         from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

serve(async (req: Request) => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // ── Auth — require a valid Supabase user JWT ────────────────────────────────
  // Pass the token directly to getUser() — in a Deno runtime there is no
  // session storage, so getUser() without an argument returns null even for
  // a perfectly valid JWT. Passing it explicitly triggers a server-side check.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error('[strava-token-exchange] Auth failed:', authError?.message);
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { grant_type } = body;
  if (grant_type !== 'authorization_code' && grant_type !== 'refresh_token') {
    return json({ error: 'grant_type must be authorization_code or refresh_token' }, 400);
  }

  // ── Read secrets from environment ───────────────────────────────────────────
  const clientId     = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('[strava-token-exchange] Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET');
    return json({ error: 'Server configuration error' }, 500);
  }

  // ── Build Strava token request ──────────────────────────────────────────────
  const stravaPayload: Record<string, string> = {
    client_id:     clientId,
    client_secret: clientSecret,
    grant_type,
  };

  if (grant_type === 'authorization_code') {
    const { code } = body;
    if (!code) return json({ error: 'code is required for authorization_code grant' }, 400);
    stravaPayload.code = code;
  } else {
    const { refresh_token } = body;
    if (!refresh_token) return json({ error: 'refresh_token is required for refresh_token grant' }, 400);
    stravaPayload.refresh_token = refresh_token;
  }

  // ── Call Strava token endpoint ──────────────────────────────────────────────
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(stravaPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[strava-token-exchange] Strava error:', res.status, data);
      return json({ error: data.message ?? `Strava returned ${res.status}` }, res.status);
    }

    // Return only what the client needs — strip anything sensitive
    return json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      // Include athlete on initial code exchange so the app can show the user's name
      ...(data.athlete ? { athlete: {
        firstname: data.athlete.firstname,
        lastname:  data.athlete.lastname,
        id:        data.athlete.id,
      } } : {}),
    });

  } catch (err) {
    console.error('[strava-token-exchange] Fetch error:', err);
    return json({ error: 'Failed to reach Strava' }, 500);
  }
});
