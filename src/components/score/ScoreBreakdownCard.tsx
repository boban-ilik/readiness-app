/**
 * ScoreBreakdownCard
 *
 * One component of the score as a flat row: a thin arc for the value, the
 * name with a one-line detail, and the number on the right. Rows sit on the
 * screen background separated by a hairline (the 1.3 design). Every user
 * can open the detail sheet; the Pro lock lives inside it.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@constants/theme';

interface ScoreBreakdownCardProps {
  label: string;
  score: number;        // 0 to 100
  detail?: string;      // e.g. "HRV 58ms · RHR 52bpm"
  onPress?: () => void; // opens the breakdown sheet
  /** Hairline under the row; off for the last row of the list. */
  divider?: boolean;
}

const ARC_SIZE   = 36;
const ARC_STROKE = 4;

function Arc({ score, color }: { score: number; color: string }) {
  const r      = (ARC_SIZE - ARC_STROKE) / 2;
  const c      = 2 * Math.PI * r;
  const center = ARC_SIZE / 2;
  const filled = c * Math.min(Math.max(score, 0), 100) / 100;
  return (
    <Svg width={ARC_SIZE} height={ARC_SIZE}>
      <Circle cx={center} cy={center} r={r} stroke={colors.bg.secondary} strokeWidth={ARC_STROKE} fill="none" />
      {/* A round cap would draw a dot for a zero score; leave the track empty instead. */}
      {filled > 0 && (
        <Circle
          cx={center} cy={center} r={r}
          stroke={color} strokeWidth={ARC_STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={[filled, c]}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </Svg>
  );
}

export default function ScoreBreakdownCard({
  label,
  score,
  detail,
  onPress,
  divider = true,
}: ScoreBreakdownCardProps) {
  const color = getArcColor(score);

  const content = (
    <View style={[styles.row, divider && styles.divider]}>
      <Arc score={score} color={color} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {!!detail && <Text style={styles.detail} numberOfLines={2}>{detail}</Text>}
      </View>
      <View style={styles.right}>
        <Text style={styles.score}>{Math.round(score)}</Text>
        {onPress && <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />}
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${Math.round(score)}`}
    >
      {content}
    </TouchableOpacity>
  );
}

function getArcColor(score: number): string {
  if (score <= 40) return colors.score.poor;
  if (score <= 60) return colors.score.fair;
  if (score <= 80) return colors.score.good;
  return colors.score.optimal;
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3.5],
    paddingVertical: spacing[3.5],
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  text: {
    flex: 1,
    gap:  2,
  },
  label: {
    ...typography.title,
  },
  detail: {
    fontSize:   13,
    lineHeight: 17,
    color:      colors.text.secondary,
  },
  right: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            spacing[1],
    minWidth:       44,
  },
  score: {
    ...typography.rowNumeral,
  },
});
