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
import { fetchFounderRemaining } from '@services/founder';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  radius,
  surface,
  typography,
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

// ─── Founder (lifetime) ───────────────────────────────────────────────────────
// A one-time purchase that unlocks the same "pro" entitlement forever, capped
// at the first 200 buyers. The cap itself is enforced by removing the product
// from sale in App Store Connect; the remaining count here is display only.
const FOUNDER_CAP = 200;

type RcPackageLike = {
  identifier?:  string;
  packageType?: string;
  product?:     { identifier?: string; priceString?: string };
};

function isFounderPackage(pkg: RcPackageLike): boolean {
  const productId = (pkg.product?.identifier ?? '').toLowerCase();
  return pkg.packageType === 'LIFETIME'
      || pkg.identifier === '$rc_lifetime'
      || productId.includes('lifetime')
      || productId.includes('founder');
}

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
  isLast,
}: {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  title:   string;
  body:    string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.featureRow, !isLast && styles.featureDivider]}>
      <Ionicons name={icon} size={22} color={colors.amber[400]} style={styles.featureIcon} />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

/** "$69.99" from "$69.99 / year". */
function priceOnly(label: string): string {
  return label.split(' / ')[0];
}

/**
 * One plan as a card: a radio for the subscriptions (selected = the CTA buys
 * it), a plain button for the Founder lifetime purchase.
 */
