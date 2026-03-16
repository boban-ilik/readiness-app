/**
 * Strava Integration Service
 *
 * Implements the Strava OAuth 2.0 flow using:
 *  - Linking.openURL() to open Strava's auth page in Safari (no in-app browser needed)
 *  - The app's "readiness://" URL scheme to capture the callback
 *  - Native fetch() for all API calls — no external packages required
 *  - AsyncStorage for token persistence
 *
 * SETUP (one-time — you do this in the Strava developer portal):
 *  1. Go to https://www.strava.com/settings/api
 *  2. Create an app or open your existing one
 *  3. Set the "Authorization Callback Domain" to: strava-callback
 *     (Strava validates the host portion of redirect_uri — for "readiness://strava-callback"
 *      the host is "strava-callback", so that is what must match)
 *  4. Set Supabase secrets (once, via CLI):
 *       npx supabase secrets set STRAVA_CLIENT_ID=211386
 *       npx supabase secrets set STRAVA_CLIENT_SECRET=<your_secret>
 *  5. Deploy the Edge Function:
 *       npx supabase functions deploy strava-token-exchange
 *
 * SECURITY:
 *  Token exchange is proxied through the strava-token-exchange Edge Function.
 *  The client secret never ships in the app binary.
 */

import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@services/supabase';

// ─── Configuration ────────────────────────────────────────────────────────────

export const STRAVA_CONFIG = {
  clientId:    '211386',
  redirectUri: 'readiness://strava-callback',
  scope:       'read,activity:read',
};

// ─── Edge Function proxy ──────────────────────────────────────────────────────

/**
 * Calls the strava-token-exchange Edge Function with the current user's JWT.
 * Handles both authorization_code and refresh_token grant types.
 *
 * Uses raw fetch() so we have full control over the response body —
 * supabase.functions.invoke() swallows the error detail before we can read it.
 * URL and anon key come from the same source as the Supabase client so they
 * are guaranteed to be correct.
 *
 * Retries once with a forced session refresh on 401 (stale cached JWT).
 */
async function stravaTokenViaEdgeFunction(
  payload: Record<string, string>,
): Promise<Record<string, unknown>> {
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/strava-token-exchange`;

  async function attempt(jwt: string): Promise<Response> {
    return fetch(EDGE_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${jwt}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
  }

  // First attempt with cached session
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('[Strava] Not signed in');

  let res = await attempt(session.access_token);

  // Stale JWT — force a Supabase session refresh and retry once
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (!refreshed.session) throw new Error('[Strava] Session expired — please sign in again');
    res = await attempt(refreshed.session.access_token);
  }

  // Parse body regardless of status so we can surface the real error message
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* non-JSON response */ }

  if (!res.ok) {
    const detail = (body.error as string) ?? `Edge Function returned ${res.status}`;
    console.error('[Strava] Edge Function error:', res.status, body);
    throw new Error(detail);
  }

  return body;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ACCESS_TOKEN  = '@readiness/strava_access_token';
const KEY_REFRESH_TOKEN = '@readiness/strava_refresh_token';
const KEY_EXPIRES_AT    = '@readiness/strava_expires_at';
const KEY_ATHLETE_NAME  = '@readiness/strava_athlete_name';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StravaToken {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;  // Unix timestamp (seconds)
  athleteName:  string;
}

export interface StravaActivity {
  id:                  number;
  name:                string;
  sport_type:          string;
  start_date_local:    string;
  elapsed_time:        number;   // seconds
  moving_time:         number;   // seconds
  distance:            number;   // metres
  total_elevation_gain: number;
  average_heartrate?:  number;
  max_heartrate?:      number;
  suffer_score?:       number;   // Training Load Points (may be null if user hasn't enabled)
  perceived_exertion?: number;   // 1–10 RPE (optional, athlete-entered)
  calories?:           number;
  average_watts?:      number;   // cycling only
  weighted_average_watts?: number;  // cycling only
  has_heartrate:       boolean;
  kilojoules?:         number;   // cycling energy
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

/**
 * Opens Strava's OAuth page in Safari.
 * The user authorises → Strava calls readiness://strava-callback?code=...
 * You must call handleStravaCallback(url) from your deep-link handler.
 */
export function initiateStravaAuth(): void {
  const params = new URLSearchParams({
    client_id:     STRAVA_CONFIG.clientId,
    redirect_uri:  STRAVA_CONFIG.redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope:         STRAVA_CONFIG.scope,
  });

  const url = `https://www.strava.com/oauth/mobile/authorize?${params.toString()}`;
  Linking.openURL(url).catch(err =>
    console.error('[Strava] Failed to open auth URL:', err),
  );
}

/**
 * Call this from your app's Linking event handler when a "readiness://strava-callback"
 * URL is received. It extracts the auth code, exchanges it for tokens, and persists them.
 *
 * @returns The StravaToken if successful, null otherwise.
 */
export async function handleStravaCallback(url: string): Promise<StravaToken | null> {
  try {
    const parsed = new URL(url);
    const code   = parsed.searchParams.get('code');
    const error  = parsed.searchParams.get('error');

    if (error || !code) {
      console.warn('[Strava] Auth denied or missing code:', error);
      return null;
    }

    return await exchangeCodeForToken(code);
  } catch (err) {
    console.error('[Strava] handleStravaCallback error:', err);
    return null;
  }
}

