import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { SubscriptionProvider } from '@contexts/SubscriptionContext';
import { colors } from '@constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Global unhandled rejection handler ──────────────────────────────────────
// Demote transient network errors from the red overlay in dev builds so they
// don't interrupt the UX during development.
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

// ─── Splash Screen Singleton ──────────────────────────────────────────────────
// Module-level flag: ensures SplashScreen.hideAsync() is called AT MOST ONCE
// per JS runtime, no matter how many times this component tree re-mounts.
//
// Root cause of the iOS 26 black screen / login-redirect loop:
//   On iOS 26 beta, calling hideAsync() triggers an async native side-effect
//   that resets the expo-router navigation tree ~3-5 s later. If hideAsync()
//   is called a second time (because the reset causes re-mounting and another
//   component calls it again), the cycle compounds indefinitely.
//
// Fix: SplashHider lives inside AuthProvider so it can wait for auth to resolve
// before hiding the splash. The module-level flag ensures that even if
// SplashHider remounts (due to the first iOS 26 reset), it never calls
// hideAsync() again — breaking the cascade.
let _splashHiddenOnce = false;

function SplashHider() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;           // wait until auth has resolved
    if (_splashHiddenOnce) return;   // already called once — don't repeat
    _splashHiddenOnce = true;
    console.log('[SplashScreen] Auth resolved — hiding splash');
    SplashScreen.hideAsync().catch(e =>
      console.warn('[SplashScreen] hideAsync failed:', e),
    );
  }, [isLoading]);

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
// Intentionally minimal — navigation decisions live in app/index.tsx.
// SplashHider (above) owns SplashScreen.hideAsync() so it is always called
// exactly once, from the layout level, before any route-level navigation.

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SplashHider />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.primary },
            animation: 'none',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* gestureEnabled:false prevents swipe-back mid-onboarding */}
          <Stack.Screen
            name="onboarding"
            options={{ gestureEnabled: false, animation: 'none' }}
          />
          {/* Paywall — slides up from bottom like a native sheet */}
          <Stack.Screen
            name="paywall"
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
