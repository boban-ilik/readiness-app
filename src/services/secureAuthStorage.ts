/**
 * secureAuthStorage — a SecureStore-backed adapter for the Supabase client.
 *
 * The Supabase auth session (JWT + refresh token) is a credential, so it
 * belongs in the iOS Keychain rather than AsyncStorage. SecureStore caps a
 * single value at 2048 bytes and a refreshed session can exceed that, so
 * longer values are chunked across several keys and reassembled on read.
 *
 * Native only — the web fallback lives in supabase.ts (SecureStore has no
 * web implementation).
 */

import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // chars — under the 2048-byte cap, with margin

const countKey = (key: string): string => `${key}::__count`;
const chunkKey = (key: string, i: number): string => `${key}::${i}`;

async function getItem(key: string): Promise<string | null> {
  // Small values are stored whole under the bare key.
  const direct = await SecureStore.getItemAsync(key).catch(() => null);
  if (direct !== null) return direct;

  const countRaw = await SecureStore.getItemAsync(countKey(key)).catch(() => null);
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count <= 0) return null;

  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i)).catch(() => null)),
  );
  if (parts.some(p => p === null)) return null; // incomplete write
  return parts.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  // Clear any prior state (direct or chunked) before writing fresh.
  await removeItem(key).catch(() => {});

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(countKey(key), String(count));
}

async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key).catch(() => {});
  const countRaw = await SecureStore.getItemAsync(countKey(key)).catch(() => null);
  const count = Number(countRaw);
  if (Number.isInteger(count) && count > 0) {
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => {})),
    );
  }
  await SecureStore.deleteItemAsync(countKey(key)).catch(() => {});
}

export const secureAuthStorage = { getItem, setItem, removeItem };