/** Exchange an auth code for access + refresh tokens via the Edge Function. */
async function exchangeCodeForToken(code: string): Promise<StravaToken | null> {
  try {
    const data = await stravaTokenViaEdgeFunction({
      grant_type: 'authorization_code',
      code,
    });

    const token: StravaToken = {
      accessToken:  String(data.access_token  ?? ''),
      refreshToken: String(data.refresh_token ?? ''),
      expiresAt:    Number(data.expires_at    ?? 0),
      athleteName:  [
        (data.athlete as { firstname?: string } | undefined)?.firstname,
        (data.athlete as { lastname?: string }  | undefined)?.lastname,
      ].filter(Boolean).join(' '),
    };

    await persistToken(token);
    return token;
  } catch (err) {
    console.error('[Strava] Token exchange failed:', err);
    return null;
  }
}

// ─── Token management ─────────────────────────────────────────────────────────

async function persistToken(token: StravaToken): Promise<void> {
  await AsyncStorage.multiSet([
    [KEY_ACCESS_TOKEN,  token.accessToken],
    [KEY_REFRESH_TOKEN, token.refreshToken],
    [KEY_EXPIRES_AT,    String(token.expiresAt)],
    [KEY_ATHLETE_NAME,  token.athleteName],
  ]);
}

export async function getStravaToken(): Promise<StravaToken | null> {
  const values = await AsyncStorage.multiGet([
    KEY_ACCESS_TOKEN,
    KEY_REFRESH_TOKEN,
    KEY_EXPIRES_AT,
    KEY_ATHLETE_NAME,
  ]);

  const map = Object.fromEntries(values.map(([k, v]) => [k, v]));
  const accessToken  = map[KEY_ACCESS_TOKEN];
  const refreshToken = map[KEY_REFRESH_TOKEN];
  const expiresAt    = map[KEY_EXPIRES_AT];

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt:    Number(expiresAt ?? 0),
    athleteName:  map[KEY_ATHLETE_NAME] ?? '',
  };
}

export async function disconnectStrava(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEY_ACCESS_TOKEN,
    KEY_REFRESH_TOKEN,
    KEY_EXPIRES_AT,
    KEY_ATHLETE_NAME,
  ]);
}

/** Returns a valid access token, refreshing if expired. */
async function getValidAccessToken(): Promise<string | null> {
  const token = await getStravaToken();
  if (!token) return null;

  const nowSecs = Math.floor(Date.now() / 1000);
  if (token.expiresAt - nowSecs > 60) {
    return token.accessToken;  // still fresh
  }

  // Refresh via Edge Function
  try {
    const data = await stravaTokenViaEdgeFunction({
      grant_type:    'refresh_token',
      refresh_token: token.refreshToken,
    });

    const fresh: StravaToken = {
      accessToken:  String(data.access_token  ?? ''),
      refreshToken: String(data.refresh_token ?? token.refreshToken),
      expiresAt:    Number(data.expires_at    ?? 0),
      athleteName:  token.athleteName,
    };

    await persistToken(fresh);
    return fresh.accessToken;
  } catch (err: any) {
    console.error('[Strava] Token refresh error:', err);

    // If Strava explicitly rejects the refresh token (authorization revoked,
    // token invalid, etc.) clear stored credentials so the UI shows
    // "Connect Strava" instead of silently failing on every app open.
    const msg = (err?.message ?? '').toLowerCase();
    const isUnrecoverable =
      msg.includes('invalid_grant') ||
      msg.includes('authorization error') ||
      msg.includes('invalid refresh') ||
      msg.includes('token expired');

    if (isUnrecoverable) {
      console.warn('[Strava] Unrecoverable refresh error — clearing stored tokens');
      await disconnectStrava();
    }

    return null;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetches recent activities from Strava.
 * @param days  How many calendar days back to fetch (default: 7)
 * @param perPage  Max activities to return (default: 30)
 */
export async function fetchStravaActivities(
  days    = 7,
  perPage = 30,
): Promise<StravaActivity[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return [];

  const after = Math.floor(Date.now() / 1000) - days * 86400;
  const url   = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=${perPage}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[Strava] Activities fetch failed:', res.status);
      return [];
    }

    const data: StravaActivity[] = await res.json();
    console.log(`[Strava] Fetched ${data.length} activities`);
    return data;
  } catch (err) {
    console.error('[Strava] fetchStravaActivities error:', err);
    return [];
  }
}

/**
 * Fetches detailed info for a single activity (includes suffer_score + perceived_exertion).
 * Use sparingly — each call costs 1 API unit.
 */
export async function fetchStravaActivityDetail(
  activityId: number,
): Promise<StravaActivity | null> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      console.error('[Strava] Activity detail failed:', res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[Strava] fetchStravaActivityDetail error:', err);
    return null;
  }
}

// ─── Suffer Score → Load Tier mapping ────────────────────────────────────────

/**
 * Maps Strava's Suffer Score (Training Load Points) to the same LoadTier
 * used by the Apple Health workout classifier — so both data sources
 * can feed the same WorkoutContextBanner.
 *
 * Strava Suffer Score scale:
 *   < 25    = "Recovery" / trivial
 *   25–50   = "Tiring"
 *   50–100  = "Tough"
 *   100–200 = "Brutal"
 *   > 200   = "Historic"
 */
export function sufferScoreToLoadTier(
  sufferScore: number | null | undefined,
): 'none' | 'light' | 'moderate' | 'heavy' | 'peak' {
  if (sufferScore == null || sufferScore === 0) return 'none';
  if (sufferScore < 25)  return 'light';
  if (sufferScore < 75)  return 'moderate';
  if (sufferScore < 150) return 'heavy';
  return 'peak';
}
