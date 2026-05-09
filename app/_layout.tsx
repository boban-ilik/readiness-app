import { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { SubscriptionProvider } from '@contexts/SubscriptionContext';
import { colors } from '@constants/theme';

enableScreens(false);

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => setOnboardingDone(v === 'true'))
      .catch(() => setOnboardingDone(false));
  }, []);

  useEffect(() => {
    if (isLoading || onboardingDone === null) return;
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!onboardingDone) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, onboardingDone, user, router]);

  useEffect(() => {
    if (isLoading || onboardingDone === null) return;
    if (!segments.length) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inIndex = segments[0] === '';

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
  }, [user, isLoading, onboardingDone, segments, router]);

  useEffect(() => {
    if (!segments.length || segments[0] === 'onboarding' || onboardingDone === true) return;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => {
        if (v === 'true') setOnboardingDone(true);
      })
      .catch(() => {});
  }, [segments, onboardingDone]);

  const showSpinner = isLoading || onboardingDone === null;

  return (
    <>
      {children}
      {showSpinner && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator color={colors.amber[400]} />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <StatusBar style="light" />
        <AuthGate>
          <Slot />
        </AuthGate>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
