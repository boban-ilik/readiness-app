import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { SubscriptionProvider } from '@contexts/SubscriptionContext';
import { colors } from '@constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Global fatal error catcher ───────────────────────────────────────────────
// In production this shows an Alert with the error text so we can read it
// off the screen without needing Xcode connected.
const _prevHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  const msg = error?.message ?? '(no message)';
  const stack = (error?.stack ?? '').slice(0, 400);
  console.error('[READINESS FATAL]', isFatal ? 'FATAL' : 'non-fatal', msg);
  console.error('[READINESS STACK]', error?.stack);

  // Show an alert so we can read the crash reason without Xcode.
  // Remove this block once the production crash is identified and fixed.
  try {
    Alert.alert(
      isFatal ? '💥 Fatal Error' : '⚠️ Error',
      `${msg}\n\n${stack}`,
      [{ text: 'OK', onPress: () => _prevHandler?.(error, isFatal) }],
    );
  } catch {
    _prevHandler?.(error, isFatal);
  }
});

// ─── Global unhandled rejection handler ──────────────────────────────────────
// In dev mode React Native turns unhandled promise rejections into the red
// error overlay. Network errors (Supabase auth refresh, fetch timeouts) are
// transient and non-fatal — demote them to console.warn so the overlay doesn't
// interrupt the UX during development.
if (__DEV__) {
  const _prev = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: any) => {
    const msg: string = event?.reason?.message ?? String(event?.reason ?? '');
    const isNetworkNoise =
      msg.includes('Network request failed') ||
      msg.includes('AbortError') ||
      msg.includes('The network connection was lost') ||
      msg.includes('Failed to fetch');
    if (isNetworkNoise) {
      console.warn('[Network] Non-fatal rejection suppressed:', msg);
      event?.preventDefault?.();
      return;
    }
    _prev?.(event);
  };
}

const ONBOARDING_KEY = '@readiness/onboarding_complete';

// ─── Auth + Onboarding Gate ───────────────────────────────────────────────────
// Watches auth state AND onboarding completion, then redirects to the
// right destination. Lives inside AuthProvider so it can call useAuth.

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  // null = not yet read from AsyncStorage; boolean = known
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const segments = useSegments();
  const router   = useRouter();

  // Read onboarding status once on mount — fast local read
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v  => setOnboardingDone(v === 'true'))
      .catch(() => setOnboardingDone(false));
  }, []);

  useEffect(() => {
    // Wait until both auth and onboarding state are resolved
    if (isLoading || onboardingDone === null) return;

    // useSegments() briefly returns [] during navigation transitions in Expo
    // Router. Bail out until the router has settled on a real segment — this
    // prevents a spurious router.replace('/onboarding') that would remount
    // the screen and reset step back to 0.
    if (!segments.length) return;

    SplashScreen.hideAsync();

    const inAuth       = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      // Not signed in → send to login
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // User is authenticated ─────────────────────────────────────────────────
    if (inAuth) {
      // Just finished auth flow → decide where to land
      router.replace(onboardingDone ? '/(tabs)' : '/onboarding');
      return;
    }

    if (!onboardingDone && !inOnboarding) {
      // User exists but hasn't completed onboarding (e.g. cold start after
      // sign-up without finishing, or a fresh install with a persisted session)
      router.replace('/onboarding');
      return;
    }

    if (onboardingDone && inOnboarding) {
      // Onboarding is already done — shouldn't be here; send to tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, onboardingDone, segments]);

  // ── Fix 2: stale onboardingDone after StepSetup writes the flag ─────────────
  // When onboarding.tsx writes ONBOARDING_KEY then calls router.replace('/(tabs)'),
  // the AuthGate's onboardingDone state is still false (only read on mount).
  // As segments changes to ['(tabs)'], the routing effect above sees
  // !onboardingDone && !inOnboarding → true and bounces the user back to
  // onboarding. We fix this by re-reading AsyncStorage whenever segments
  // transitions away from 'onboarding'.
  useEffect(() => {
    if (!segments.length) return;
    if (segments[0] === 'onboarding') return; // still inside onboarding
    if (onboardingDone === true) return;       // already up to date — nothing to do

    // Just left the onboarding screen; pick up any completion flag written
    // by StepSetup before it called router.replace('/(tabs)').
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => { if (v === 'true') setOnboardingDone(true); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // Blank spinner while resolving auth + onboarding — prevents any flash
  if (isLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.amber[400]} />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
      <StatusBar style="light" />
      <AuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.primary },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* gestureEnabled:false prevents swipe-back mid-onboarding */}
          <Stack.Screen
            name="onboarding"
            options={{ gestureEnabled: false, animation: 'fade' }}
          />
          {/* Paywall — slides up from bottom like a native sheet */}
          <Stack.Screen
            name="paywall"
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
