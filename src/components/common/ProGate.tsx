/**
 * ProGate
 *
 * Wraps any screen section or card with a Pro paywall.
 *
 * Usage — full-section lock (history screen, training card, etc.):
 *
 *   <ProGate feature="7-Day History & Trends">
 *     <HistoryChart ... />
 *   </ProGate>
 *
 * A free user sees one upgrade card in place of `children`: what is behind
 * the lock, the bullets, the price line and the button that opens the paywall.
 * When the user is Pro, children render normally with zero overhead.
 *
 * Props:
 *   feature      — human-readable name shown in the upgrade headline
 *   description  — optional one-liner below the headline
 *   children     — the content to gate (rendered for Pro users only)
 *   style        — optional ViewStyle applied to the outer container
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@contexts/SubscriptionContext';
import { colors, fontFamily, fontSize, fontWeight, radius, spacing, surface, typography } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

// ─── Headline display names ───────────────────────────────────────────────────
// Maps the full feature key to a shorter string used in the "Unlock X" headline.
// Keeps the headline to one line on narrow screens (≥ 320 pt wide).

const HEADLINE_DISPLAY: Record<string, string> = {
  'Training Load Recommendations':     'Training Load',
  '7-Day History & Trends':            '7-Day History',
  'Custom Thresholds & Notifications': 'Custom Notifications',
  'Export & Correlations':             'Export & Correlations',
};

// ─── Feature bullet points ────────────────────────────────────────────────────

const FEATURE_BULLETS: Record<string, string[]> = {
  '7-Day History & Trends': [
    'Full 7-day score trend chart',
    'Recovery, Sleep & Stress breakdown',
    'Best day & weekly average stats',
  ],
  'Training Load Recommendations': [
    'Daily training prescription (zone, duration)',
    'Adapts to your 3-day recovery window',
    'Effort zone guidance (Easy → Hard)',
  ],
  'Custom Thresholds & Notifications': [
    'Alert when score drops below your target',
    'Morning digest with score preview',
    'Smart do-not-disturb based on score',
  ],
  'Export & Correlations': [
    'Export your data as CSV',
    'Correlation insights (sleep, alcohol, etc.)',
    'Shareable weekly summary card',
  ],
  'Coach Chat': [
    'Answers grounded in today\'s HRV, sleep and load',
    'Remembers the thread across the day',
    'Reads your cycle phase when tracking is on',
  ],
};

const DEFAULT_BULLETS = [
  'Advanced analytics & insights',
  'Personalised recommendations',
  'Full history & data export',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProGate({ feature, description, children, style }: ProGateProps) {
  const { isPro, isLoading, identityReady } = useSubscription();
  const router                              = useRouter();

  // isPro starts false while RevenueCat resolves, so rendering the gate straight
  // away flashed the upgrade panel at paying subscribers on every cold start —
  // their own app appearing to have downgraded them. isLoading alone was not
  // enough: it clears after the initial (anonymous) customer fetch, before
  // Purchases.logIn() resolves the signed-in customer, which reopened the same
  // flash for one beat. Wait for both.
  if (isLoading || !identityReady) return null;

  // Pro users — render children with zero overhead
  if (isPro) return <>{children}</>;

  const bullets     = FEATURE_BULLETS[feature] ?? DEFAULT_BULLETS;
  const displayName = HEADLINE_DISPLAY[feature] ?? feature;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.eyebrowRow}>
        <Ionicons name="lock-closed" size={12} color={colors.amber[400]} />
        <Text style={styles.eyebrow}>Readiness Pro</Text>
      </View>

      <Text style={styles.headline}>
        Unlock {displayName}
      </Text>

      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}

      <View style={styles.bullets}>
        {bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons name="checkmark" size={16} color={colors.amber[400]} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.85}
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Upgrade to Pro</Text>
      </TouchableOpacity>

      <Text style={styles.priceText}>Readiness Pro · $9.99 / month</Text>

      {/* The introductory offer exists on the annual subscription only, so
          this used to advertise a free trial directly above a monthly price
          that does not carry one. */}
      <Text style={styles.footerNote}>
        14-day free trial on the annual plan · Cancel anytime
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...surface.card,
    padding: spacing[5],
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginBottom: spacing[2],
  },
  eyebrow: {
    ...typography.label,
    color: colors.amber[400],
  },

  headline: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
    color: colors.text.primary,
    marginBottom: spacing[1.5],
  },

  description: {
    ...typography.caption,
    marginBottom: spacing[4],
  },

  bullets: {
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 21,
  },

  ctaButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.amber[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  ctaText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },

  priceText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[0.5],
  },
  footerNote: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
