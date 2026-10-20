/**
 * TrendInsightCard
 *
 * Pro-only home screen card that shows a 7-day readiness sparkline,
 * a trend direction indicator, and a one-line personalised insight.
 *
 * Layout:
 *  ┌──────────────────────────────────────────┐
 *  │  READINESS TREND · 7 DAYS        ↑ +8.2  │
 *  │  ▂▃▄▄▅▆▇  (sparkline bars)             │
 *  │  Recovery trending up — good window…    │
 *  └──────────────────────────────────────────┘
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTrendData, type TrendDirection } from '@hooks/useTrendData';
import TrendChartModal from '@components/score/TrendChartModal';
import { markFeatureOpened } from '@services/openedFeatures';
import { stripBarHeight } from '@utils/trendChart';
import type { ReadinessForecast } from '@services/readinessForecast';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  getScoreColor,
} from '@constants/theme';

/** "Today", "1d", "2d"... counted in local calendar days. */
function daysAgoLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const now = new Date();
  const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 86_400_000);
  return days <= 0 ? 'Today' : `${days}d`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  scores: number[];
  width:  number;
  height: number;
}

function Sparkline({ scores, width, height }: SparklineProps) {
  if (scores.length === 0) return null;

  // One equal column per day, the same columns the labels below use, so each
  // bar sits above its own label. The strip used to be a fixed 260 wide while
  // the labels spread across the card, which left "Today" with no bar.
  const barCount = scores.length;
  const colW     = width / barCount;
  const inset    = 3;
  const barW     = Math.max(2, colW - inset * 2);

  return (
    <Svg width={width} height={height}>
      {scores.map((s, i) => {
        // Fixed 30 to 100 scale: scaling from the week's lowest score drew a
        // 59 as a sliver, as if it were near zero.
        const barH  = stripBarHeight(s, height);
        const x     = i * colW + inset;
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

export default function TrendInsightCard({ forecast = null }: { forecast?: ReadinessForecast | null }) {
  const { trend, isLoading, error } = useTrendData();
  const [stripWidth, setStripWidth] = useState(0);
  const [chartOpen, setChartOpen]   = useState(false);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>READINESS TREND · 7 DAYS</Text>
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
          <Text style={styles.title}>READINESS TREND · 7 DAYS</Text>
        </View>
        <Text style={styles.emptyText}>
          Trend analysis unlocks after a few days of data. Keep checking in daily.
        </Text>
      </View>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { setChartOpen(true); markFeatureOpened('trend'); }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Open the readiness trend chart"
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title}>READINESS TREND · 7 DAYS</Text>
        <TrendBadge direction={trend.direction} delta={trend.delta} />
      </View>

      {/* Sparkline */}
      <View
        style={styles.chartContainer}
        onLayout={e => setStripWidth(Math.floor(e.nativeEvent.layout.width))}
      >
        {stripWidth > 0 && <Sparkline scores={trend.scores} width={stripWidth} height={44} />}
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {/* Labelled from each score's real date: the old fixed list assumed
            no missed days and that the newest score was today's. */}
        {trend.dates.map((date, i) => (
          <Text
            key={date}
            style={[
              styles.dayLabel,
              daysAgoLabel(date) === 'Today' && styles.dayLabelToday,
            ]}
          >
            {daysAgoLabel(date)}
          </Text>
        ))}
      </View>

      {/* Per-component pills */}
      <ComponentPills components={trend.components} />

      {/* Insight line */}
      <Text style={styles.insight}>{trend.insight}</Text>

      <Text style={styles.chartHint}>
        {forecast ? 'See the chart and the next 3 days ›' : 'See the chart ›'}
      </Text>

      <TrendChartModal
        visible={chartOpen}
        onClose={() => setChartOpen(false)}
        past={trend.scores.map((score, i) => ({ date: trend.dates[i], score }))}
        forecast={(forecast ?? []).map(d => ({ score: d.score, range: d.range }))}
      />
    </TouchableOpacity>
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
    fontSize:  11,
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
  chartHint: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      colors.amber[400],
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
