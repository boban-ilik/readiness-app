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
 * Design language (1.3): the shared card surface, a bare tier icon, and the
 * load tier or HRV flag as plain coloured text. Both are computed, so neither
 * is drawn as a pill that looks tappable.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, fontWeight, spacing, surface, typography } from '@constants/theme';
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
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  label:   string;
}> = {
  none:     { color: colors.text.tertiary,  icon: 'fitness-outline',  label: 'Rest' },
  light:    { color: colors.success,        icon: 'walk-outline',     label: 'Light' },
  moderate: { color: colors.info,           icon: 'bicycle-outline',  label: 'Moderate' },
  heavy:    { color: colors.warning,        icon: 'barbell-outline',  label: 'Heavy' },
  peak:     { color: colors.error,          icon: 'flame-outline',    label: 'Peak' },
};

// ─── Summary line ─────────────────────────────────────────────────────────────

/**
 * "Strength · 65 min · Heavy" on one line. The name is set as a row title and
 * left exactly as written; in the parts after it the figures take the numeral
 * face. The outer Text carries no font of its own, so the numerals never
 * inherit a weight.
 */
function SummaryLine({ label }: { label: string }) {
  const [name, ...rest] = label.split(' · ');
  return (
    <Text numberOfLines={1}>
      <Text style={styles.subtitle}>{name}</Text>
      {rest.map((part, i) => (
        <Text key={i} style={styles.subtitleRest}>
          {' · '}
          {part.split(/(\d+)/).map((run, j) =>
            /^\d+$/.test(run) ? <Text key={j} style={styles.subtitleNumeral}>{run}</Text> : run,
          )}
        </Text>
      ))}
    </Text>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutContextBanner({ loadSummary, isLoading = false, onPress }: Props) {
  // Nothing to show if no workouts or still loading
  if (isLoading || loadSummary.loadTier === 'none') return null;

  const tier = TIER_CONFIG[loadSummary.loadTier];

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Left: icon + workout info */}
      <View style={styles.left}>
        <Ionicons name={tier.icon} size={22} color={tier.color} />
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Yesterday's Training
          </Text>
          <SummaryLine label={loadSummary.label} />
        </View>
      </View>

      {/* Right: HRV flag or load tier, as plain text */}
      <View style={styles.right}>
        {loadSummary.hrSuppression ? (
          <>
            <Ionicons name="trending-down" size={13} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.warning }]}>HRV impact</Text>
          </>
        ) : (
          <>
            <View style={[styles.statusDot, { backgroundColor: tier.color }]} />
            <Text style={[styles.statusText, { color: tier.color }]}>{tier.label}</Text>
          </>
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
    ...surface.card,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
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
  textBlock: {
    flex: 1,
    gap:  spacing[1],
  },
  title: {
    ...typography.label,
  },
  subtitle: {
    ...typography.title,
  },
  subtitleRest: {
    ...typography.caption,
  },
  subtitleNumeral: {
    fontFamily: fontFamily.numeral,
    fontSize:   fontSize.sm,
    color:      colors.text.primary,
  },

  // Tier or HRV flag: plain text, not a pill
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
    marginLeft:    spacing[2],
  },
  statusDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginRight:  2,
  },
  statusText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
