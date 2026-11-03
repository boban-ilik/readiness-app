import { secureAuthStorage } from '../secureAuthStorage';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: async (k: string, v: string) => { mockStore.set(k, v); },
  getItemAsync: async (k: string) => (mockStore.get(k) ?? null),
  deleteItemAsync: async (k: string) => { mockStore.delete(k); },
}));

describe('secureAuthStorage (chunked Keychain adapter)', () => {
  beforeEach(() => mockStore.clear());

  it('stores a small value whole under the bare key', async () => {
    await secureAuthStorage.setItem('k', 'small');
    expect(mockStore.has('k')).toBe(true);
    expect(mockStore.has('k::__count')).toBe(false);
    expect(await secureAuthStorage.getItem('k')).toBe('small');
  });

  it('chunks and reassembles a value over the cap', async () => {
    const big = 'x'.repeat(5000);
    await secureAuthStorage.setItem('k', big);
    expect(mockStore.has('k')).toBe(false); // stored chunked, not whole
    expect(await secureAuthStorage.getItem('k')).toBe(big);
  });

  it('shrinks cleanly from chunked back to a whole value', async () => {
    await secureAuthStorage.setItem('k', 'x'.repeat(5000));
    await secureAuthStorage.setItem('k', 'small');
    expect(await secureAuthStorage.getItem('k')).toBe('small');
    expect(mockStore.has('k::__count')).toBe(false);
    expect(mockStore.has('k::0')).toBe(false);
  });

  it('removeItem clears both direct and chunked values', async () => {
    await secureAuthStorage.setItem('k', 'x'.repeat(5000));
    await secureAuthStorage.removeItem('k');
    expect(await secureAuthStorage.getItem('k')).toBeNull();
    expect(mockStore.size).toBe(0);
  });

  it('returns null for a missing key', async () => {
    expect(await secureAuthStorage.getItem('missing')).toBeNull();
  });
});
