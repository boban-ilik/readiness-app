/**
 * ForecastStrip
 *
 * Horizontal row of 3 cards showing the 3-day directional readiness forecast.
 * Each card leads with a training recommendation pill so users can answer
 * "should I train hard on this day?" at a glance, then shows the score,
 * the actionable key-factor coaching line, and a compact range note.
 */

import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState } from 'react';
import { colors, fontSize, fontWeight, spacing, radius, getScoreColor } from '@constants/theme';
import type { ReadinessForecast, DayForecast } from '@services/readinessForecast';

interface Props {
  forecast: ReadinessForecast;
}

// ─── Training recommendation ──────────────────────────────────────────────────
// Derived purely from score — turns the number into a plain-English directive.

type TrainingRec = 'push' | 'moderate' | 'rest';

function trainingRec(score: number): TrainingRec {
  if (score >= 75) return 'push';
  if (score >= 52) return 'moderate';
  return 'rest';
}

const REC_META: Record<TrainingRec, { emoji: string; label: string; bg: string; fg: string }> = {
  push:     { emoji: '🟢', label: 'Ready to push',    bg: '#16A34A22', fg: '#4ADE80' },
  moderate: { emoji: '🟡', label: 'Take it easier',   bg: '#CA8A0422', fg: '#FCD34D' },
  rest:     { emoji: '🔴', label: 'Prioritise rest',  bg: '#DC262622', fg: '#F87171' },
};

