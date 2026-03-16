/**
 * StravaLastWorkoutCard
 *
 * Shows the most recent Strava activity on the home screen.
 * Only renders when Strava is connected and at least one activity exists.
 *
 * Displays: activity name, sport icon, time ago, duration, distance (if
 * relevant), suffer score badge, and average HR when available.
 */

import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { sufferScoreToLoadTier, type StravaActivity } from '@services/strava';

// ─── Strava brand orange ──────────────────────────────────────────────────────
const STRAVA_ORANGE = '#FC4C02';

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

/** Suffer score → display label + colour */
function sufferLabel(score: number): { text: string; color: string } {
  const tier = sufferScoreToLoadTier(score);
  switch (tier) {
    case 'light':    return { text: `${score} · Easy`,   color: colors.success };
    case 'moderate': return { text: `${score} · Solid`,  color: colors.info    };
    case 'heavy':    return { text: `${score} · Hard`,   color: colors.warning };
    case 'peak':     return { text: `${score} · Epic`,   color: colors.error   };
    default:         return { text: `${score}`,          color: colors.text.tertiary };
  }
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
      {/* Left: sport icon bubble */}
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={STRAVA_ORANGE} />
      </View>

      {/* Centre: name + stats */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
          <Text style={styles.when}>{when}</Text>
        </View>
        <Text style={styles.stats}>{stats.join('  ·  ')}</Text>
      </View>

      {/* Right: suffer score badge OR simple chevron */}
      <View style={styles.right}>
        {suffer ? (
          <View style={[styles.sufferPill, { backgroundColor: suffer.color + '20' }]}>
            <Text style={[styles.sufferText, { color: suffer.color }]}>{suffer.text}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
        )}
      </View>
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
        <View style={styles.stravaBadge}>
          <Text style={styles.stravaBadgeText}>via Strava</Text>
        </View>
      </View>
      <StravaLastWorkoutCard activity={latest} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
  },
  sectionLabel: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 2,
  },
  stravaBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[1],
    backgroundColor:   STRAVA_ORANGE + '18',
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
  },
  stravaBadgeText: {
    color:      STRAVA_ORANGE,
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bg.secondary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    gap:             spacing[3],
  },
  iconWrap: {
    width:          40,
    height:         40,
    borderRadius:   radius.md,
    backgroundColor: STRAVA_ORANGE + '18',
    alignItems:     'center',
    justifyContent: 'center',
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
    flex:       1,
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  when: {
    color:      colors.text.tertiary,
    fontSize:   fontSize.xs,
    flexShrink: 0,
  },
  stats: {
    color:    colors.text.secondary,
    fontSize: fontSize.xs,
  },
  right: {
    alignItems: 'center',
    flexShrink: 0,
  },
  sufferPill: {
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
  },
  sufferText: {
    fontSize:   10,
    fontWeight: fontWeight.bold,
  },
});
