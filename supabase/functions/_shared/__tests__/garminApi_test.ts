import { assertEquals, assertNotEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { secretMatches, expiries, randomToken, codeChallenge, type TokenSet } from '../garminApi.ts';

Deno.test('secretMatches: matches the configured secret', () => {
  Deno.env.set('TEST_SECRET', 'abc123');
  assertEquals(secretMatches('TEST_SECRET', 'abc123'), true);
  assertEquals(secretMatches('TEST_SECRET', 'wrong'), false);
  assertEquals(secretMatches('TEST_SECRET', null), false);
  assertEquals(secretMatches('TEST_SECRET', ''), false);
});

Deno.test('secretMatches: an unset secret denies everyone', () => {
  Deno.env.delete('UNSET_TEST_SECRET');
  assertEquals(secretMatches('UNSET_TEST_SECRET', 'anything'), false);
});

Deno.test('expiries: trims 10 minutes off and floors at zero', () => {
  const now = 1700000000000;
  const t: TokenSet = {
    access_token: 'a',
    refresh_token: 'r',
    expires_in: 3600,
    refresh_token_expires_in: 3600,
  };
  const e = expiries(t, now);
  assertEquals(e.access_expires_at, new Date(now + (3600 - 600) * 1000).toISOString());
  assertEquals(e.refresh_expires_at, new Date(now + (3600 - 600) * 1000).toISOString());

  // A token with under 10 minutes left must not go negative.
  const short = expiries({ ...t, expires_in: 100 }, now);
  assertEquals(short.access_expires_at, new Date(now).toISOString());
});

Deno.test('randomToken: base64url, requested length, not constant', () => {
  const a = randomToken(48);
  const b = randomToken(48);
  assertEquals(a.length, 64); // 48 bytes -> 64 base64url chars
  assert(/^[A-Za-z0-9_-]+$/.test(a));
  assertNotEquals(a, b);
});

Deno.test('codeChallenge: deterministic SHA-256 base64url', async () => {
  const c1 = await codeChallenge('abc');
  const c2 = await codeChallenge('abc');
  assertEquals(c1, c2);
  assertEquals(c1.length, 43); // SHA-256 -> 32 bytes -> 43 base64url chars
  assert(/^[A-Za-z0-9_-]+$/.test(c1));
  assertNotEquals(c1, await codeChallenge('abd'));
});
