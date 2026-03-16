/**
 * StreakBanner
 *
 * Displays the user's current daily check-in streak below the score ring.
 * Renders nothing while loading or if score is 0 (no data yet).
 *
 * States:
 *   • streak = 0  → "Start your streak today" nudge
 *   • streak 1–6  → "🔥 N-day streak" + best if applicable
 *   • streak 7+   → same but with a subtle celebration treatment
 */

import { View, Text, StyleSheet } from 'react-native';
import { useStreak } from '@hooks/useStreak';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from '@constants/theme';

interface StreakBannerProps {
  score: number;   // hide banner if score = 0 (no data)
}

export default function StreakBanner({ score }: StreakBannerProps) {
  const { current, best, isLoading } = useStreak();

  if (isLoading || score === 0) return null;

  const isMilestone = current > 0 && current % 7 === 0;
  const isStrong    = current >= 7;

  // ── No streak yet ────────────────────────────────────────────────────────────
  if (current === 0) {
    return (
      <View style={styles.nudgeBanner}>
        <Text style={styles.nudgeIcon}>🌱</Text>
        <Text style={styles.nudgeText}>Check in daily to build your streak</Text>
      </View>
    );
  }

  // ── Active streak ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.banner, isStrong && styles.bannerStrong]}>

      {/* Flame + count */}
      <View style={styles.left}>
        <Text style={styles.flame}>{isMilestone ? '🎉' : '🔥'}</Text>
        <View style={styles.textBlock}>
          <Text style={[styles.streakCount, isStrong && styles.streakCountStrong]}>
            {current}-day streak
          </Text>
          {isMilestone && (
            <Text style={styles.milestoneText}>
              {current} days in a row — keep it going!
            </Text>
          )}
        </View>
      </View>

      {/* Best streak badge */}
      {best > 1 && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{best}</Text>
        </View>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Active streak banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    marginBottom: spacing[4],
  },
  bannerStrong: {
    backgroundColor: colors.amber[900] + '33',
    borderColor: colors.amber[700] + '66',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  flame: {
    fontSize: 22,
  },
  textBlock: {
    gap: 2,
  },
  streakCount: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  streakCountStrong: {
    color: colors.amber[400],
  },
  milestoneText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
  },

  // Best streak badge
  bestBadge: {
    alignItems: 'center',
    gap: 1,
    paddingLeft: spacing[3],
    borderLeftWidth: 1,
    borderLeftColor: colors.border.subtle,
  },
  bestLabel: {
    color: colors.text.tertiary,
    fontSize: 8,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  bestValue: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // No-streak nudge
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    marginBottom: spacing[4],
  },
  nudgeIcon: {
    fontSize: 16,
  },
  nudgeText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