function TrainingPill({ score }: { score: number }) {
  const rec  = trainingRec(score);
  const meta = REC_META[rec];
  return (
    <View style={[pillStyles.pill, { backgroundColor: meta.bg }]}>
      <Text style={pillStyles.emoji}>{meta.emoji}</Text>
      <Text style={[pillStyles.label, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical:   spacing[1],
    borderRadius:      radius.full,
    alignSelf:         'flex-start',
  },
  emoji: { fontSize: 10 },
  label: {
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.2,
  },
});

// ─── Trend badge ──────────────────────────────────────────────────────────────

const TREND_META: Record<DayForecast['trend'], { arrow: string; label: string; fg: string; bg: string }> = {
  up:   { arrow: '↑', label: 'Rising',  fg: '#4ADE80', bg: '#16A34A22' },
  down: { arrow: '↓', label: 'Dropping', fg: '#F87171', bg: '#DC262622' },
  flat: { arrow: '→', label: 'Stable',  fg: colors.text.tertiary, bg: colors.bg.elevated },
};

function TrendBadge({ trend }: { trend: DayForecast['trend'] }) {
  const meta = TREND_META[trend];
  return (
    <View style={[trendStyles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[trendStyles.text, { color: meta.fg }]}>
        {meta.arrow} {meta.label}
      </Text>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
    borderRadius:      99,
  },
  text: {
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.2,
  },
});

function ConfidenceBadge({ confidence }: { confidence: DayForecast['confidence'] }) {
  const meta = confidence === 'high'
    ? { label: 'Higher confidence', fg: '#86EFAC', bg: '#14532D55' }
    : confidence === 'medium'
    ? { label: 'Moderate confidence', fg: '#FCD34D', bg: '#713F1255' }
    : { label: 'Lower confidence', fg: colors.text.tertiary, bg: colors.bg.elevated };

  return (
    <View style={[trendStyles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[trendStyles.text, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  const isFlat = Math.abs(delta) < 3;
  const isUp = delta > 0;
  const bg = isFlat ? colors.bg.elevated : isUp ? '#16A34A22' : '#DC262622';
  const fg = isFlat ? colors.text.tertiary : isUp ? '#4ADE80' : '#F87171';
  const label = isFlat ? 'Steady' : `${isUp ? '+' : ''}${delta}`;

  return (
    <View style={[trendStyles.pill, { backgroundColor: bg }]}>
      <Text style={[trendStyles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Forecast card ────────────────────────────────────────────────────────────

function ForecastCard({
  day,
  index,
  previousScore,
  cardHeight,
  onMeasure,
}: {
  day: DayForecast;
  index: number;
  previousScore: number;
  cardHeight?: number;
  onMeasure: (event: LayoutChangeEvent) => void;
}) {
  const scoreColor = getScoreColor(day.score);
  const delta = day.score - previousScore;
  const opacity    = day.confidence === 'low' ? 0.75 : 1;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
      <View style={[styles.card, cardHeight ? { height: cardHeight } : null, { opacity }]} onLayout={onMeasure}>

        {/* Score-coloured top accent */}
        <View style={[styles.accent, { backgroundColor: scoreColor }]} />

        {/* Row 1: day labels + confidence */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayLabel}>{day.dateLabel}</Text>
            <Text style={styles.relLabel}>{day.label}</Text>
          </View>
          <ConfidenceBadge confidence={day.confidence} />
        </View>

        <View style={styles.scoreRow}>
          <View>
            <Text style={[styles.score, { color: scoreColor }]}>{day.score}</Text>
            <Text style={styles.scoreCaption}>Projected readiness</Text>
          </View>
          <View style={styles.scoreMeta}>
            <TrendBadge trend={day.trend} />
            <DeltaPill delta={delta} />
          </View>
        </View>

        <TrainingPill score={day.score} />

        <View style={styles.factorBox}>
          <Text style={styles.factorLabel}>Main driver</Text>
          <Text style={styles.factor}>{day.keyFactor}</Text>
        </View>

        <Text style={styles.rangeNote}>
          Likely range {day.range[0]}–{day.range[1]}
        </Text>

      </View>
    </Animated.View>
  );
}

// ─── Strip ────────────────────────────────────────────────────────────────────

export default function ForecastStrip({ forecast }: Props) {
  const [cardHeight, setCardHeight] = useState(0);
  const bestDay = [...forecast].sort((a, b) => b.score - a.score)[0];
  const easiestDay = [...forecast].sort((a, b) => a.score - b.score)[0];

  function handleMeasure(event: LayoutChangeEvent) {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setCardHeight(prev => (nextHeight > prev ? nextHeight : prev));
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryEyebrow}>Best window</Text>
          <Text style={styles.summaryTitle}>
            {bestDay.dateLabel} looks strongest at {bestDay.score}
          </Text>
        </View>
        <Text style={styles.summaryBody}>
          Plan your hardest work around {bestDay.label.toLowerCase()}, and keep {easiestDay.dateLabel} more conservative if you need a lighter day.
        </Text>
      </View>
      <Text style={styles.sectionNote}>
        Directional estimate based on recent patterns and load
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {forecast.map((day, i) => (
          <ForecastCard
            key={i}
            day={day}
            index={i}
            previousScore={i === 0 ? forecast[0].score : forecast[i - 1].score}
            cardHeight={cardHeight || undefined}
            onMeasure={handleMeasure}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[2],
  },
  summaryCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  summaryHeader: {
    gap: spacing[1],
  },
  summaryEyebrow: {
    fontSize: 10,
    color: colors.text.accent,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  summaryBody: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionNote: {
    fontSize:          10,
    color:             colors.text.tertiary,
    opacity:           0.75,
    paddingHorizontal: spacing[1],
  },
  strip: {
    gap:          spacing[3],
    paddingRight: spacing[2],
  },
  card: {
    width:           192,
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.lg,
    padding:         spacing[4],
    paddingTop:      spacing[3],
    gap:             spacing[2],
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    overflow:        'hidden',
  },
  accent: {
    position:     'absolute',
    top:          0,
    left:         0,
    right:        0,
    height:       3,
    borderRadius: 0,
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginTop:      spacing[2],
  },
  dayLabel: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  relLabel: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    marginTop: 1,
  },
  score: {
    fontSize:   28,
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  scoreCaption: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  scoreMeta: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },

  // Key factor gets a subtle inset treatment so it reads as "the reason"
  factorBox: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical:   spacing[1.5],
    borderLeftWidth:   2,
    borderLeftColor:   colors.border.default,
    gap: spacing[1],
  },
  factorLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factor: {
    fontSize:   fontSize.xs,
    color:      colors.text.secondary,
    lineHeight: 17,
  },

  rangeNote: {
    fontSize: 10,
    color:    colors.text.tertiary,
    opacity:  0.7,
  },
});
