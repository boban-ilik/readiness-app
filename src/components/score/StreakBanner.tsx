/**
 * StreakBanner
 *
 * Displays the user's current daily check-in streak below the score ring.
 * Renders nothing while loading or if score is 0 (no data yet).
 *
 * States:
 *   • streak = 0  → "Start your streak today" nudge
 *   • streak 1–6  → flame icon, "N-day streak" + best if applicable
 *   • streak 7+   → same in amber
 *
 * Nothing here is tappable, so it is a flat row, not a card.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStreak } from '@hooks/useStreak';
import { colors, fontFamily, spacing, typography } from '@constants/theme';

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
        <Ionicons name="flame-outline" size={18} color={colors.text.tertiary} />
        <Text style={styles.nudgeText}>Check in daily to build your streak</Text>
      </View>
    );
  }

  // ── Active streak ────────────────────────────────────────────────────────────
  return (
    <View style={styles.banner}>

      {/* Flame + count */}
      <View style={styles.left}>
        <Ionicons name={isMilestone ? 'trophy-outline' : 'flame-outline'} size={20} color={isStrong ? colors.amber[400] : colors.text.secondary} />
        <View style={styles.textBlock}>
          <Text style={[styles.streakCount, isStrong && styles.streakCountStrong]}>
            {current}-day streak
          </Text>
          {isMilestone && (
            <Text style={styles.milestoneText}>
              {current} days in a row, keep it going!
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
  // Active streak row
  banner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
    marginBottom:   spacing[4],
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    flex:          1,
  },
  textBlock: {
    gap: 2,
  },
  streakCount: {
    ...typography.title,
  },
  streakCountStrong: {
    color: colors.amber[400],
  },
  milestoneText: {
    ...typography.caption,
  },

  // Best streak
  bestBadge: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           spacing[2],
  },
  bestLabel: {
    ...typography.label,
    letterSpacing: 1.2,
  },
  bestValue: {
    fontFamily: fontFamily.numeral,
    fontSize:   20,
    color:      colors.text.primary,
  },

  // No-streak nudge
  nudgeBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3],
    paddingVertical: spacing[1],
    marginBottom:    spacing[4],
  },
  nudgeText: {
    ...typography.caption,
  },
});
