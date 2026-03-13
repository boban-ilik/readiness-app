/**
 * ForecastStrip
 *
 * Horizontal row of 3 cards showing the 3-day directional readiness forecast.
 * Each card leads with a training recommendation pill so users can answer
 * "should I train hard on this day?" at a glance, then shows the score,
 * the actionable key-factor coaching line, and a compact range note.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

// ─── Forecast card ────────────────────────────────────────────────────────────

function ForecastCard({ day, index }: { day: DayForecast; index: number }) {
  const scoreColor = getScoreColor(day.score);
  // Day 3 is inherently less certain — subtle opacity cue, not a confusing label
  const opacity    = day.confidence === 'low' ? 0.75 : 1;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
      <View style={[styles.card, { opacity }]}>

        {/* Score-coloured top accent */}
        <View style={[styles.accent, { backgroundColor: scoreColor }]} />

        {/* Row 1: day labels + trend badge */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayLabel}>{day.dateLabel}</Text>
            <Text style={styles.relLabel}>{day.label}</Text>
          </View>
          <TrendBadge trend={day.trend} />
        </View>

        {/* Row 2: training recommendation pill */}
        <TrainingPill score={day.score} />

        {/* Row 3: score */}
        <Text style={[styles.score, { color: scoreColor }]}>{day.score}</Text>

        {/* Row 4: key factor — the most actionable text, given prominence */}
        <View style={styles.factorBox}>
          <Text style={styles.factor}>{day.keyFactor}</Text>
        </View>

        {/* Row 5: compact range note */}
        <Text style={styles.rangeNote}>
          Expected range: {day.range[0]}–{day.range[1]}
          {day.confidence === 'low' ? '  ·  less certain' : ''}
        </Text>

      </View>
    </Animated.View>
  );
}

// ─── Strip ────────────────────────────────────────────────────────────────────

export default function ForecastStrip({ forecast }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionNote}>
        Directional estimate · tap the ring to ask your coach about any day
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {forecast.map((day, i) => (
          <ForecastCard key={i} day={day} index={i} />
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

  // Key factor gets a subtle inset treatment so it reads as "the reason"
  factorBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical:   spacing[1.5],
    borderLeftWidth:   2,
    borderLeftColor:   colors.border.default,
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
