/**
 * Shared caller gate for the AI edge functions.
 *
 * Every AI function runs with gateway JWT verification off, so each one must
 * (1) verify the caller's session, (2) decide whether that caller may use a
 * metered feature, and (3) count the call. Until this existed, Pro was a
 * client-side flag: a clock rollback restored the trial, a patched client
 * skipped the paywall, and nothing capped call volume.
 *
 * Tier resolution:
 *   trial       auth user.created_at + 7 days (same rule as the client)
 *   pro         RevenueCat REST says the "pro" entitlement is active
 *   free        RevenueCat answered and it is not
 *   unverified  no REVENUECAT_SECRET_KEY configured, or RevenueCat unreachable
 *               → allowed (never lock out a paying user because of our
 *               outage), still capped, logged so it is visible.
 *
 * Usage is recorded in public.ai_calls (service role only) before the model
 * call, so retries count too.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Tier = 'trial' | 'pro' | 'free' | 'unverified';
export type AiFn = 'daily-briefing' | 'coach-chat' | 'weekly-report' | 'ai-insight';

export interface AuthedUser { id: string; created_at?: string }

export interface GateOptions {
  fn:                   AiFn;
  /** Calls per UTC day for any tier. */
  dailyCap:             number;
  /** Free tier may call this once per ISO week (the free weekly briefing). */
  freeWeeklyAllowance?: boolean;
}

export type GateResult =
  | { ok: true;  userId: string; tier: Tier }
  | { ok: false; response: Response };

const TRIAL_MS       = 7 * 24 * 60 * 60 * 1000;
const RC_TIMEOUT_MS  = 4_000;
const MAX_BODY_BYTES = 16_384;

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function env(name: string): string {
  return Deno.env.get(name) ?? '';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function authenticateUser(req: Request): Promise<AuthedUser | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, created_at: user.created_at };
}

// ─── Tier ─────────────────────────────────────────────────────────────────────

async function revenueCatIsPro(userId: string): Promise<boolean | null> {
  const key = env('REVENUECAT_SECRET_KEY');
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RC_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}`, 'X-Platform': 'ios' },
      signal:  controller.signal,
    });
    if (!res.ok) {
      console.warn(`[entitlement] RevenueCat ${res.status} for subscriber lookup`);
      return null;
    }
    const data = await res.json();
    const pro  = data?.subscriber?.entitlements?.pro;
    if (!pro) return false;
    // expires_date is null for lifetime access, otherwise an ISO timestamp.
    if (pro.expires_date == null) return true;
    return Date.parse(pro.expires_date) > Date.now();
  } catch (e) {
    console.warn('[entitlement] RevenueCat unreachable:', (e as Error)?.message ?? e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveTier(user: AuthedUser): Promise<Tier> {
  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  if (!isNaN(created) && Date.now() < created + TRIAL_MS) return 'trial';

  const pro = await revenueCatIsPro(user.id);
  if (pro === null) return 'unverified';
  return pro ? 'pro' : 'free';
}

// ─── Usage ────────────────────────────────────────────────────────────────────

function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfIsoWeekUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString();
}

async function countCalls(admin: SupabaseClient, userId: string, fn: AiFn, since: string): Promise<number> {
  const { count, error } = await admin
    .from('ai_calls')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('fn', fn)
    .gte('created_at', since);
  if (error) {
    console.warn('[entitlement] usage count failed:', error.message);
    return 0; // fail open on our own DB error; the cap is a backstop, not the product
  }
  return count ?? 0;
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

/**
 * Authenticate (unless `user` is passed in), resolve the tier, enforce the
 * feature rule and the daily cap, and record the call.
 */
export async function gate(
  req:  Request,
  opts: GateOptions,
  cors: Record<string, string>,
  user?: AuthedUser | null,
): Promise<GateResult> {
  const authed = user ?? await authenticateUser(req);
  if (!authed) return { ok: false, response: json({ error: 'Unauthorized' }, 401, cors) };

  const tier  = await resolveTier(authed);
  const admin = adminClient();

  if (tier === 'free') {
    if (!opts.freeWeeklyAllowance) {
      return { ok: false, response: json({ error: 'pro_required' }, 402, cors) };
    }
    const thisWeek = await countCalls(admin, authed.id, opts.fn, startOfIsoWeekUtc());
    if (thisWeek >= 1) {
      return { ok: false, response: json({ error: 'pro_required' }, 402, cors) };
    }
  }

  const today = await countCalls(admin, authed.id, opts.fn, startOfUtcDay());
  if (today >= opts.dailyCap) {
    return { ok: false, response: json({ error: 'daily_limit' }, 429, cors) };
  }

  const { error } = await admin.from('ai_calls').insert({ user_id: authed.id, fn: opts.fn });
  if (error) console.warn('[entitlement] usage insert failed:', error.message);

  if (tier === 'unverified') {
    console.warn(`[entitlement] ${opts.fn}: tier unverified for ${authed.id} (RevenueCat key missing or unreachable)`);
  }

  return { ok: true, userId: authed.id, tier };
}

// ─── Body ─────────────────────────────────────────────────────────────────────

export async function readJsonBody<T>(req: Request): Promise<T | 'too_large' | 'invalid'> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return 'too_large';
  try { return JSON.parse(raw) as T; } catch { return 'invalid'; }
}
