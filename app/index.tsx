/**
 * Root index — resolves auth + onboarding state, then redirects.
 *
 * Uses <Redirect> instead of router.replace() so Expo Router fully unmounts
 * this screen before rendering the destination — eliminates any overlay issue
 * where the index View sits on top of the destination screen.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@contexts/AuthContext';

const ONBOARDING_KEY = '@readiness/onboarding_complete';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Read onboarding flag once on mount
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => {
        console.log('[Index] onboardingDone =', v);
        setOnboardingDone(v === 'true');
      })
      .catch(() => {
        console.warn('[Index] AsyncStorage read failed — defaulting to false');
        setOnboardingDone(false);
      });
  }, []);

  // NOTE: SplashScreen.hideAsync() is intentionally NOT called here.
  // It is owned by SplashHider in app/_layout.tsx, which calls it exactly once
  // via a module-level singleton guard. Calling it here (a route component that
  // may re-mount during an iOS 26 navigation reset) would trigger a second
  // hideAsync() call → another reset → infinite redirect loop.

  console.log('[Index] render — isLoading:', isLoading, 'onboardingDone:', onboardingDone, 'user:', !!user);

  // Still resolving — show a transparent loading view so nothing covers the destination
  if (isLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }} />
    );
  }

  // Redirect renders null and lets Expo Router fully unmount this screen
  if (!user) {
    console.log('[Index] → /(auth)/login');
    return <Redirect href="/(auth)/login" />;
  }
  if (!onboardingDone) {
    console.log('[Index] → /onboarding');
    return <Redirect href="/onboarding" />;
  }
  console.log('[Index] → /(tabs)');
  return <Redirect href="/(tabs)" />;
}
