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
 *   $rc_monthly  │ monthly      │ Auto-renewable subscription ($9.99/mo)
 *   $rc_annual   │ yearly       │ Auto-renewable subscription ($69.99/yr, 14-day trial)
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
  useRef,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { CustomerInfo, PurchasesStatic } from 'react-native-purchases';
import { useAuth } from '@contexts/AuthContext';

// ─── RevenueCat API Key ────────────────────────────────────────────────────────
const REVENUECAT_API_KEY_IOS = 'appl_nHqlgLzhlUlmYeuMxNqThGAuPlJ';

// ─── Entitlement identifier (must match RevenueCat dashboard exactly) ─────────
const ENTITLEMENT_PRO = 'pro';

// ─── PAYWALL_RESULT string values (mirrors the RC enum) ──────────────────────
const PAYWALL_PURCHASED = 'PURCHASED';
const PAYWALL_RESTORED  = 'RESTORED';

/**
 * Whether to present RevenueCat's own paywall sheet instead of the in-app
 * /paywall screen.
 *
 * Currently OFF. RevenueCatUI.presentPaywall() requires a paywall to be
 * designed against the offering in the RevenueCat dashboard; the "default"
 * offering has none, so the sheet opens empty and shows RevenueCat's native
 * "Error 23: There is an issue with your configuration" alert. That alert is
 * rendered inside the sheet, so it appears before our own error handling can
 * fall back — the user just sees a broken paywall.
 *
 * The in-app /paywall screen loads the same offering and calls
 * Purchases.purchasePackage(), so purchases work identically.
 *
 * Flip this to true once a paywall is published in the RC dashboard.
 */
const USE_REVENUECAT_PAYWALL_UI = false;

// ─── Keys ─────────────────────────────────────────────────────────────────────
const DEV_OVERRIDE_KEY = '@readiness/dev_is_pro';

// ─── Calibration-week trial ───────────────────────────────────────────────────
// Every account's first 7 days are full Pro. The window is keyed off the
// Supabase auth user's created_at — server-side and immutable — so deleting
// and reinstalling the app cannot restart it. The paywall lands on day 7,
// which is also the day calibration completes and scores become personal:
// the product's best moment, not its least proven one.
const TRIAL_DAYS = 7;

function trialEndMs(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) ? t + TRIAL_DAYS * 86_400_000 : 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';

interface SubscriptionContextType {
  /** Whether the user has Pro access right now — paid, dev override, or calibration-week trial */
  isPro: boolean;
  /** True when Pro access comes from the calibration-week trial rather than a purchase */
  isTrialActive: boolean;
  /** Whole days of trial remaining (0 when expired or not applicable) */
  trialDaysLeft: number;
  /** Raw tier string — useful for analytics / display */
  tier: SubscriptionTier;
  /** True while reading/verifying subscription state */
  isLoading: boolean;
  /**
   * True once the RevenueCat customer identity matches the signed-in user.
   * Gates that render on isPro should wait for this: before identity sync the
   * SDK reports the anonymous customer, and a paying user briefly reads as
   * free — which is the paywall-flash bug.
   */
  identityReady: boolean;
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
  const [isPro,      setIsPro]      = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [rcReady,    setRcReady]    = useState(false);
  const [identityReady, setIdentityReady] = useState(false);

