import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { readJsonBody, resolveTier } from '../entitlement.ts';

Deno.test('readJsonBody: parses valid JSON', async () => {
  const req = new Request('https://example.test', {
    method: 'POST',
    body: JSON.stringify({ question: 'hi', score: 72 }),
  });
  assertEquals(await readJsonBody(req), { question: 'hi', score: 72 });
});

Deno.test('readJsonBody: rejects an oversized body', async () => {
  const req = new Request('https://example.test', {
    method: 'POST',
    body: 'x'.repeat(2000),
  });
  assertEquals(await readJsonBody(req, 1000), 'too_large');
});

Deno.test('readJsonBody: rejects invalid JSON', async () => {
  const req = new Request('https://example.test', { method: 'POST', body: '{nope' });
  assertEquals(await readJsonBody(req), 'invalid');
});

Deno.test('resolveTier: inside the 7-day trial, no RevenueCat call needed', async () => {
  const created = new Date(Date.now() - 3 * 86_400_000).toISOString();
  assertEquals(await resolveTier({ id: 'u1', created_at: created }), 'trial');
});

Deno.test('resolveTier: unverified when RevenueCat has no key configured', async () => {
  Deno.env.delete('REVENUECAT_SECRET_KEY');
  const created = new Date(Date.now() - 30 * 86_400_000).toISOString();
  assertEquals(await resolveTier({ id: 'u2', created_at: created }), 'unverified');
});
