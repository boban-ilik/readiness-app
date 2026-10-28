/**
 * founder.ts
 *
 * Reads how many Founder (lifetime) places are left from the
 * founder-remaining Edge Function. Display only: returns null on any failure
 * so the paywall falls back to the generic "first 200" line.
 */

import { supabase } from '@services/supabase';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function fetchFounderRemaining(): Promise<number | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !SUPABASE_URL) return null;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8_000);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/founder-remaining`, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: '{}',
      });
      if (!res.ok) return null;
      const body = await res.json();
      const remaining = body?.remaining;
      return typeof remaining === 'number' && Number.isFinite(remaining)
        ? Math.max(0, Math.floor(remaining))
        : null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}
