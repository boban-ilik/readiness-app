import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// AsyncStorage for native — no size limit (unlike SecureStore's 2048 byte cap,
// which Supabase session tokens routinely exceed).
// For web, fall back to localStorage guarded against SSR (Node.js has no localStorage).
const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (typeof localStorage === 'undefined') return Promise.resolve(null);
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (typeof localStorage === 'undefined') return Promise.resolve();
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (typeof localStorage === 'undefined') return Promise.resolve();
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Supabase's internal retry logic calls console.error on network failures,
    // which triggers React Native's red error overlay in dev mode.
    // Wrap fetch so failures surface as console.warn (no overlay) instead.
    fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
      try {
        return await fetch(url as string, options);
      } catch (err: any) {
        if (__DEV__) {
          console.warn(
            '[Supabase] Network request failed — is your project paused at supabase.com/dashboard?',
            err?.message ?? err,
          );
        }
        throw err;
      }
    },
  },
});
