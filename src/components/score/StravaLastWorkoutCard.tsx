/**
 * StravaLastWorkoutCard
 *
 * Shows the most recent Strava activity on the home screen.
 * Only renders when Strava is connected and at least one activity exists.
 *
 * Displays: activity name, sport icon, time ago, duration, distance (if
 * relevant), suffer score with its effort word, and average HR when available.
 */

import { View, Text, StyleSheet, TouchableOpacity, Linking, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, spacing, surface, typography } from '@constants/theme';
import { sufferScoreToLoadTier, type StravaActivity } from '@services/strava';

// ─── Sport type → icon mapping ────────────────────────────────────────────────

function sportIcon(sportType: string): React.ComponentProps<typeof Ionicons>['name'] {
  const s = sportType.toLowerCase();
  if (s.includes('run'))           return 'walk-outline';
  if (s.includes('ride') || s.includes('cycling') || s.includes('bike')) return 'bicycle-outline';
  if (s.includes('swim'))          return 'water-outline';
  if (s.includes('weight') || s.includes('strength') || s.includes('crossfit')) return 'barbell-outline';
  if (s.includes('yoga') || s.includes('stretch')) return 'body-outline';
  if (s.includes('hike'))          return 'trending-up-outline';
  if (s.includes('ski') || s.includes('snow'))    return 'snow-outline';
  if (s.includes('row'))           return 'boat-outline';
  if (s.includes('walk'))          return 'footsteps-outline';
  return 'fitness-outline';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format seconds as "1h 24m" or "48m" */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Format metres to "5.2 km" or "0.8 km"; returns null when distance is 0 */
function formatDistance(metres: number): string | null {
  if (!metres || metres < 100) return null;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Relative time label: "Today", "Yesterday", "2d ago" */
function timeAgo(isoDate: string): string {
  const now        = new Date();
  const actDate    = new Date(isoDate);
  const diffMs     = now.getTime() - actDate.getTime();
  const diffDays   = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays}d ago`;
  if (diffDays < 30)  return `${Math.floor(diffDays / 7)}w ago`;
  return actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Suffer score → effort word + colour. The number itself is drawn in the numeral face. */
function sufferLabel(score: number): { score: number; word: string | null; color: string } {
  const tier = sufferScoreToLoadTier(score);
  switch (tier) {
    case 'light':    return { score, word: 'Easy',  color: colors.success };
    case 'moderate': return { score, word: 'Solid', color: colors.info    };
    case 'heavy':    return { score, word: 'Hard',  color: colors.warning };
    case 'peak':     return { score, word: 'Epic',  color: colors.error   };
    default:         return { score, word: null,    color: colors.text.tertiary };
  }
}

/**
 * Sets the figures of a short line ("1h 24m", "5.2 km", "2d ago") in the
 * numeral face. The words and units around them keep the parent's font.
 */
function withNumerals(text: string, numeralStyle: StyleProp<TextStyle>) {
  return text.split(/(\d+(?:\.\d+)?)/).map((run, i) =>
    /^\d/.test(run) ? <Text key={i} style={numeralStyle}>{run}</Text> : run,
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activity:   StravaActivity;
  onPress?:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StravaLastWorkoutCard({ activity, onPress }: Props) {
  const icon      = sportIcon(activity.sport_type);
  const duration  = formatDuration(activity.elapsed_time);
  const distance  = formatDistance(activity.distance);
  const when      = timeAgo(activity.start_date_local);
  const suffer    = activity.suffer_score != null ? sufferLabel(activity.suffer_score) : null;

  // Build a compact stat row: duration always shown, distance + HR optional
  const stats: string[] = [duration];
  if (distance)                        stats.push(distance);
  if (activity.average_heartrate)      stats.push(`${Math.round(activity.average_heartrate)} bpm avg`);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Left: sport icon */}
      <Ionicons name={icon} size={22} color={colors.text.secondary} />

      {/* Centre: name + stats */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
          <Text style={styles.when}>{withNumerals(when, styles.whenNumeral)}</Text>
        </View>
        <Text style={styles.stats}>
          {stats.map((stat, i) => (
            <Text key={i}>
              {i > 0 ? '  ·  ' : ''}
              {withNumerals(stat, styles.statNumeral)}
            </Text>
          ))}
        </Text>
      </View>

      {/* Right: suffer score as plain text, or a chevron when the row opens something */}
      {suffer ? (
        <Text style={styles.sufferScore}>
          {suffer.score}
          {suffer.word && (
            <Text style={[styles.sufferWord, { color: suffer.color }]}>{` · ${suffer.word}`}</Text>
          )}
        </Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Wrapper that handles the "no data / not connected" guard ─────────────────

interface WrapperProps {
  isConnected: boolean;
  activities:  StravaActivity[];
  isLoading?:  boolean;
}

export function StravaLastWorkoutSection({ isConnected, activities, isLoading }: WrapperProps) {
  if (!isConnected || isLoading || activities.length === 0) return null;

  // Sort descending by start date and take the most recent
  const latest = [...activities].sort(
    (a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime(),
  )[0];

  return (
    <View style={styles.section}>
      {/* Section header with Strava branding */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>LAST STRAVA WORKOUT</Text>
        <Text style={styles.source}>via Strava</Text>
      </View>
      <StravaLastWorkoutCard activity={latest} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing[2],
  },
  sectionLabel: {
    ...typography.label,
  },
  // Where the data came from: quiet text, not a badge
  source: {
    fontSize: fontSize['2xs'],
    color:    colors.text.tertiary,
  },
  card: {
    ...surface.card,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    gap:               spacing[3],
  },
  body: {
    flex: 1,
    gap:  3,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    gap:            spacing[2],
  },
  activityName: {
    ...typography.title,
    flex: 1,
  },
  when: {
    ...typography.caption,
    color:      colors.text.tertiary,
    flexShrink: 0,
  },
  whenNumeral: {
    fontFamily: fontFamily.numeral,
    fontSize:   14,
  },
  stats: {
    ...typography.caption,
  },
  statNumeral: {
    fontFamily: fontFamily.numeral,
    fontSize:   fontSize.sm,
    color:      colors.text.primary,
  },

  // Effort: the number in the numeral face, the word coloured by its tier
  sufferScore: {
    fontFamily: fontFamily.numeral,
    fontSize:   fontSize.lg,
    color:      colors.text.primary,
    flexShrink: 0,
  },
  sufferWord: {
    fontFamily: 'System',
    fontSize:   13,
  },
});
