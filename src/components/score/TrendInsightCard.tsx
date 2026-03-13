/**
 * TrendInsightCard
 *
 * Pro-only home screen card that shows a 7-day readiness sparkline,
 * a trend direction indicator, and a one-line personalised insight.
 *
 * Layout:
 *  ┌──────────────────────────────────────────┐
 *  │  RECOVERY TREND · 7 DAYS        ↑ +8.2  │
 *  │  ▂▃▄▄▅▆▇  (sparkline bars)             │
 *  │  Recovery trending up — good window…    │
 *  └──────────────────────────────────────────┘
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTrendData, type TrendDirection } from '@hooks/useTrendData';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  getScoreColor,
} from '@constants/theme';

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  scores: number[];
  width:  number;
  height: number;
}

function Sparkline({ scores, width, height }: SparklineProps) {
  if (scores.length === 0) return null;

  const max      = Math.max(...scores, 1);
  const min      = Math.min(...scores);
  const range    = max - min || 1;
  const barCount = scores.length;
  const gap      = 3;
  const barW     = (width - gap * (barCount - 1)) / barCount;
  const minBarH  = 4; // always show at least a sliver

  return (
    <Svg width={width} height={height}>
      {scores.map((s, i) => {
        const barH  = Math.max(minBarH, ((s - min) / range) * (height - minBarH) + minBarH);
        const x     = i * (barW + gap);
        const y     = height - barH;
        const color = getScoreColor(s);
        // Highlight the most recent bar
        const opacity = i === scores.length - 1 ? 1 : 0.55;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
}

// ─── Trend arrow + delta ──────────────────────────────────────────────────────

function TrendBadge({ direction, delta }: { direction: TrendDirection; delta: number }) {
  const arrow =
    direction === 'improving' ? '↑' :
    direction === 'declining' ? '↓' : '→';

  const badgeColor =
    direction === 'improving' ? colors.score.good    :
    direction === 'declining' ? colors.score.poor    :
    colors.text.tertiary;

  const sign = delta > 0 ? '+' : '';

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
      <Text style={[styles.badgeText, { color: badgeColor }]}>
        {arrow} {sign}{delta.toFixed(1)}
      </Text>
    </View>
  );
}

// ─── Component labels ─────────────────────────────────────────────────────────

function ComponentPills({
  components,
}: {
  components: {
    recovery: { direction: TrendDirection };
    sleep:    { direction: TrendDirection };
    stress:   { direction: TrendDirection };
  };
}) {
  const items: Array<{ label: string; key: 'recovery' | 'sleep' | 'stress' }> = [
    { label: 'Recovery', key: 'recovery' },
    { label: 'Sleep',    key: 'sleep'    },
    { label: 'Stress',   key: 'stress'   },
  ];

  return (
    <View style={styles.pills}>
      {items.map(({ label, key }) => {
        const dir = components[key].direction;
        const icon =
          dir === 'improving' ? '↑' :
          dir === 'declining' ? '↓' : '→';
        const color =
          dir === 'improving' ? colors.score.good :
          dir === 'declining' ? colors.score.poor :
          colors.text.tertiary;
        return (
          <View key={key} style={styles.pill}>
            <Text style={[styles.pillText, { color }]}>
              {icon} {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function TrendInsightCard() {
  const { trend, isLoading, error } = useTrendData();

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>RECOVERY TREND · 7 DAYS</Text>
        </View>
        <View style={styles.skeletonChart} />
        <View style={styles.skeletonLine} />
        <ActivityIndicator size="small" color={colors.text.tertiary} style={{ marginTop: 4 }} />
      </View>
    );
  }

  // ── Not enough data ───────────────────────────────────────────────────────
  if (!trend || error) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>RECOVERY TREND · 7 DAYS</Text>
        </View>
        <Text style={styles.emptyText}>
          Trend analysis unlocks after a few days of data. Keep checking in daily.
        </Text>
      </View>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title}>RECOVERY TREND · 7 DAYS</Text>
        <TrendBadge direction={trend.direction} delta={trend.delta} />
      </View>

      {/* Sparkline */}
      <View style={styles.chartContainer}>
        <Sparkline scores={trend.scores} width={260} height={44} />
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {['7d', '6d', '5d', '4d', '3d', '2d', 'Today'].slice(
          7 - trend.scores.length,
        ).map((label, i) => (
          <Text
            key={i}
            style={[
              styles.dayLabel,
              i === trend.scores.length - 1 && styles.dayLabelToday,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Per-component pills */}
      <ComponentPills components={trend.components} />

      {/* Insight line */}
      <Text style={styles.insight}>{trend.insight}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    padding:         spacing[4],   // 16
    gap:             spacing[3],   // 12
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  title: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    color:         colors.text.secondary,
    letterSpacing: 0.8,
  },

  // Badge
  badge: {
    borderRadius:      radius.sm,
    paddingHorizontal: spacing[2],   // 8
    paddingVertical:   2,
  },
  badgeText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },

  // Sparkline
  chartContainer: {
    height:   44,
    overflow: 'hidden',
  },

  // Day labels
  dayLabels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      -spacing[1],   // -4
  },
  dayLabel: {
    fontSize:  9,
    color:     colors.text.tertiary,
    textAlign: 'center',
    flex:      1,
  },
  dayLabelToday: {
    color:      colors.text.secondary,
    fontWeight: fontWeight.medium,
  },

  // Component pills
  pills: {
    flexDirection: 'row',
    gap:           spacing[2],   // 8
    flexWrap:      'wrap',
    marginTop:     spacing[1],   // 4
  },
  pill: {
    borderRadius:      radius.sm,
    paddingHorizontal: spacing[2],   // 8
    paddingVertical:   2,
    backgroundColor:   colors.bg.elevated,
  },
  pillText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Insight
  insight: {
    fontSize:   fontSize.sm,
    color:      colors.text.secondary,
    lineHeight: 18,
    marginTop:  spacing[1],   // 4
  },

  // Loading / empty
  skeletonChart: {
    height:          44,
    borderRadius:    radius.sm,
    backgroundColor: colors.bg.elevated,
  },
  skeletonLine: {
    height:          12,
    width:           '70%',
    borderRadius:    radius.sm,
    backgroundColor: colors.bg.elevated,
    marginTop:       spacing[1],   // 4
  },
  emptyText: {
    fontSize:   fontSize.sm,
    color:      colors.text.tertiary,
    lineHeight: 18,
  },
});
