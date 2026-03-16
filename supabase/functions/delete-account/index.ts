/**
 * delete-account — Supabase Edge Function
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * Required by App Store Review Guidelines (June 2023) for apps with user accounts.
 *
 * ── What it deletes ──────────────────────────────────────────────────────────
 *   1. All rows in readiness_scores WHERE user_id = caller's UID
 *   2. The Supabase Auth user record itself (via admin API)
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *   • Caller must provide a valid Supabase JWT — anonymous requests are rejected
 *   • User can only delete their own account (UID comes from the verified JWT)
 *   • Service role key never leaves this function
 *
 * ── Deploy ───────────────────────────────────────────────────────────────────
 *   npx supabase functions deploy delete-account
 */

// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore — Deno global
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')              ?? '';
  const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // ── Verify the caller's JWT ──────────────────────────────────────────────
  const authorization = req.headers.get('Authorization');
  if (!authorization) return json({ error: 'Missing Authorization header' }, 401);

  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userId = user.id;

  // ── Delete user data + auth account ─────────────────────────────────────
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Delete all readiness score rows
    const { error: dataError } = await adminClient
      .from('readiness_scores')
      .delete()
      .eq('user_id', userId);

    if (dataError) {
      console.error('[delete-account] data deletion failed:', dataError.message);
      // Non-fatal — still proceed to delete the auth account
    }

    // 2. Delete the auth user (this is the irreversible step)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return json({ success: true });

  } catch (err: any) {
    console.error('[delete-account] error:', err.message);
    return json({ error: err.message ?? 'Internal server error' }, 500);
  }
});

function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
