/**
 * SubscriptionContext
 *
 * Single source of truth for the user's subscription tier.
 *
 * ── Configuration ───────────────────────────────────────────────────────────
 * RevenueCat iOS key is set below (REVENUECAT_API_KEY_IOS).
 * Retrieve it from: RevenueCat dashboard → Project → API Keys → Public (iOS)
 *
 * ── Products expected in RevenueCat "default" Offering ──────────────────────
 *   Package ID   │ Product ID   │ Type
 *   $rc_monthly  │ monthly      │ Auto-renewable subscription ($6.99/mo)
 *   $rc_annual   │ yearly       │ Auto-renewable subscription ($49.99/yr, 7-day trial)
 *   lifetime     │ lifetime     │ Non-consumable one-time purchase
 *
 * ── Entitlement ─────────────────────────────────────────────────────────────
 *   Identifier: "pro"  — attach all three products to this entitlement.
 *
 * ── RevenueCatUI ────────────────────────────────────────────────────────────
 *   presentPaywall()      → native paywall sheet (configured in RC dashboard)
 *   presentCustomerCenter → native subscription management UI
 *
 * ── Dev override ────────────────────────────────────────────────────────────
 *   Call `debugSetPro(true/false)` from a hidden shake-menu or dev settings.
 *   Bypasses RevenueCat and writes directly to AsyncStorage.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import type { CustomerInfo, PurchasesStatic } from 'react-native-purchases';

// ─── RevenueCat API Key ────────────────────────────────────────────────────────
const REVENUECAT_API_KEY_IOS = 'appl_nHqlgLzhlUlmYeuMxNqThGAuPlJ';

// ─── Entitlement identifier (must match RevenueCat dashboard exactly) ─────────
const ENTITLEMENT_PRO = 'pro';

// ─── PAYWALL_RESULT string values (mirrors the RC enum) ──────────────────────
const PAYWALL_PURCHASED = 'PURCHASED';
const PAYWALL_RESTORED  = 'RESTORED';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const DEV_OVERRIDE_KEY = '@readiness/dev_is_pro';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';

interface SubscriptionContextType {
  /** Whether the user has an active Pro entitlement */
  isPro: boolean;
  /** Raw tier string — useful for analytics / display */
  tier: SubscriptionTier;
  /** True while reading/verifying subscription state */
  isLoading: boolean;
  /**
   * Present the RevenueCat paywall sheet (configured in RC dashboard).
   * Falls back to the in-app /paywall route in Expo Go / when RC is not linked.
   * Automatically refreshes entitlements after a successful purchase or restore.
   */
  presentPaywall: () => Promise<void>;
  /**
   * Present the RevenueCat Customer Center — lets Pro users manage, cancel,
   * or request a refund for their subscription without leaving the app.
   * Falls back to the App Store subscriptions page if RC is not linked.
   */
  presentCustomerCenter: () => Promise<void>;
  /**
   * DEV ONLY — Toggle Pro without a real purchase.
   * Only functional in __DEV__ builds.
   */
  debugSetPro: (value: boolean) => Promise<void>;
  /** Force-refresh entitlement state from RevenueCat */
  refreshEntitlements: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

// ─── Lazy native module helpers ───────────────────────────────────────────────

/**
 * Returns the NativeModules object at call-time (safe to call any time after bridge init).
 */
function getNativeModules(): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('react-native') as { NativeModules: Record<string, unknown> }).NativeModules;
}

/**
 * Lazily require react-native-purchases.
 * Guards on NativeModules.RNPurchases first to avoid the module-level
 * `new NativeEventEmitter(null)` crash that happens when the pod is not yet
 * linked (native bare build, no Expo Go) and RC's own null-check is missing.
 */
async function getPurchases(): Promise<PurchasesStatic | null> {
  try {
    if (!getNativeModules().RNPurchases) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('react-native-purchases') as { default: PurchasesStatic }).default;
  } catch {
    return null;
  }
}

/**
 * Lazily require react-native-purchases-ui (RevenueCatUI).
 * Guards on both RNPaywalls and RNCustomerCenter before requiring so the
 * module-level NativeEventEmitter constructor never runs with a null argument.
 */
