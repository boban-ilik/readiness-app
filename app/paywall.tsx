/**
 * Paywall screen — Readiness Pro upgrade  [FALLBACK ONLY]
 *
 * ⚠️  In production this screen is only reached when RevenueCatUI fails to
 *     present the native paywall (e.g. Expo Go, pre-pod-install builds).
 *     The primary purchase flow is RevenueCatUI.presentPaywall() in
 *     SubscriptionContext, which renders the paywall configured in the RC
 *     dashboard — no code change needed when you update pricing or copy.
 *
 * ── RevenueCat entitlement: "pro" ───────────────────────────────────────────
 * Expected packages in the "default" Offering:
 *   $rc_monthly → monthly   ($9.99/mo)
 *   $rc_annual  → yearly    ($69.99/yr, 14-day free trial)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@contexts/SubscriptionContext';
import { track } from '@services/analytics';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual';

interface DisplayPackage {
  cycle:       BillingCycle;
  priceLabel:  string;   // e.g. "$69.99 / year"
  perMonth:    string;   // e.g. "$5.83"
  total?:      string;   // e.g. "billed annually"
  badge?:      string;   // optional pill label, e.g. "SAVE 40%"
  rcPackage:   unknown;  // PurchasesPackage | null (null = mock)
}

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES: Array<{
  icon:  React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body:  string;
}> = [
  {
    icon:  'chatbubbles-outline',
    title: 'Daily Briefing & Coach',
    body:  'A morning briefing written from your own numbers, and a coach you can ask why.',
  },
  {
    icon:  'trending-up',
    title: '28-Day History & Forecast',
    body:  'Four weeks of trend, correlations, nutrition guidance and a 3-day readiness forecast.',
  },
  {
    icon:  'notifications-outline',
    title: 'Smart Alerts',
    body:  'Morning digest with your score preview and alerts when you dip below your target.',
  },
  {
    icon:  'bar-chart-outline',
    title: 'Export & Insights',
    body:  'CSV export, pattern correlations, and a shareable weekly summary card.',
  },
];

// ─── Legal links ──────────────────────────────────────────────────────────────
// App Review guideline 3.1.2 requires a screen selling an auto-renewable
// subscription to link to both a privacy policy and terms of use. These must
// resolve — dead links are a routine rejection.
// Served by GitHub Pages from the repo root on main. Switch to
// https://thereadiness.app/privacy once that domain is hosting the policy —
// this link must resolve, so don't point it at a domain before it's live.
const PRIVACY_URL = 'https://thereadiness.app/privacy/';
// Apple's standard EULA, which apps may use in place of bespoke terms.
const TERMS_URL   = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// ─── Fallback pricing (shown when RevenueCat packages haven't loaded) ─────────

const MOCK_PACKAGES: Record<BillingCycle, DisplayPackage> = {
  annual: {
    cycle:      'annual',
    priceLabel: '$69.99 / year',
    perMonth:   '$5.83',
    total:      'billed annually',
    badge:      '-42%',
    rcPackage:  null,
  },
  monthly: {
    cycle:      'monthly',
    priceLabel: '$9.99 / month',
    perMonth:   '$9.99',
    rcPackage:  null,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureRow({
  icon,
  title,
  body,
  isFirst,
}: {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  title:   string;
  body:    string;
  isFirst?: boolean;
}) {
  return (
    <View style={[styles.featureRow, isFirst && styles.featureRowFirst]}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={22} color={colors.amber[400]} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly:  'Monthly',
  annual:   'Annual',
};

function BillingToggle({
  selected,
  packages,
  onSelect,
}: {
  selected:  BillingCycle;
  packages:  Record<BillingCycle, DisplayPackage>;
  onSelect:  (c: BillingCycle) => void;
}) {
  return (
    <View style={styles.toggleWrap}>
      {(['monthly', 'annual'] as BillingCycle[]).map(cycle => {
        const badge = packages[cycle].badge;
        return (
          <TouchableOpacity
            key={cycle}
            style={[styles.toggleBtn, selected === cycle && styles.toggleBtnActive]}
            onPress={() => onSelect(cycle)}
            activeOpacity={0.75}
          >
            <Text style={[styles.toggleLabel, selected === cycle && styles.toggleLabelActive]}>
              {CYCLE_LABELS[cycle]}
            </Text>
            {badge && (
              <View style={[styles.saveBadge, selected !== cycle && styles.saveBadgeInactive]}>
                <Text style={[styles.saveBadgeText, selected !== cycle && styles.saveBadgeTextInactive]}>
                  {badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const router                        = useRouter();
  const { debugSetPro, refreshEntitlements } = useSubscription();

  const [cycle,    setCycle]    = useState<BillingCycle>('annual');
  const [busy,     setBusy]     = useState(false);
  const [packages, setPackages] = useState<Record<BillingCycle, DisplayPackage>>(MOCK_PACKAGES);
  // Prices, the trial badge and the CTA render only once live StoreKit
  // products are in hand. Showing the hard-coded USD fallback (and a "14-day
  // free trial" claim) while the store is unreachable is a 3.1.2 rejection
  // waiting to happen and misprices every non-US storefront.
  const [offerings, setOfferings] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const rcLoaded = offerings === 'ready';

  // ── Load live packages from RevenueCat ──────────────────────────────────────
  const loadPackages = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setOfferings('unavailable');
      return;
    }
    setOfferings('loading');
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = (require('react-native-purchases') as { default: import('react-native-purchases').PurchasesStatic }).default;
        const offerings = await Purchases.getOfferings();
        const current   = offerings.current;
        if (!current) {
          console.warn(
            '[Paywall] RevenueCat returned no current offering. ' +
            `all=${JSON.stringify(Object.keys(offerings.all ?? {}))}`,
          );
          setOfferings('unavailable');
          return;
        }

        if (current.availablePackages.length === 0) {
          console.warn(
            `[Paywall] Offering "${current.identifier}" has no available packages — ` +
            'App Store is not serving products for these identifiers.',
          );
        }

        const updated: Record<BillingCycle, DisplayPackage> = { ...MOCK_PACKAGES };

        // RevenueCat can return packages whose StoreKit product failed to
        // resolve, leaving product fields undefined. Log the real shape so a
        // mismatch is diagnosable rather than guesswork.
        console.log(
          '[Paywall] offering packages:',
          JSON.stringify(
            current.availablePackages.map(p => ({
              id:      p.identifier,
              type:    p.packageType,
              product: p.product?.productIdentifier ?? null,
              price:   p.product?.priceString ?? null,
            })),
          ),
        );

        for (const pkg of current.availablePackages) {
          // Every access here is guarded. Reading .includes() on an undefined
          // productIdentifier previously threw and aborted the whole load, so
          // one hollow package silently downgraded the paywall to fallback
          // prices and made purchases impossible.
          const productId = pkg.product?.productIdentifier ?? '';
          const price     = pkg.product?.priceString ?? '';
          const pkgId     = pkg.identifier ?? '';

          const isAnnual   = pkg.packageType === 'ANNUAL'  || pkgId === '$rc_annual'
                          || productId === 'yearly'  || productId.includes('annual') || productId.includes('yearly');
          const isMonthly  = pkg.packageType === 'MONTHLY' || pkgId === '$rc_monthly'
                          || productId === 'monthly' || productId.includes('monthly');

          if (isAnnual) {
            const monthly = pkg.product?.price
              ? `$${(pkg.product.price / 12).toFixed(2)}`
              : MOCK_PACKAGES.annual.perMonth;
            updated.annual = {
              cycle:      'annual',
              priceLabel: `${price} / year`,
              perMonth:   monthly,
              total:      'billed annually',
              badge:      '-42%',
              rcPackage:  pkg,
            };
          } else if (isMonthly) {
            updated.monthly = {
              cycle:      'monthly',
              priceLabel: `${price} / month`,
              perMonth:   price,
              rcPackage:  pkg,
            };
          }
        }

        setPackages(updated);
        // A package whose StoreKit product failed to resolve carries no price;
        // treat "no sellable package" the same as "store unreachable".
        const sellable = !!updated.annual.rcPackage || !!updated.monthly.rcPackage;
        setOfferings(sellable ? 'ready' : 'unavailable');
      } catch (e: any) {
        // Expected in Expo Go, where the native module isn't linked. Anywhere
        // else this is the reason the paywall can't sell anything, so don't
        // swallow it silently.
        console.warn(
          '[Paywall] Could not load RevenueCat offerings. ' +
          `code=${e?.code ?? 'n/a'} message=${e?.message ?? String(e)}`,
        );
        // Dev builds without RevenueCat keep the mock prices so the mock
        // purchase path stays exercisable.
        setOfferings(__DEV__ ? 'ready' : 'unavailable');
      }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);
  useEffect(() => { track('paywall_shown'); }, []);

  const selectedPkg = packages[cycle];

  // How much annual saves versus paying monthly for a year. Derived from the
  // live prices when RevenueCat has loaded, so it can't drift from what the
  // App Store actually charges; falls back to the offering's badge otherwise.
  const annualSaving = (() => {
    const m = packages.monthly.rcPackage as { product?: { price?: number } } | null;
    const a = packages.annual.rcPackage  as { product?: { price?: number } } | null;
    const monthlyPrice = m?.product?.price;
    const annualPrice  = a?.product?.price;

    if (monthlyPrice && annualPrice) {
      const yearOfMonthly = monthlyPrice * 12;
      if (annualPrice >= yearOfMonthly) return null;  // no saving to claim
      return `${Math.round((1 - annualPrice / yearOfMonthly) * 100)}%`;
    }
    return packages.annual.badge?.replace('-', '') ?? null;
  })();

  // ── Purchase handler ────────────────────────────────────────────────────────
  async function handleSubscribe() {
    if (busy) return;
    setBusy(true);

    try {
      if (rcLoaded && selectedPkg.rcPackage) {
        // ── Real purchase via RevenueCat ──────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = (require('react-native-purchases') as { default: import('react-native-purchases').PurchasesStatic }).default;

        const { customerInfo } = await Purchases.purchasePackage(
          selectedPkg.rcPackage as Parameters<typeof Purchases.purchasePackage>[0],
        );

        if (customerInfo.entitlements.active['pro']) {
          track('purchase_success', { cycle });
          await refreshEntitlements();
          router.back();
        } else {
          Alert.alert('Purchase Issue', 'Payment completed but Pro entitlement was not activated. Please restore purchases or contact support.');
        }
      } else if (__DEV__) {
        // ── Mock purchase (dev / Expo Go) ─────────────────────────────────────
        await new Promise<void>(r => setTimeout(r, 1000));
        await debugSetPro(true);
        router.back();
      } else {
        // No RevenueCat package — StoreKit returned no products. Most often the
        // Paid Applications Agreement isn't active yet, but it can also be a
        // transient App Store outage. Never close silently: a subscribe button
        // that appears to do nothing reads as a broken app (and is an App
        // Review guideline 2.1 risk).
        Alert.alert(
          'Purchases unavailable',
          'We couldn\'t reach the App Store just now. Please try again shortly.',
        );
      }
    } catch (e: any) {
      // User cancelled (errorCode 1) — don't show an alert
      if (e?.code !== '1' && e?.userCancelled !== true) {
        Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  // ── Restore purchases ───────────────────────────────────────────────────────
  async function handleRestore() {
    if (busy) return;
    setBusy(true);
    try {
      // Restore does not need offerings, only a configured SDK. Gating it on
      // the price load refused exactly the subscriber on a new phone during
      // a StoreKit hiccup, and App Review tests Restore on a fresh install.
      let configured = false;
      let Purchases: import('react-native-purchases').PurchasesStatic | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Purchases  = (require('react-native-purchases') as { default: import('react-native-purchases').PurchasesStatic }).default;
        configured = await Purchases.isConfigured();
      } catch {
        configured = false;
      }

      if (configured && Purchases) {
        const info = await Purchases.restorePurchases();
        if (info.entitlements.active['pro']) {
          track('restore_success');
          await refreshEntitlements();
          Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('No Previous Purchase', 'We couldn\'t find an active Pro subscription linked to your Apple ID.');
        }
      } else {
        // SDK not linked (Expo Go) or not configured — without this the button
        // would do nothing at all, and a silent no-op reads as a broken app.
        Alert.alert(
          'Restore unavailable',
          'We couldn\'t reach the App Store just now. Please try again shortly.',
        );
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Could not restore purchases.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Close button ── */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.crown}>♛</Text>
          <Text style={styles.heroTitle}>Readiness Pro</Text>
          <Text style={styles.heroSub}>
            Train smarter every day — guided by your body.
          </Text>
        </View>

        {/* ── Feature list ── */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} isFirst={i === 0} />
          ))}
        </View>

        {/* ── Prices unavailable: no fallback numbers, no trial claim ── */}
        {offerings === 'loading' && (
          <View style={styles.priceBlock}>
            <ActivityIndicator color={colors.amber[400]} />
            <Text style={styles.priceNote}>Loading prices from the App Store…</Text>
          </View>
        )}
        {offerings === 'unavailable' && (
          <View style={styles.priceBlock}>
            <Text style={styles.priceNote}>
              We couldn't load prices from the App Store. Check your connection and try again.
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, { marginTop: 16 }]}
              onPress={loadPackages}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {rcLoaded && (
          <>
            {/* ── Billing toggle ── */}
            <BillingToggle
              selected={cycle}
              packages={packages}
              onSelect={setCycle}
            />

            {/* ── Price display ── */}
            <View style={styles.priceBlock}>
              <Text style={styles.priceMain}>{selectedPkg.priceLabel}</Text>
              {cycle === 'annual' && (
                <Text style={styles.priceNote}>
                  Just {selectedPkg.perMonth}/mo — {selectedPkg.total}
                </Text>
              )}
            </View>

            {/* ── Trial badge (annual only — monthly has no introductory offer) ── */}
            {cycle === 'annual' && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeIcon}>🎁</Text>
                <Text style={styles.trialBadgeText}>14-day free trial included</Text>
              </View>
            )}

            {/* ── Annual advantage (shown on monthly, where the trial is invisible) ── */}
            {cycle === 'monthly' && (
              <TouchableOpacity
                style={styles.switchPrompt}
                onPress={() => setCycle('annual')}
                activeOpacity={0.8}
              >
                <Text style={styles.switchPromptText}>
                  Go annual for a <Text style={styles.switchPromptStrong}>14-day free trial</Text>
                  {annualSaving ? <> and save {annualSaving}</> : null}
                </Text>
              </TouchableOpacity>
            )}

            {/* ── CTA ── */}
            <TouchableOpacity
              style={[styles.ctaButton, busy && styles.ctaButtonBusy]}
              onPress={handleSubscribe}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy
                ? <ActivityIndicator color={colors.text.inverse} />
                : <Text style={styles.ctaText}>
                    {cycle === 'annual' ? 'Start Free Trial' : 'Subscribe Monthly'}
                  </Text>
              }
            </TouchableOpacity>

            <Text style={styles.ctaNote}>
              {cycle === 'annual'
                ? 'No charge for 14 days · Cancel anytime in App Store'
                : 'Billed monthly · Cancel anytime in App Store'}
            </Text>
          </>
        )}

        {/* ── Footer links ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={busy} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: spacing[5],
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  closeBtnText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  scroll: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[8],
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
    gap: spacing[2],
  },
  crown: {
    fontSize: 44,
    color: colors.amber[400],
    marginBottom: spacing[2],
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  heroSub: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
  },

  // ── Feature list ────────────────────────────────────────────────────────────
  featureList: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    marginBottom: spacing[5],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  featureRowFirst: {
    borderTopWidth: 0,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.amber[900] + '33',
    borderWidth: 1,
    borderColor: colors.amber[700] + '55',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: spacing[0.5],
  },
  featureTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  featureBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },

  // ── Billing toggle ──────────────────────────────────────────────────────────
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    marginBottom: spacing[4],
    height: 52,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: 4,
    gap: 3,
  },
  toggleBtnActive: {
    backgroundColor: colors.amber[400],
  },
  toggleLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  toggleLabelActive: {
    color: colors.text.inverse,
  },
  saveBadge: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  saveBadgeInactive: {
    backgroundColor: colors.amber[400] + '22',
    borderWidth: 1,
    borderColor: colors.amber[500] + '55',
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  saveBadgeTextInactive: {
    color: colors.amber[400],
  },

  // ── Price display ────────────────────────────────────────────────────────────
  priceBlock: {
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[1],
  },
  priceMain: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  priceNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },

  // ── Trial badge ──────────────────────────────────────────────────────────────
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.amber[900] + '44',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.amber[700],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    alignSelf: 'center',
    marginBottom: spacing[5],
  },
  trialBadgeIcon: {
    fontSize: 14,
  },
  trialBadgeText: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // ── Annual advantage prompt (monthly only) ──────────────────────────────────
  switchPrompt: {
    alignSelf: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.secondary,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  switchPromptText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  switchPromptStrong: {
    color: colors.amber[400],
    fontWeight: fontWeight.semiBold,
  },

  // ── CTA ─────────────────────────────────────────────────────────────────────
  ctaButton: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: spacing[3],
  },
  ctaButtonBusy: {
    opacity: 0.75,
  },
  ctaText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  ctaNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing[6],
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  footerLink: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  footerDot: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
});