function PlanCard({
  title,
  sub,
  price,
  unit,
  selected,
  badge,
  onPress,
  disabled,
}: {
  title:     string;
  sub:       string;
  price:     string;
  unit:      string;
  selected?: boolean;
  badge?:    string;
  onPress:   () => void;
  disabled?: boolean;
}) {
  const radio = selected !== undefined;
  return (
    <TouchableOpacity
      style={[styles.plan, selected && styles.planSelected]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole={radio ? 'radio' : 'button'}
      accessibilityState={radio ? { selected } : undefined}
      accessibilityLabel={`${title}, ${price} ${unit}. ${sub}`}
    >
      {!!badge && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{badge}</Text>
        </View>
      )}
      {radio && (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      )}
      <View style={styles.planText}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planSub}>{sub}</Text>
      </View>
      <Text style={styles.planPrice}>
        {price}
        <Text style={styles.planUnit}> {unit}</Text>
      </Text>
    </TouchableOpacity>
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
  // Founder package from the current offering (null = not offered) and the
  // places left (null = count unknown).
  const [founderPkg,       setFounderPkg]       = useState<unknown>(null);
  const [founderRemaining, setFounderRemaining] = useState<number | null>(null);

  // ── Load live packages from RevenueCat ──────────────────────────────────────
  const loadPackages = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setOfferings('unavailable');
      return;
    }
    setOfferings('loading');
    setFounderPkg(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = (require('react-native-purchases') as { default: (typeof import('react-native-purchases'))['default'] }).default;
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
        let founder: unknown = null;

        // RevenueCat can return packages whose StoreKit product failed to
        // resolve, leaving product fields undefined. Log the real shape so a
        // mismatch is diagnosable rather than guesswork.
        console.log(
          '[Paywall] offering packages:',
          JSON.stringify(
            current.availablePackages.map(p => ({
              id:      p.identifier,
              type:    p.packageType,
              product: p.product?.identifier ?? null,
              price:   p.product?.priceString ?? null,
            })),
          ),
        );

        for (const pkg of current.availablePackages) {
          // Every access here is guarded. Reading .includes() on an undefined
          // product id previously threw and aborted the whole load, so
          // one hollow package silently downgraded the paywall to fallback
          // prices and made purchases impossible.
          const productId = pkg.product?.identifier ?? '';
          const price     = pkg.product?.priceString ?? '';
          const pkgId     = pkg.identifier ?? '';

          if (isFounderPackage(pkg)) {
            // Only offer it when StoreKit resolved a price to show.
            if (price) founder = pkg;
            continue;
          }

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
        setFounderPkg(founder);
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
  useEffect(() => {
    let cancelled = false;
    fetchFounderRemaining().then(n => { if (!cancelled) setFounderRemaining(n); });
    return () => { cancelled = true; };
  }, []);

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
        const Purchases = (require('react-native-purchases') as { default: (typeof import('react-native-purchases'))['default'] }).default;

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

  // ── Founder (lifetime) purchase ─────────────────────────────────────────────
  async function handleFounder() {
    if (busy || !founderPkg) return;
    setBusy(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = (require('react-native-purchases') as { default: (typeof import('react-native-purchases'))['default'] }).default;

      const { customerInfo } = await Purchases.purchasePackage(
        founderPkg as Parameters<typeof Purchases.purchasePackage>[0],
      );

      if (customerInfo.entitlements.active['pro']) {
        track('purchase_success', { cycle: 'lifetime' });
        await refreshEntitlements();
        router.back();
      } else {
        Alert.alert('Purchase Issue', 'Payment completed but Pro entitlement was not activated. Please restore purchases or contact support.');
      }
    } catch (e: any) {
      // User cancelled (errorCode 1): don't show an alert
      if (e?.code !== '1' && e?.userCancelled !== true) {
        Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const showFounder = !!founderPkg && founderRemaining !== 0;
  const founderPrice = (founderPkg as RcPackageLike | null)?.product?.priceString ?? '';

  // ── Restore purchases ───────────────────────────────────────────────────────
  async function handleRestore() {
    if (busy) return;
    setBusy(true);
    try {
      // Restore does not need offerings, only a configured SDK. Gating it on
      // the price load refused exactly the subscriber on a new phone during
      // a StoreKit hiccup, and App Review tests Restore on a fresh install.
      let configured = false;
      let Purchases: (typeof import('react-native-purchases'))['default'] | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Purchases  = (require('react-native-purchases') as { default: (typeof import('react-native-purchases'))['default'] }).default;
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Close ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Readiness Pro</Text>
          <Text style={styles.heroTitle}>Know why the number moved, not just that it did.</Text>
          <Text style={styles.heroSub}>
            Pro adds the explanation layer: a morning briefing, a coach you can question, and four weeks of context behind every score.
          </Text>
        </View>

        {/* ── Feature list ── */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} isLast={i === FEATURES.length - 1} />
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
            {/* ── Plans ── */}
            <View style={styles.plans}>
              <Text style={styles.sectionLabel} accessibilityRole="header">Choose a plan</Text>
              <PlanCard
                title="Annual"
                sub={`${packages.annual.perMonth} a month, billed once a year${annualSaving ? `, save ${annualSaving}` : ''}`}
                price={priceOnly(packages.annual.priceLabel)}
                unit="/ yr"
                badge="14 days free"
                selected={cycle === 'annual'}
                onPress={() => setCycle('annual')}
              />
              <PlanCard
                title="Monthly"
                sub="Billed monthly, no trial"
                price={priceOnly(packages.monthly.priceLabel)}
                unit="/ mo"
                selected={cycle === 'monthly'}
                onPress={() => setCycle('monthly')}
              />
              {/* Founder (lifetime): tapping starts the App Store purchase. */}
              {showFounder && (
                <PlanCard
                  title="Founder, lifetime"
                  sub={founderRemaining == null
                    ? `Pro forever for the first ${FOUNDER_CAP} supporters.`
                    : `Pro forever for the first ${FOUNDER_CAP} supporters. ${founderRemaining} left.`}
                  price={founderPrice}
                  unit="once"
                  onPress={handleFounder}
                  disabled={busy}
                />
              )}
            </View>

            {/* ── CTA ── */}
            <View style={styles.ctaBlock}>
              <TouchableOpacity
                style={[styles.ctaButton, busy && styles.ctaButtonBusy]}
                onPress={handleSubscribe}
                disabled={busy}
                activeOpacity={0.85}
                accessibilityRole="button"
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
            </View>
          </>
        )}

        {/* ── Footer links ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={busy} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
            activeOpacity={0.7}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
            activeOpacity={0.7}
            accessibilityRole="link"
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
  scroll: {
    paddingHorizontal: spacing[5],
    paddingBottom:     spacing[6],
    gap:               spacing[7],
  },

  // ── Close ──
  topBar: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    paddingTop:     spacing[2],
    marginBottom:   -spacing[3],
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Hero ──
  hero: {
    gap: spacing[2.5],
  },
  eyebrow: {
    ...typography.label,
    color: colors.amber[400],
  },
  heroTitle: {
    fontFamily:    fontFamily.headingBold,
    fontSize:      30,
    lineHeight:    34,
    letterSpacing: -0.9,
    color:         colors.text.primary,
  },
  heroSub: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // ── Features ──
  featureList: {},
  featureRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             spacing[3.5],
    paddingVertical: spacing[3.5],
  },
  featureDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  featureIcon: {
    width:     28,
    textAlign: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    gap:  2,
  },
  featureTitle: {
    ...typography.title,
  },
  featureBody: {
    ...typography.caption,
  },

  // ── Loading / unavailable ──
  priceBlock: {
    alignItems: 'center',
    gap:        spacing[3],
    paddingVertical: spacing[4],
  },
  priceNote: {
    ...typography.caption,
    textAlign: 'center',
  },

  // ── Plans ──
  plans: {
    gap: spacing[2.5],
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing[1.5],
  },
  plan: {
    ...surface.card,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3.5],
    padding:       spacing[4],
  },
  planSelected: {
    borderColor: colors.amber[400],
    borderWidth: 1.5,
  },
  planBadge: {
    position:          'absolute',
    top:               -10,
    left:              spacing[4],
    backgroundColor:   colors.amber[400],
    borderRadius:      6,
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
  },
  planBadgeText: {
    fontSize:      10,
    letterSpacing: 1.2,
    fontWeight:    fontWeight.bold,
    color:         colors.bg.primary,
    textTransform: 'uppercase',
  },
  radio: {
    width:          20,
    height:         20,
    borderRadius:   10,
    borderWidth:    1.5,
    borderColor:    colors.border.strong,
    alignItems:     'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.amber[400],
  },
  radioDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: colors.amber[400],
  },
  planText: {
    flex: 1,
    gap:  2,
  },
  planTitle: {
    ...typography.title,
  },
  planSub: {
    ...typography.caption,
  },
  planPrice: {
    ...typography.rowNumeral,
    fontSize: fontSize.xl,
  },
  // Nested Text inherits the numeral face; name the system face explicitly.
  planUnit: {
    fontFamily: 'System',
    fontSize:   13,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.secondary,
  },

  // ── CTA ──
  ctaBlock: {
    gap: spacing[3],
  },
  ctaButton: {
    height:          54,
    borderRadius:    radius.lg,
    backgroundColor: colors.amber[400],
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaButtonBusy: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.bold,
    color:      colors.text.inverse,
  },
  ctaNote: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textAlign: 'center',
  },

  // ── Footer ──
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            spacing[2.5],
  },
  footerLink: {
    fontSize: 13,
    color:    colors.text.secondary,
  },
  footerDot: {
    fontSize: 13,
    color:    colors.text.tertiary,
  },
});
