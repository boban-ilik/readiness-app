/**
 * TrendChartModal
 *
 * Opened from the Weekly Trend card: the last 7 days of readiness as a solid
 * line, then the 3-day forecast as a dashed line with its likely range
 * shaded. The range is drawn on purpose: the forecast is directional, and a
 * bare line would look more certain than it is.
 */

import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { colors, fontSize, fontWeight, spacing, radius, getScoreColor } from '@constants/theme';
import { buildTrendChart, type TrendPoint, type ForecastPoint } from '@utils/trendChart';
import { localDateStr } from '@utils/index';

interface Props {
  visible:  boolean;
  onClose:  () => void;
  past:     TrendPoint[];
  /** Empty when there is no forecast (not enough history, or data missing today) */
  forecast: ForecastPoint[];
}

const HEIGHT = 240;
const PAD = { padLeft: 34, padRight: 14, padTop: 16, padBottom: 30 };
const PROJECTION = '#60A5FA';

function weekday(date: string, long = false): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: long ? 'long' : 'short' });
}

export default function TrendChartModal({ visible, onClose, past, forecast }: Props) {
  const [width, setWidth] = useState(0);
  const today = localDateStr();
  const chart = width > 0 ? buildTrendChart(past, forecast, today, { width, height: HEIGHT, ...PAD }) : null;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));

  const lastPast = chart?.past[chart.past.length - 1];
  const pastPath = chart ? chart.past.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') : '';
  const futurePath = chart && lastPast && chart.future.length
    ? `M${lastPast.x},${lastPast.y} ` + chart.future.map(f => `L${f.x},${f.y}`).join(' ')
    : '';
  // Range band: opens from the last measured point and widens with each day
  const band = chart && lastPast && chart.future.length
    ? [`${lastPast.x},${lastPast.y}`, ...chart.future.map(f => `${f.x},${f.yHigh}`),
       ...[...chart.future].reverse().map(f => `${f.x},${f.yLow}`)].join(' ')
    : '';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <View>
            <Text style={styles.navTitle}>Readiness trend</Text>
            <Text style={styles.navSub}>Last 7 days and the next 3</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card} onLayout={onLayout}>
            {chart && (
              <Svg width={width} height={HEIGHT}>
                {chart.ticks.map(t => (
                  <Line key={t.value} x1={PAD.padLeft} x2={width - PAD.padRight} y1={t.y} y2={t.y}
                        stroke={colors.border.subtle} strokeWidth={1} strokeDasharray="3 5" />
                ))}
                {chart.ticks.map(t => (
                  <SvgText key={`l${t.value}`} x={PAD.padLeft - 8} y={t.y + 4} fontSize={11}
                           fill={colors.text.tertiary} textAnchor="end">{t.value}</SvgText>
                ))}

                {band !== '' && <Polygon points={band} fill={PROJECTION} opacity={0.16} />}
                {futurePath !== '' && (
                  <Path d={futurePath} stroke={PROJECTION} strokeWidth={2.5} strokeDasharray="7 6" fill="none" />
                )}
                <Path d={pastPath} stroke={colors.amber[400]} strokeWidth={2.5} fill="none"
                      strokeLinejoin="round" strokeLinecap="round" />

                {chart.past.map(p => (
                  <Circle key={p.date} cx={p.x} cy={p.y} r={p.date === today ? 6 : 4}
                          fill={getScoreColor(p.score)} stroke={colors.bg.tertiary} strokeWidth={2} />
                ))}
                {chart.future.map(f => (
                  <Circle key={f.date} cx={f.x} cy={f.y} r={4} fill={colors.bg.tertiary}
                          stroke={PROJECTION} strokeWidth={2} />
                ))}

                {chart.past.map(p => (
                  <SvgText key={`x${p.date}`} x={p.x} y={HEIGHT - 8} fontSize={11} textAnchor="middle"
                           fill={p.date === today ? colors.amber[400] : colors.text.tertiary}
                           fontWeight={p.date === today ? '700' : '400'}>
                    {p.date === today ? 'Today' : weekday(p.date)}
                  </SvgText>
                ))}
                {chart.future.map(f => (
                  <SvgText key={`x${f.date}`} x={f.x} y={HEIGHT - 8} fontSize={11} textAnchor="middle" fill={PROJECTION}>
                    {weekday(f.date)}
                  </SvgText>
                ))}
              </Svg>
            )}

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: colors.amber[400] }]} />
                <Text style={styles.legendText}>Measured</Text>
              </View>
              {forecast.length > 0 && (
                <>
                  <View style={styles.legendItem}>
                    {/* An SVG line: a dashed border on a zero-height View drew nothing on device */}
                    <Svg width={18} height={4}>
                      <Line x1={0} y1={2} x2={18} y2={2} stroke={PROJECTION} strokeWidth={2.5} strokeDasharray="5 4" />
                    </Svg>
                    <Text style={styles.legendText}>Projected</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.swatchBand, { backgroundColor: PROJECTION }]} />
                    <Text style={styles.legendText}>Likely range</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {chart && chart.future.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>NEXT 3 DAYS</Text>
              {chart.future.map(f => (
                <View key={f.date} style={styles.row}>
                  <Text style={styles.rowDay}>{weekday(f.date, true)}</Text>
                  <Text style={[styles.rowScore, { color: getScoreColor(f.score) }]}>{f.score}</Text>
                  <Text style={styles.rowRange}>likely {f.low} to {f.high}</Text>
                </View>
              ))}
              <Text style={styles.note}>
                A directional estimate from your recent patterns and training load, not a promise.
                The range widens the further ahead it looks.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.note}>
                There isn't a projection yet. It appears once today has a score and a few days of history.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.bg.primary },
  navBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
  },
  navTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  navSub:   { fontSize: fontSize.sm, color: colors.text.tertiary, marginTop: 2 },
  close:    { fontSize: fontSize.lg, color: colors.text.secondary },
  content:  { paddingHorizontal: spacing[5], paddingBottom: spacing[8], gap: spacing[4] },
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    paddingVertical: spacing[4],
    gap:             spacing[3],
  },
  legend: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               spacing[4],
    paddingHorizontal: spacing[4],
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  legendText:  { fontSize: fontSize.xs, color: colors.text.secondary },
  swatch:      { width: 18, height: 3, borderRadius: 2 },
  swatchBand:  { width: 18, height: 10, borderRadius: 2, opacity: 0.3 },
  sectionLabel: {
    fontSize:          fontSize.xs,
    fontWeight:        fontWeight.semiBold,
    color:             colors.text.secondary,
    letterSpacing:     1.0,
    paddingHorizontal: spacing[4],
  },
  row: {
    flexDirection:     'row',
    alignItems:        'baseline',
    paddingHorizontal: spacing[4],
    gap:               spacing[3],
  },
  rowDay:   { flex: 1, fontSize: fontSize.base, color: colors.text.primary },
  rowScore: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  rowRange: { fontSize: fontSize.sm, color: colors.text.tertiary, minWidth: 110, textAlign: 'right' },
  note: {
    fontSize:          fontSize.sm,
    color:             colors.text.tertiary,
    lineHeight:        21,
    paddingHorizontal: spacing[4],
  },
});
