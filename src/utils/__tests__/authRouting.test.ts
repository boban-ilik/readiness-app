import { getAuthRedirect } from '../authRouting';

describe('auth redirect', () => {
  it('leaves the email callback alone before and after sign-in', () => {
    for (const signedIn of [false, true]) {
      for (const done of [false, true]) {
        expect(getAuthRedirect(['(auth)', 'callback'], signedIn, done)).toBeNull();
      }
    }
  });

  it('keeps signed-in deep links, including the Strava callback', () => {
    expect(getAuthRedirect(['strava-callback'], true, false)).toBeNull();
    expect(getAuthRedirect(['strava-callback'], true, true)).toBeNull();
    expect(getAuthRedirect(['(tabs)', 'profile'], true, true)).toBeNull();
    expect(getAuthRedirect(['coach-chat'], true, true)).toBeNull();
  });

  it('routes the root and protected screens by auth state', () => {
    expect(getAuthRedirect([], false, false)).toBe('/(auth)/login');
    expect(getAuthRedirect([], true, false)).toBe('/onboarding');
    expect(getAuthRedirect([], true, true)).toBe('/(tabs)');
    expect(getAuthRedirect(['(tabs)'], false, true)).toBe('/(auth)/login');
    expect(getAuthRedirect(['(auth)', 'signup'], false, false)).toBeNull();
    expect(getAuthRedirect(['(auth)', 'login'], true, true)).toBe('/(tabs)');
  });

  it('never sends a finished onboarding back to setup', () => {
    expect(getAuthRedirect(['(tabs)'], true, true)).toBeNull();
    expect(getAuthRedirect(['onboarding'], true, false)).toBeNull();
    expect(getAuthRedirect(['onboarding'], true, true)).toBe('/(tabs)');
    expect(getAuthRedirect(['(tabs)'], true, false)).toBe('/onboarding');
  });
});
