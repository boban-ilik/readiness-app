/**
 * WorkoutContextBanner
 *
 * Surfaces yesterday's workout load on the home screen so users understand
 * why their readiness might be lower than expected.
 *
 * Shows:
 *  - Sport name + duration + load tier
 *  - HRV suppression alert when HRV is ≥10% below baseline AND load was heavy/peak
 *  - Nothing at all when there's no workout data
 *
 * Design language: mirrors the StreakBanner — same height, same padding,
 * same card surface. Sits below StreakBanner in the home screen stack.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import type { WorkoutLoadSummary, LoadTier } from '@utils/workoutLoad';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  loadSummary: WorkoutLoadSummary;
  isLoading?:  boolean;
  onPress?:    () => void;  // optional: expand to full workout detail (Phase 2)
}

// ─── Tier colours ─────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<LoadTier, {
  color:   string;
  bgTint:  string;
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  label:   string;
}> = {
  none:     { color: colors.text.tertiary,  bgTint: 'transparent',        icon: 'fitness-outline',     label: 'Rest' },
  light:    { color: colors.success,        bgTint: colors.success + '15', icon: 'walk-outline',         label: 'Light' },
  moderate: { color: colors.info,           bgTint: colors.info    + '15', icon: 'bicycle-outline',      label: 'Moderate' },
  heavy:    { color: colors.warning,        bgTint: colors.warning + '15', icon: 'barbell-outline',      label: 'Heavy' },
  peak:     { color: colors.error,          bgTint: colors.error   + '15', icon: 'flame-outline',        label: 'Peak' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutContextBanner({ loadSummary, isLoading = false, onPress }: Props) {
  // Nothing to show if no workouts or still loading
  if (isLoading || loadSummary.loadTier === 'none') return null;

  const tier   = TIER_CONFIG[loadSummary.loadTier];
  const isHigh = loadSummary.loadTier === 'heavy' || loadSummary.loadTier === 'peak';

  return (
    <TouchableOpacity
      style={[styles.banner, isHigh && { backgroundColor: tier.bgTint }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Left: icon + workout info */}
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: tier.bgTint }]}>
          <Ionicons name={tier.icon} size={18} color={tier.color} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Yesterday's Training
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {loadSummary.label}
          </Text>
        </View>
      </View>

      {/* Right: HRV alert or load badge */}
      <View style={styles.right}>
        {loadSummary.hrSuppression ? (
          <View style={styles.alertPill}>
            <Ionicons name="trending-down" size={12} color={colors.warning} />
            <Text style={styles.alertText}>HRV impact</Text>
          </View>
        ) : (
          <View style={[styles.tierPill, { backgroundColor: tier.color + '20' }]}>
            <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Suppression note (separate export for inline use in score coach) ─────────

/**
 * Returns a short one-line context note for the AI coach and TrainingLoadCard.
 * Returns null when there's nothing to surface.
 */
export function workoutCoachNote(loadSummary: WorkoutLoadSummary): string | null {
  if (!loadSummary.contextNote) return null;
  return loadSummary.contextNote;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: colors.bg.secondary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    marginBottom:      spacing[2],
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    flex:          1,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap:  2,
  },
  title: {
    color:      colors.text.secondary,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  right: {
    marginLeft: spacing[2],
  },
  tierPill: {
    borderRadius:    radius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical:   spacing[1],
  },
  tierText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  alertPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    borderRadius:    radius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical:   spacing[1],
    backgroundColor:   colors.warning + '20',
  },
  alertText: {
    color:      colors.warning,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