async function getRevenueCatUI(): Promise<{ default: { presentPaywall: (p: object) => Promise<string>; presentCustomerCenter: () => Promise<void>; } } | null> {
  try {
    const nm = getNativeModules();
    if (!nm.RNPaywalls || !nm.RNCustomerCenter) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases-ui') as { default: { presentPaywall: (p: object) => Promise<string>; presentCustomerCenter: () => Promise<void>; } };
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const router                           = useRouter();
  const [isPro,      setIsPro]      = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [rcReady,    setRcReady]    = useState(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Check dev override first (instant, no network)
      if (__DEV__) {
        const devVal = await AsyncStorage.getItem(DEV_OVERRIDE_KEY).catch(() => null);
        if (devVal === 'true') {
          if (!cancelled) { setIsPro(true); setIsLoading(false); }
          return;
        }
      }

      // 2. Only on iOS native builds — not Expo Go / web
      if (Platform.OS !== 'ios') {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const Purchases = await getPurchases();
      if (!Purchases) {
        // Package not yet linked (Expo Go). Treat as free.
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setIsPro(!!info.entitlements.active[ENTITLEMENT_PRO]);

        // Real-time updates: fires after purchase, restore, or subscription change
        Purchases.addCustomerInfoUpdateListener((updatedInfo: CustomerInfo) => {
          if (!cancelled) setIsPro(!!updatedInfo.entitlements.active[ENTITLEMENT_PRO]);
        });

        if (!cancelled) setRcReady(true);
      } catch (e) {
        console.warn('[Subscription] RevenueCat init failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Refresh entitlements ───────────────────────────────────────────────────
  const refreshEntitlements = useCallback(async () => {
    if (!rcReady) return;
    try {
      const Purchases = await getPurchases();
      if (!Purchases) return;
      const info = await Purchases.getCustomerInfo();
      setIsPro(!!info.entitlements.active[ENTITLEMENT_PRO]);
    } catch (e) {
      console.warn('[Subscription] refreshEntitlements failed:', e);
    }
  }, [rcReady]);

  // ── presentPaywall ─────────────────────────────────────────────────────────
  /**
   * 1. If RevenueCatUI is linked → present the native hosted paywall sheet
   *    (designed in RC dashboard — no code change needed to update it).
   *    After PURCHASED or RESTORED, refresh entitlements automatically.
   * 2. If not linked (Expo Go / before pod install) → push to /paywall.
   */
  const presentPaywall = useCallback(async () => {
    if (rcReady) {
      try {
        const RCUI = await getRevenueCatUI();
        if (RCUI) {
          const result = await RCUI.default.presentPaywall({ displayCloseButton: true });
          if (result === PAYWALL_PURCHASED || result === PAYWALL_RESTORED) {
            await refreshEntitlements();
          }
          return;
        }
      } catch (e) {
        // RC UI not linked or failed — fall through to custom screen
        console.warn('[Subscription] RevenueCatUI.presentPaywall failed:', e);
      }
    }
    // Fallback: custom paywall (Expo Go / dev / pre-pod-install)
    router.push('/paywall');
  }, [rcReady, refreshEntitlements, router]);

  // ── presentCustomerCenter ──────────────────────────────────────────────────
  /**
   * Native Customer Center sheet: lets Pro users cancel, get refunds, or
   * contact support — required by App Store Review Guideline 3.1.2.
   * Falls back to the App Store subscriptions URL if RC is not linked.
   */
  const presentCustomerCenter = useCallback(async () => {
    if (rcReady) {
      try {
        const RCUI = await getRevenueCatUI();
        if (RCUI) {
          await RCUI.default.presentCustomerCenter();
          // Refresh in case user cancelled or restored during the session
          await refreshEntitlements();
          return;
        }
      } catch (e) {
        console.warn('[Subscription] RevenueCatUI.presentCustomerCenter failed:', e);
      }
    }
    // Fallback: Apple subscriptions page
    const { Linking } = require('react-native') as { Linking: import('react-native').LinkingStatic };
    Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {});
  }, [rcReady, refreshEntitlements]);

  // ── DEV ONLY: debug toggle ─────────────────────────────────────────────────
  const debugSetPro = useCallback(async (value: boolean) => {
    if (!__DEV__) return;
    await AsyncStorage.setItem(DEV_OVERRIDE_KEY, value ? 'true' : 'false');
    setIsPro(value);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        tier: isPro ? 'pro' : 'free',
        isLoading,
        presentPaywall,
        presentCustomerCenter,
        debugSetPro,
        refreshEntitlements,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}

// ─── Legacy export (keeps any existing imports working) ───────────────────────
export const SUBSCRIPTION_KEY = DEV_OVERRIDE_KEY;
