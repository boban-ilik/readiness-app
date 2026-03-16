import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '@constants/theme';

interface ScoreBreakdownCardProps {
  label: string;
  score: number;        // 0–100
  weight: string;       // e.g. "45%"
  detail?: string;      // e.g. "HRV 58ms · RHR 52bpm"
  icon: string;         // emoji for now, swap for icons later
  isLocked?: boolean;   // free tier — blur and show lock
  onPress?: () => void; // Pro only — opens breakdown modal
}

export default function ScoreBreakdownCard({
  label,
  score,
  weight,
  detail,
  icon,
  isLocked = false,
  onPress,
}: ScoreBreakdownCardProps) {
  const router   = useRouter();
  const barColor = getBarColor(score);
  const tappable = !!onPress;  // always tappable — locked cards go to paywall

  // ── Animated progress bar ──────────────────────────────────────────────────
  // RN's Animated.Value supports string interpolation (for '%') and doesn't
  // require the native driver — perfect for layout-driven width animations.
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue:         score,   // always animate — free users see their real score
      duration:        700,
      useNativeDriver: false,
      delay:           120,
    }).start();
  }, [score]);

  const animatedBarWidth = barAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // ── Card shadow (iOS only — Android elevation already handled by bg) ────────
  const cardShadow = Platform.OS === 'ios' ? shadow.sm : {};

  const cardContent = (
    <>
      {/* Score-coloured left accent strip */}
      <View style={[styles.accentBar, { backgroundColor: barColor }]} />

      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.labelRow}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.weight}>{weight}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{Math.round(score)}</Text>
            {tappable && <Text style={styles.chevron}>›</Text>}
          </View>
        </View>

        {/* Animated progress bar — always shows real score */}
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { width: animatedBarWidth, backgroundColor: barColor },
            ]}
          />
        </View>

        {/* Detail line — free users see a teaser; Pro see the full line */}
        {detail && !isLocked && (
          <Text style={styles.detail}>{detail}</Text>
        )}
        {detail && isLocked && (
          <Text style={styles.detail} numberOfLines={1}>
            {detail.split('·')[0].trim()}
            <Text style={styles.upgradeHint}> · Tap for full analysis →</Text>
          </Text>
        )}
        {!detail && isLocked && (
          <Text style={styles.upgradeHint}>Tap to see what's driving this →</Text>
        )}
      </View>
    </>
  );

  // Pro users — tappable breakdown card
  if (tappable) {
    return (
      <TouchableOpacity
        style={[styles.card, cardShadow]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  // Locked (free) users — tapping goes to paywall
  if (isLocked) {
    return (
      <TouchableOpacity
        style={[styles.card, cardShadow]}
        onPress={() => router.push('/paywall')}
        activeOpacity={0.75}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, cardShadow]}>{cardContent}</View>;
}

function getBarColor(score: number): string {
  if (score <= 40) return colors.score.poor;
  if (score <= 60) return colors.score.fair;
  if (score <= 80) return colors.score.good;
  return colors.score.optimal;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    overflow:        'hidden',  // clips the accent bar to the card's border radius
    flexDirection:   'row',
  },
  // Coloured 3px strip pinned to the left edge
  accentBar: {
    width:        3,
    alignSelf:    'stretch',
  },
  // Inner content takes remaining space
  inner: {
    flex:    1,
    padding: spacing[4],
    gap:     spacing[2.5],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  icon: {
    fontSize: fontSize.base,
  },
  label: {
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  weight: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
  },
  score: {
    color:      colors.text.primary,
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  chevron: {
    color:      colors.text.tertiary,
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.regular,
    marginTop:  1,
  },
  locked: {
    color: colors.text.tertiary,
  },
  barTrack: {
    height:          4,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.full,
    overflow:        'hidden',
  },
  barFill: {
    height:       '100%',
    borderRadius: radius.full,
  },
  detail: {
    color:    colors.text.secondary,
    fontSize: fontSize.xs,
  },
  upgradeHint: {
    color:    colors.amber[600],
    fontSize: fontSize.xs,
  },
});
