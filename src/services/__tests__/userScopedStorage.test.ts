import { USER_SCOPED_KEYS } from '../userScopedStorage';
import { GARMIN_CONNECTED_KEY } from '../garmin';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// garmin.ts builds the Supabase client at import; only its key is needed here.
jest.mock('@services/supabase', () => ({ supabase: {} }));

describe('user-scoped storage (1.2.1)', () => {
  it('wipes the Garmin connected flag when a different account signs in', () => {
    expect(USER_SCOPED_KEYS).toContain(GARMIN_CONNECTED_KEY);
  });
});