  // Supabase user id, or null when signed out. SubscriptionProvider is nested
  // inside AuthProvider in app/_layout.tsx, so this is always available.
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Calibration-week trial, derived rather than stored: created_at comes from
  // the auth server with the session, so there is nothing to sync or wipe.
  const trialEnd      = trialEndMs(user?.created_at);
  const isTrialActive = !!userId && Date.now() < trialEnd;
  const trialDaysLeft = isTrialActive
    ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86_400_000))
    : 0;

  // __DEV__-only Pro override. Held in a ref so every place that derives isPro
  // from RevenueCat can OR it in — otherwise a real "not subscribed" response
  // would immediately switch the dev toggle back off.
  const devProRef = useRef(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Dev override — reflect Pro immediately, but do NOT skip SDK setup.
      //    This used to return early, which left Purchases unconfigured for the
      //    whole session. The paywall calls Purchases.getOfferings() directly,
      //    so it then failed with "There is no singleton instance" and could
      //    never sell anything until the toggle was switched back off.
      if (__DEV__) {
        const devVal = await AsyncStorage.getItem(DEV_OVERRIDE_KEY).catch(() => null);
        devProRef.current = devVal === 'true';
        if (devProRef.current && !cancelled) setIsPro(true);
      }

      // 2. Only on iOS native builds — not Expo Go / web
      if (Platform.OS !== 'ios') {
        if (!cancelled) { setIsLoading(false); setIdentityReady(true); }
        return;
      }

      const Purchases = await getPurchases();
      if (!Purchases) {
        // Package not yet linked (Expo Go). Treat as free.
        if (!cancelled) { setIsLoading(false); setIdentityReady(true); }
        return;
      }

      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setIsPro(devProRef.current || !!info.entitlements.active[ENTITLEMENT_PRO]);
        }

        // Real-time updates: fires after purchase, restore, or subscription change
        Purchases.addCustomerInfoUpdateListener((updatedInfo: CustomerInfo) => {
          if (!cancelled) {
            setIsPro(devProRef.current || !!updatedInfo.entitlements.active[ENTITLEMENT_PRO]);
          }
        });

        if (!cancelled) setRcReady(true);
      } catch (e) {
        console.warn('[Subscription] RevenueCat init failed:', e);
        // rcReady never set, so the identity effect will not run — release the
        // gates rather than leaving them blank forever.
        if (!cancelled) setIdentityReady(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Identity ───────────────────────────────────────────────────────────────
  /**
   * Ties the RevenueCat customer to the signed-in Supabase user.
   *
   * Without this, RevenueCat identifies buyers by a per-install anonymous ID,
   * so a subscription belongs to the device rather than the account — someone
   * who subscribes and then signs in on a new phone would appear un-subscribed
   * until they tapped "Restore Purchases".
   *
   * Runs after configure() (rcReady) and re-runs whenever the user changes.
   */
  useEffect(() => {
    if (!rcReady) return;
    let cancelled = false;

    async function syncIdentity() {
      const Purchases = await getPurchases();
      if (!Purchases) return;

      try {
        if (userId) {
          const { customerInfo } = await Purchases.logIn(userId);
          if (!cancelled) {
            setIsPro(devProRef.current || !!customerInfo.entitlements.active[ENTITLEMENT_PRO]);
          }
        } else {
          // logOut() rejects when the current user is already anonymous —
          // that's an expected no-op, swallowed by the catch below.
          const customerInfo = await Purchases.logOut();
          if (!cancelled) {
            setIsPro(devProRef.current || !!customerInfo.entitlements.active[ENTITLEMENT_PRO]);
          }
        }
      } catch (e) {
        console.warn('[Subscription] RevenueCat identity sync failed (non-fatal):', e);
      } finally {
        if (!cancelled) setIdentityReady(true);
      }
    }

    syncIdentity();
    return () => { cancelled = true; };
  }, [rcReady, userId]);

  // ── Refresh entitlements ───────────────────────────────────────────────────
  const refreshEntitlements = useCallback(async () => {
    if (!rcReady) return;
    try {
      const Purchases = await getPurchases();
      if (!Purchases) return;
      const info = await Purchases.getCustomerInfo();
      setIsPro(devProRef.current || !!info.entitlements.active[ENTITLEMENT_PRO]);
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
    if (rcReady && USE_REVENUECAT_PAYWALL_UI) {
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
    devProRef.current = value;
    setIsPro(value);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        // Trial ORs in at the edge: the internal isPro state stays purely the
        // RevenueCat/dev entitlement, so an RC update can never clobber an
        // active trial and vice versa.
        isPro: isPro || isTrialActive,
        isTrialActive: isTrialActive && !isPro,
        trialDaysLeft,
        tier: isPro || isTrialActive ? 'pro' : 'free',
        isLoading,
        identityReady,
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
