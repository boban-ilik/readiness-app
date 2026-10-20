/** Callback screens must finish processing before the auth gate redirects. */
export function getAuthRedirect(
  segments: readonly string[],
  signedIn: boolean,
  onboardingDone: boolean,
): '/(auth)/login' | '/onboarding' | '/(tabs)' | null {
  const root = segments[0];
  if (root === '(auth)' && segments[1] === 'callback') return null;
  if (!signedIn) return root === '(auth)' ? null : '/(auth)/login';
  if (root === 'strava-callback') return null;
  if (!onboardingDone) return root === 'onboarding' ? null : '/onboarding';
  if (!root || root === '(auth)' || root === 'onboarding') return '/(tabs)';
  return null;
}
