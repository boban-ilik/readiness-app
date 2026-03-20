import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { SubscriptionProvider } from '@contexts/SubscriptionContext';
import { colors } from '@constants/theme';

// Nuclear splash-screen fallback — fires regardless of auth/onboarding state.
// Guards against any condition where hideAsync() is never called (e.g. Supabase
// hanging on cold launch in production). 8 seconds is generous enough to let
// normal auth resolve first, but short enough that the user never stares at a
// black screen indefinitely.
function useSplashFallback() {
  useEffect(() => {
    const t = setTimeout(() => {
      console.warn('[SplashScreen] Nuclear fallback — forcing hideAsync after 8s');
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);
    return () => clearTimeout(t);
  }, []);
}

SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const segments = useSegments();
  const router   = useRouter();
  // Prevent navigating more than once per resolved auth state
  const hasNavigated = useRef(false);

  // Read onboarding flag once on mount
  useEffect(() => {
    console.log('[AuthGate] reading AsyncStorage onboarding key');
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v  => {
        console.log('[AuthGate] onboardingDone =', v);
        setOnboardingDone(v === 'true');
      })
      .catch((e) => {
        console.warn('[AuthGate] AsyncStorage error:', e);
        setOnboardingDone(false);
      });
  }, []);

  // Log every state change
  console.log('[AuthGate] render — isLoading:', isLoading, 'user:', !!user, 'onboardingDone:', onboardingDone, 'segments:', segments);

  // Hide splash as soon as we know where the user is going
  useEffect(() => {
    if (!isLoading && onboardingDone !== null) {
      console.log('[AuthGate] hiding splash screen');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, onboardingDone]);

  // ── Initial navigation — runs once when auth + onboarding are both known ──
  useEffect(() => {
    console.log('[AuthGate] nav effect — isLoading:', isLoading, 'onboardingDone:', onboardingDone, 'user:', !!user, 'hasNavigated:', hasNavigated.current);
    if (isLoading || onboardingDone === null) return;
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (!user) {
      console.log('[AuthGate] → replacing to /(auth)/login');
      router.replace('/(auth)/login');
    } else if (!onboardingDone) {
      console.log('[AuthGate] → replacing to /onboarding');
      router.replace('/onboarding');
    } else {
      console.log('[AuthGate] → replacing to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [isLoading, onboardingDone, user]);

  // ── Re-navigation guard for mid-session state changes ─────────────────────
  // Handles: login → tabs, logout → login, onboarding complete → tabs
  useEffect(() => {
    if (isLoading || onboardingDone === null) return;
    if (!segments.length) return; // router not settled yet, skip

    const inAuth       = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inIndex      = segments[0] === 'index' || segments[0] === '';

    // If we're still on the blank index screen after initial nav resolved,
    // do a corrective navigate (handles edge cases in router timing)
    if (inIndex) {
      if (!user) router.replace('/(auth)/login');
      else if (!onboardingDone) router.replace('/onboarding');
      else router.replace('/(tabs)');
      return;
    }

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuth) {
      router.replace(onboardingDone ? '/(tabs)' : '/onboarding');
      return;
    }

    if (user && !onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [user, isLoading, onboardingDone, segments]);

  // ── Refresh onboardingDone when leaving the onboarding screen ─────────────
  useEffect(() => {
    if (!segments.length || segments[0] === 'onboarding' || onboardingDone === true) return;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => { if (v === 'true') setOnboardingDone(true); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // Overlay spinner while auth resolves — Stack always renders underneath
  // so Expo Router can process routes and populate segments
  const showSpinner = isLoading || onboardingDone === null;

  return (
    <>
      {children}
      {showSpinner && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: colors.bg.primary,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <ActivityIndicator color={colors.amber[400]} />
        </View>
      )}
    </>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  useSplashFallback();
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
          <Stack.Screen name="index" />
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
