import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStravaToken, clearStravaTokens } from '../strava';

const mockKeychain = new Map<string, string>();
const mockLegacy   = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync:    jest.fn(async (k: string, v: string) => {
    // The rule iOS enforces: build 81 shipped keys that broke it.
    if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error('Invalid key provided to SecureStore.');
    mockKeychain.set(k, v);
  }),
  getItemAsync:    jest.fn(async (k: string) => mockKeychain.get(k) ?? null),
  deleteItemAsync: jest.fn(async (k: string) => { mockKeychain.delete(k); }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem:     jest.fn(async (k: string) => mockLegacy.get(k) ?? null),
    setItem:     jest.fn(async (k: string, v: string) => { mockLegacy.set(k, v); }),
    removeItem:  jest.fn(async (k: string) => { mockLegacy.delete(k); }),
    multiRemove: jest.fn(async (ks: string[]) => { ks.forEach(k => mockLegacy.delete(k)); }),
  },
}));

jest.mock('../supabase', () => ({ supabase: {} }));

beforeEach(() => { mockKeychain.clear(); mockLegacy.clear(); jest.clearAllMocks(); });

describe('Strava tokens in the Keychain', () => {
  it('reads nothing when neither store has a connection', async () => {
    expect(await getStravaToken()).toBeNull();
  });

  it('moves a connection saved by 1.2.1 or earlier out of AsyncStorage, using keys the Keychain accepts', async () => {
    mockLegacy.set('@readiness/strava_access_token', 'acc');
    mockLegacy.set('@readiness/strava_refresh_token', 'ref');
    mockLegacy.set('@readiness/strava_expires_at', '1700000000');
    mockLegacy.set('@readiness/strava_athlete_name', 'Boban');

    const first = await getStravaToken();
    expect(first).toEqual({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 1700000000, athleteName: 'Boban' });
    expect(mockLegacy.size).toBe(0);
    for (const k of mockKeychain.keys()) expect(k).toMatch(/^[A-Za-z0-9._-]+$/);

    // Second read comes from the Keychain alone.
    expect(await getStravaToken()).toEqual(first);
    expect((AsyncStorage.getItem as jest.Mock).mock.calls.length).toBe(4);
  });

  it('clears every Keychain key on disconnect', async () => {
    mockLegacy.set('@readiness/strava_access_token', 'acc');
    mockLegacy.set('@readiness/strava_refresh_token', 'ref');
    await getStravaToken();
    expect(mockKeychain.size).toBeGreaterThan(0);
    await clearStravaTokens();
    expect(mockKeychain.size).toBe(0);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
  });
});
