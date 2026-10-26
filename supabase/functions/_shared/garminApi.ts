/**
 * Garmin Connect API calls that need secrets or the network. Deno only.
 * OAuth2 PKCE 2.0 spec: token exchange and refresh happen here, never on a
 * device; refresh tokens rotate on every refresh and expire after 3 months.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const GARMIN = {
  authorizeUrl: 'https://connect.garmin.com/oauth2Confirm',
  tokenUrl:     'https://diauth.garmin.com/di-oauth2-service/oauth/token',
  apiBase:      'https://apis.garmin.com/partner-gateway/rest',
  /** Must match the OAuth redirect URL registered on the Garmin app. */
  redirectUri:  'https://vgvrmhqkcqdimgwzbbhc.supabase.co/functions/v1/garmin-callback',
  /** Where the callback sends the user back into the app. */
  appReturnUrl: 'readiness://garmin-callback',
} as const;

export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/** A caller-supplied secret matches the configured one. An unset secret denies everyone. */
export function secretMatches(name: string, supplied: string | null): boolean {
  const expected = Deno.env.get(name);
  return !!expected && !!supplied && expected === supplied;
}

/** Service-role client: bypasses RLS, so only for server-side writes. */
export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** The signed-in app user from a Bearer JWT, or null. */
export async function userFromRequest(req: Request): Promise<{ id: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
  const { data: { user }, error } = await client.auth.getUser(token);
  return error || !user ? null : { id: user.id };
}

export interface TokenSet {
  access_token:             string;
  refresh_token:            string;
  expires_in:               number;
  refresh_token_expires_in: number;
  scope?:                   string;
}

function basicAuth(): string {
  return 'Basic ' + btoa(`${env('GARMIN_CONSUMER_KEY')}:${env('GARMIN_CONSUMER_SECRET')}`);
}

async function tokenRequest(params: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(GARMIN.tokenUrl, {
    method:  'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({ client_id: env('GARMIN_CONSUMER_KEY'), client_secret: env('GARMIN_CONSUMER_SECRET'), ...params }).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Garmin token endpoint ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text) as TokenSet;
  if (!data.access_token || !data.refresh_token) throw new Error('Garmin token response incomplete');
  return data;
}

export function exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
  return tokenRequest({ grant_type: 'authorization_code', code, code_verifier: codeVerifier, redirect_uri: GARMIN.redirectUri });
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

async function apiGet(accessToken: string, path: string): Promise<unknown> {
  const res = await fetch(`${GARMIN.apiBase}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Garmin ${path} ${res.status}`);
  return res.json();
}

export async function fetchGarminUserId(accessToken: string): Promise<string> {
  const data = await apiGet(accessToken, '/user/id') as { userId?: string };
  if (!data.userId) throw new Error('Garmin user id missing');
  return data.userId;
}

export async function fetchPermissions(accessToken: string): Promise<string[]> {
  const data = await apiGet(accessToken, '/user/permissions') as { permissions?: string[] };
  return Array.isArray(data.permissions) ? data.permissions : [];
}

/** Garmin's own disconnect; required whenever the app offers one. */
export async function deleteRegistration(accessToken: string): Promise<void> {
  const res = await fetch(`${GARMIN.apiBase}/user/registration`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  // 404 means it was already gone, which is the state we want.
  if (!res.ok && res.status !== 404) throw new Error(`Garmin delete registration ${res.status}`);
}

/** Expiry timestamps from a token response, trimmed by 10 minutes as the spec advises. */
export function expiries(t: TokenSet, now = Date.now()) {
  return {
    access_expires_at:  new Date(now + Math.max(0, t.expires_in - 600) * 1000).toISOString(),
    refresh_expires_at: new Date(now + Math.max(0, t.refresh_token_expires_in - 600) * 1000).toISOString(),
  };
}

/** Every Garmin row for a user, in one place so disconnect and deregistration agree. */
export const GARMIN_DATA_TABLES = ['garmin_daily', 'garmin_sleep', 'garmin_hrv', 'garmin_stress', 'garmin_user_metrics', 'garmin_hydration', 'garmin_activities'];

export async function deleteGarminData(db: SupabaseClient, userId: string): Promise<void> {
  for (const t of GARMIN_DATA_TABLES) {
    const { error } = await db.from(t).delete().eq('user_id', userId);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
  const { error } = await db.from('garmin_connections').delete().eq('user_id', userId);
  if (error) throw new Error(`garmin_connections: ${error.message}`);
}

/** PKCE: 64 random bytes as base64url is within the 43..128 character rule. */
export function randomToken(bytes = 48): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
