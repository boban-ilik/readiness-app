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
 *   $rc_monthly → monthly   ($6.99/mo)
 *   $rc_annual  → yearly    ($49.99/yr, 7-day free trial)
 *   lifetime    → lifetime  (one-time purchase, non-consumable)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@contexts/SubscriptionContext';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual' | 'lifetime';

interface DisplayPackage {
  cycle:       BillingCycle;
  priceLabel:  string;   // e.g. "$49.99 / year"
  perMonth:    string;   // e.g. "$4.17"  (for lifetime: "$0" — no monthly charge)
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
    icon:  'trending-up',
    title: '7-Day Trends',
    body:  'See your score chart, weekly average, and best day at a glance.',
  },
  {
    icon:  'barbell-outline',
    title: 'Training Guide',
    body:  'Daily workout prescription — zone, duration, and effort level explained in plain English.',
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

// ─── Fallback pricing (shown when RevenueCat packages haven't loaded) ─────────

const MOCK_PACKAGES: Record<BillingCycle, DisplayPackage> = {
  annual: {
    cycle:      'annual',
    priceLabel: '$49.99 / year',
    perMonth:   '$4.17',
    total:      'billed annually',
    badge:      '−40%',
    rcPackage:  null,
  },
  monthly: {
    cycle:      'monthly',
    priceLabel: '$6.99 / month',
    perMonth:   '$6.99',
    rcPackage:  null,
  },
  lifetime: {
    cycle:      'lifetime',
    priceLabel: '$99.99 once',
    perMonth:   'Pay once, own forever',
    badge:      'BEST',
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
  lifetime: 'Lifetime',
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
      {(['monthly', 'annual', 'lifetime'] as BillingCycle[]).map(cycle => {
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
  const [rcLoaded, setRcLoaded] = useState(false);

  // ── Load live packages from RevenueCat ──────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    async function loadPackages() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = (require('react-native-purchases') as { default: import('react-native-purchases').PurchasesStatic }).default;
        const offerings = await Purchases.getOfferings();
        const current   = offerings.current;
        if (!current) return;

        const updated: Record<BillingCycle, DisplayPackage> = { ...MOCK_PACKAGES };

        for (const pkg of current.availablePackages) {
          const productId = pkg.product.productIdentifier;
          const price     = pkg.product.priceString;  // e.g. "$6.99"

          const isAnnual   = pkg.packageType === 'ANNUAL'   || productId === 'yearly'   || productId.includes('annual')   || productId.includes('yearly');
          const isMonthly  = pkg.packageType === 'MONTHLY'  || productId === 'monthly'  || productId.includes('monthly');
          const isLifetime = pkg.packageType === 'LIFETIME' || productId === 'lifetime' || productId.includes('lifetime');

          if (isAnnual) {
            const monthly = `$${(pkg.product.price / 12).toFixed(2)}`;
            updated.annual = {
              cycle:      'annual',
              priceLabel: `${price} / year`,
              perMonth:   monthly,
              total:      'billed annually',
              badge:      '−40%',
              rcPackage:  pkg,
            };
          } else if (isLifetime) {
            updated.lifetime = {
              cycle:      'lifetime',
              priceLabel: `${price} once`,
              perMonth:   'Pay once, own forever',
              badge:      'BEST',
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
        setRcLoaded(true);
      } catch {
        // RevenueCat not linked yet (Expo Go) — mock packages remain
      }
    }

    loadPackages();
  }, []);

  const selectedPkg = packages[cycle];

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
          await refreshEntitlements();
          router.back();
        } else {
          Alert.alert('Purchase Issue', 'Payment completed but Pro entitlement was not activated. Please restore purchases or contact support.');
        }
      } else {
        // ── Mock purchase (dev / Expo Go) ─────────────────────────────────────
        await new Promise<void>(r => setTimeout(r, 1000));
        await debugSetPro(true);
        router.back();
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
      if (rcLoaded) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = (require('react-native-purchases') as { default: import('react-native-purchases').PurchasesStatic }).default;
        const info = await Purchases.restorePurchases();
        if (info.entitlements.active['pro']) {
          await refreshEntitlements();
          Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('No Previous Purchase', 'We couldn\'t find an active Pro subscription linked to your Apple ID.');
        }
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
          {cycle === 'lifetime' && (
            <Text style={styles.priceNote}>{selectedPkg.perMonth}</Text>
          )}
        </View>

        {/* ── Trial badge (annual only) ── */}
        {cycle === 'annual' && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeIcon}>🎁</Text>
            <Text style={styles.trialBadgeText}>7-day free trial included</Text>
          </View>
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
                {cycle === 'annual'   ? 'Start Free Trial'    :
                 cycle === 'lifetime' ? 'Buy Lifetime Access' :
                                       'Subscribe Monthly'}
              </Text>
          }
        </TouchableOpacity>

        <Text style={styles.ctaNote}>
          {cycle === 'annual'
            ? 'No charge for 7 days · Cancel anytime in App Store'
            : cycle === 'lifetime'
            ? 'One-time purchase · No recurring charges'
            : 'Billed monthly · Cancel anytime in App Store'}
        </Text>

        {/* ── Footer links ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={busy} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity activeOpacity={0.7}>
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
