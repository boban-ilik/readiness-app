import * as SecureStore from 'expo-secure-store';
import { secureAuthStorage } from '../secureAuthStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockLegacy = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockLegacy.get(k) ?? null),
    removeItem: jest.fn(async (k: string) => { mockLegacy.delete(k); }),
  },
}));

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  mockLegacy.clear();
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => { store.set(k, v); });
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => store.get(k) ?? null);
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (k: string) => { store.delete(k); });
});

describe('secureAuthStorage (chunked Keychain adapter)', () => {
  it('stores a small value whole under the bare key', async () => {
    await secureAuthStorage.setItem('k', 'small');
    expect(store.has('k')).toBe(true);
    expect(store.has('k::__count')).toBe(false);
    expect(await secureAuthStorage.getItem('k')).toBe('small');
  });

  it('chunks and reassembles a value over the cap', async () => {
    const big = 'x'.repeat(5000);
    await secureAuthStorage.setItem('k', big);
    expect(store.has('k')).toBe(false); // stored chunked, not whole
    expect(await secureAuthStorage.getItem('k')).toBe(big);
  });

  it('shrinks cleanly from chunked back to a whole value', async () => {
    await secureAuthStorage.setItem('k', 'x'.repeat(5000));
    await secureAuthStorage.setItem('k', 'small');
    expect(await secureAuthStorage.getItem('k')).toBe('small');
    expect(store.has('k::__count')).toBe(false);
    expect(store.has('k::0')).toBe(false);
  });

  it('removeItem clears both direct and chunked values', async () => {
    await secureAuthStorage.setItem('k', 'x'.repeat(5000));
    await secureAuthStorage.removeItem('k');
    expect(await secureAuthStorage.getItem('k')).toBeNull();
    expect(store.size).toBe(0);
  });

  it('returns null for a missing key', async () => {
    expect(await secureAuthStorage.getItem('missing')).toBeNull();
  });

  describe('migration from the AsyncStorage adapter (1.2.1 and earlier)', () => {
    const KEY = 'sb-vgvrmhqkcqdimgwzbbhc-auth-token';

    it('moves a legacy session into the Keychain and deletes the plaintext copy', async () => {
      const session = JSON.stringify({ access_token: 'a'.repeat(3000), refresh_token: 'r' });
      mockLegacy.set(KEY, session);
      expect(await secureAuthStorage.getItem(KEY)).toBe(session);
      expect(mockLegacy.has(KEY)).toBe(false);
      expect(store.has(KEY + '::__count')).toBe(true);
      expect(await secureAuthStorage.getItem(KEY)).toBe(session); // now served from the Keychain
    });

    it('returns null when neither store has the key', async () => {
      expect(await secureAuthStorage.getItem(KEY)).toBeNull();
    });

    it('keeps the legacy copy if the Keychain write fails', async () => {
      mockLegacy.set(KEY, 'session');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
      expect(await secureAuthStorage.getItem(KEY)).toBe('session');
      expect(mockLegacy.has(KEY)).toBe(true);
    });
  });
});
