import { USER_SCOPED_KEYS, USER_SCOPED_PREFIXES, DATA_OWNER_KEY } from '../storageKeys';
import { GARMIN_CONNECTED_KEY } from '../garmin';
import { STRAVA_OAUTH_STATE_KEY } from '../strava';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// garmin.ts builds the Supabase client at import; only its key is needed here.
jest.mock('@services/supabase', () => ({ supabase: {} }));

describe('user-scoped storage keys', () => {
  it('wipes the Garmin connected flag when a different account signs in', () => {
    expect(USER_SCOPED_KEYS).toContain(GARMIN_CONNECTED_KEY);
  });

  it('wipes the Strava OAuth state with the rest of the Strava keys', () => {
    expect(USER_SCOPED_KEYS).toContain(STRAVA_OAUTH_STATE_KEY);
  });

  it('has no duplicate keys (a duplicate is a hand-edit mistake)', () => {
    expect(new Set(USER_SCOPED_KEYS).size).toBe(USER_SCOPED_KEYS.length);
    expect(new Set(USER_SCOPED_PREFIXES).size).toBe(USER_SCOPED_PREFIXES.length);
  });

  it('names every key under the @readiness/ namespace', () => {
    for (const k of [...USER_SCOPED_KEYS, ...USER_SCOPED_PREFIXES]) {
      expect(k.startsWith('@readiness/')).toBe(true);
    }
  });

  it('covers the most sensitive per-user data', () => {
    const mustWipe = [
      '@readiness/hrv_baseline',
      '@readiness/rhr_baseline',
      '@readiness/cycle_entries',
      '@readiness/coach_chat_v1',
      '@readiness/profile_sex',
      '@readiness/profile_goal',
      '@readiness/joined_at',
      '@readiness/illness_episodes_v1',
    ];
    for (const k of mustWipe) {
      expect(USER_SCOPED_KEYS).toContain(k);
    }
  });

  it('keeps the data-owner key outside the wipe (it is removed separately)', () => {
    expect(USER_SCOPED_KEYS).not.toContain(DATA_OWNER_KEY);
  });
});
