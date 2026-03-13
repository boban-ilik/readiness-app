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
 * The component renders `children` underneath at 12% opacity (acting as a
 * dim preview) and overlays a frosted upgrade panel on top.
 * When the user is Pro, children render normally with zero overhead.
 *
 * ── Layout architecture ────────────────────────────────────────────────────
 * The overlay content is in NORMAL DOCUMENT FLOW — it controls the container
 * height so the upgrade panel is never clipped regardless of how tall or short
 * the gated children are.
 *
 * The dark background and dim preview are ABSOLUTELY POSITIONED behind the
 * overlay content and do not participate in layout.
 *
 * Props:
 *   feature      — human-readable name shown in the upgrade headline
 *   description  — optional one-liner below the headline
 *   children     — the content to gate (rendered as a dim preview behind the lock)
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
import { useSubscription } from '@contexts/SubscriptionContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@constants/theme';

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
};

const DEFAULT_BULLETS = [
  'Advanced analytics & insights',
  'Personalised recommendations',
  'Full history & data export',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProGate({ feature, description, children, style }: ProGateProps) {
  const { isPro } = useSubscription();
  const router    = useRouter();

  // Pro users — render children with zero overhead
  if (isPro) return <>{children}</>;

  const bullets     = FEATURE_BULLETS[feature] ?? DEFAULT_BULLETS;
  const displayName = HEADLINE_DISPLAY[feature] ?? feature;

  return (
    <View style={[styles.container, style]}>

      {/* ── Layer 1: dark tinted background (absolute, behind everything) ── */}
      <View style={[StyleSheet.absoluteFill, styles.overlayBg]} pointerEvents="none" />

      {/* ── Layer 2: dim preview of the gated content (absolute, behind panel) ── */}
      <View style={[StyleSheet.absoluteFill, styles.previewDim]} pointerEvents="none">
        {children}
      </View>

      {/* ── Layer 3: upgrade panel — NORMAL FLOW so it defines the container height ── */}
      <View style={styles.overlay}>

        {/* Crown icon */}
        <Text style={styles.crown}>♛</Text>

        <Text style={styles.headline}>
          Unlock {displayName}
        </Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}

        {/* Bullet list */}
        <View style={styles.bullets}>
          {bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>✦</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Price pill */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>Readiness Pro · $6.99 / month</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.ctaText}>Upgrade to Pro</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          7-day free trial · Cancel anytime
        </Text>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Outer wrapper — overflow:hidden clips the absoluteFill layers to the border radius
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },

  // Dark tinted background — fills the container, sits behind everything
  overlayBg: {
    backgroundColor: 'rgba(13, 15, 20, 0.92)',
  },

  // Gated content at low opacity — fills the container, sits behind the panel
  previewDim: {
    opacity: 0.12,
  },

  // Upgrade panel — in NORMAL FLOW so it controls the container height.
  // No flex:1, no justifyContent:center — content always starts at top and
  // the container grows to fit it.
  overlay: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },

  crown: {
    fontSize: 28,
    color: colors.amber[400],
    marginBottom: spacing[3],
  },

  headline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: fontSize.sm * 1.5,
  },

  // Bullet list
  bullets: {
    alignSelf: 'stretch',
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bulletDot: {
    fontSize: fontSize.xs,
    color: colors.amber[400],
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * 1.5,
  },

  // Price pill
  pricePill: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    marginBottom: spacing[4],
  },
  priceText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },

  // CTA button
  ctaButton: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[10],
    marginBottom: spacing[3],
  },
  ctaText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
    textAlign: 'center',
  },

  footerNote: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
