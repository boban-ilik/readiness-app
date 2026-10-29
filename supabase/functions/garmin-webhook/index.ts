/**
 * garmin-webhook: Garmin's push endpoint, one path per summary type.
 *
 *   POST /functions/v1/garmin-webhook/<GARMIN_WEBHOOK_KEY>/<type>
 *   POST /functions/v1/garmin-webhook/<type>?k=<GARMIN_WEBHOOK_KEY>
 *   <type> in dailies | sleeps | hrv | stressDetails | userMetrics | hydration |
 *          activities | deregistrations | userPermissionsChange
 *
 * Garmin signs nothing, so the key in the registered URL is what proves the
 * caller. API Tools drops query strings on save, so the key normally rides in
 * the path. Items for Garmin users we don't know are dropped. Answers 200 fast;
 * Garmin retries on anything else.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { adminClient, json, secretMatches, deleteGarminData } from '../_shared/garminApi.ts';
import { SUMMARY_TYPES, TABLE_FOR, CONFLICT_FOR, itemsOf, garminUserId, mapSummary, dedupeByConflict, type SummaryType } from '../_shared/garmin.ts';

const MAX_BODY_BYTES = 5_000_000;

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const type = parts.pop() as SummaryType | undefined;
  const pathKey = parts.length && parts[parts.length - 1] !== 'garmin-webhook' ? parts[parts.length - 1] : null;
  if (!secretMatches('GARMIN_WEBHOOK_KEY', pathKey ?? url.searchParams.get('k'))) return json({ error: 'Forbidden' }, 403);

  if (!type || !SUMMARY_TYPES.includes(type)) return json({ error: 'Unknown summary type' }, 404);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Too large' }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const items = itemsOf(body, type);
  if (items.length === 0) return json({ ok: true, stored: 0 });

  const db = adminClient();
  const garminIds = [...new Set(items.map(garminUserId).filter((x): x is string => !!x))];
  const { data: conns, error: connErr } = await db.from('garmin_connections').select('user_id, garmin_user_id').in('garmin_user_id', garminIds);
  if (connErr) {
    // With no lookup every item maps to no user and a 200 would tell Garmin
    // the batch was stored. A 500 makes Garmin send it again.
    console.error(`[garmin-webhook] ${type}: connection lookup failed:`, connErr.message);
    return json({ error: 'Connection lookup failed' }, 500);
  }
  const userFor = new Map<string, string>((conns ?? []).map((c: { user_id: string; garmin_user_id: string }) => [c.garmin_user_id, c.user_id]));

  try {
    if (type === 'deregistrations') {
      // The user disconnected on Garmin's side: honour it like an in-app disconnect.
      for (const gid of garminIds) {
        const uid = userFor.get(gid);
        if (uid) await deleteGarminData(db, uid);
      }
      return json({ ok: true, removed: garminIds.length });
    }

    if (type === 'userPermissionsChange') {
      for (const item of items) {
        const uid = userFor.get(garminUserId(item) ?? '');
        const perms = Array.isArray(item.permissions) ? item.permissions.filter((p): p is string => typeof p === 'string') : null;
        if (uid && perms) await db.from('garmin_connections').update({ permissions: perms }).eq('user_id', uid);
      }
      return json({ ok: true });
    }

    const rows = dedupeByConflict(type, items
      .map(item => { const uid = userFor.get(garminUserId(item) ?? ''); return uid ? mapSummary(type, uid, item) : null; })
      .filter((r): r is NonNullable<typeof r> => r !== null));
      if (rows.length === 0) return json({ ok: true, stored: 0 });

    const { error } = await db.from(TABLE_FOR[type]).upsert(rows, { onConflict: CONFLICT_FOR[type] });
    if (error) throw new Error(error.message);
    return json({ ok: true, stored: rows.length });
  } catch (err) {
    console.error(`[garmin-webhook] ${type}:`, err instanceof Error ? err.message : err);
    return json({ error: 'Storage failed' }, 500);
  }
});
