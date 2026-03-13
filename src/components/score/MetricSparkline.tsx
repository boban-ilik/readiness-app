/**
 * MetricSparkline
 *
 * A 30-day area sparkline for Recovery / Sleep / Stress component scores.
 * Built with react-native-svg — no extra dependencies needed.
 *
 * Visual layers (bottom → top):
 *  1. Fill area under the trend line (score color @ 12% opacity)
 *  2. Trend line (score color, 2px)
 *  3. Dashed 30-day average reference line (grey)
 *  4. Individual day dots at each data point (subtle, 3px)
 *  5. Today's dot highlighted (larger, score color)
 *  6. Today's value label
 *  7. Average value label (inline with dashed line)
 *  8. X-axis date labels (start, midpoint, today)
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, {
  Polygon,
  Polyline,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors, fontSize, fontWeight, spacing } from '@constants/theme';
import type { MetricDataPoint } from '@hooks/useMetricHistory';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:        MetricDataPoint[];
  scoreColor:  string;
  chartWidth:  number;   // pass screenWidth - horizontal padding
  isLoading:   boolean;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CHART_H    = 88;   // px — height of the data area
const PAD_H      = 6;    // horizontal inset so dots don't clip
const PAD_TOP    = 18;   // space for today's value label above the line
const PAD_BOTTOM = 22;   // space for x-axis date labels
const TOTAL_H    = PAD_TOP + CHART_H + PAD_BOTTOM;

const Y_MIN = 0;
const Y_MAX = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MetricSparkline({
  data,
  scoreColor,
  chartWidth,
  isLoading,
}: Props) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.centred, { height: TOTAL_H }]}>
        <ActivityIndicator size="small" color={colors.text.tertiary} />
      </View>
    );
  }

  // ── Not enough data ────────────────────────────────────────────────────────
  // Need at least 3 valid points to draw a meaningful line
  const valid = data.filter(d => d.value !== null) as { date: string; value: number }[];
  if (valid.length < 3) {
    return (
      <View style={[styles.centred, { height: TOTAL_H }]}>
        <Text style={styles.emptyText}>Not enough history yet</Text>
        <Text style={styles.emptySubText}>
          Check back after a few more days of tracking
        </Text>
      </View>
    );
  }

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const n      = valid.length;
  const plotW  = chartWidth - PAD_H * 2;

  function xAt(i: number): number {
    return PAD_H + (i / (n - 1)) * plotW;
  }

  function yAt(v: number): number {
    const clamped = Math.min(Y_MAX, Math.max(Y_MIN, v));
    return PAD_TOP + CHART_H - ((clamped - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_H;
  }

  // ── Path strings ──────────────────────────────────────────────────────────
  const linePoints = valid.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.value).toFixed(1)}`).join(' ');

  const bottomY  = (PAD_TOP + CHART_H).toFixed(1);
  const firstX   = xAt(0).toFixed(1);
  const lastX    = xAt(n - 1).toFixed(1);
  const fillPts  = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;

  // ── Statistics ────────────────────────────────────────────────────────────
  const avg   = valid.reduce((s, d) => s + d.value, 0) / n;
  const avgY  = yAt(avg);

  const today     = valid[n - 1];
  const todayX    = xAt(n - 1);
  const todayY    = yAt(today.value);
  const todayUp   = todayY < avgY; // label goes above dot if score is above avg

  // ── X-axis labels ─────────────────────────────────────────────────────────
  const midIdx = Math.floor((n - 1) / 2);
  const xLabels = [
    { i: 0,      label: shortDate(valid[0].date),      anchor: 'start'  as const },
    { i: midIdx, label: shortDate(valid[midIdx].date), anchor: 'middle' as const },
    { i: n - 1,  label: 'Today',                       anchor: 'end'    as const },
  ];

  // Avg label position — sits just left of the dashed line, vertically centred
  const avgLabelY = avgY - 3;

  return (
    <View>
      <Svg width={chartWidth} height={TOTAL_H}>

        {/* ── Fill area ── */}
        <Polygon
          points={fillPts}
          fill={scoreColor}
          fillOpacity={0.12}
        />

        {/* ── Trend line ── */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={scoreColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Average reference (dashed) ── */}
        <Line
          x1={PAD_H}
          y1={avgY}
          x2={chartWidth - PAD_H}
          y2={avgY}
          stroke={colors.text.tertiary}
          strokeWidth={1}
          strokeDasharray="4,4"
          strokeOpacity={0.35}
        />

        {/* ── Avg value label (left side, inline with dashed line) ── */}
        <SvgText
          x={PAD_H + 2}
          y={avgLabelY}
          fontSize={9}
          fill={colors.text.tertiary}
          fillOpacity={0.55}
        >
          avg {Math.round(avg)}
        </SvgText>

        {/* ── Small dots for each data point ── */}
        {valid.map((d, i) => (
          i === n - 1 ? null : ( // today gets its own larger dot below
            <Circle
              key={i}
              cx={xAt(i)}
              cy={yAt(d.value)}
              r={2.5}
              fill={scoreColor}
              fillOpacity={0.4}
            />
          )
        ))}

        {/* ── Today dot (prominent) ── */}
        <Circle
          cx={todayX}
          cy={todayY}
          r={5.5}
          fill={scoreColor}
          stroke={colors.bg.secondary}
          strokeWidth={2}
        />

        {/* ── Today value label ── */}
        <SvgText
          x={todayX}
          y={todayUp ? todayY - 9 : todayY + 16}
          textAnchor="end"
          fontSize={11}
          fontWeight="600"
          fill={scoreColor}
        >
          {Math.round(today.value)}
        </SvgText>

        {/* ── X-axis date labels ── */}
        {xLabels.map(({ i, label, anchor }) => (
          <SvgText
            key={i}
            x={xAt(i)}
            y={PAD_TOP + CHART_H + 14}
            textAnchor={anchor}
            fontSize={9}
            fill={colors.text.tertiary}
            fillOpacity={0.7}
          >
            {label}
          </SvgText>
        ))}

      </Svg>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centred: {
    justifyContent: 'center',
    alignItems:     'center',
    gap:            spacing[1],
  },
  emptyText: {
    fontSize:  fontSize.sm,
    color:     colors.text.tertiary,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    opacity:   0.6,
    textAlign: 'center',
  },
});
