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
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, fontWeight, spacing, surface, typography, getScoreColor } from '@constants/theme';
import { forecastBaseline, type ReadinessForecast, type DayForecast } from '@services/readinessForecast';
import { useForecastTrackRecord, TRACK_RECORD_DAYS } from '@hooks/useForecastTrackRecord';
import { trackRecordLine } from '@utils/forecastTrackRecord';

interface Props {
  forecast: ReadinessForecast;
  /** Today's actual score, the baseline the first forecast day is measured from */
  todayScore: number;
  /** Recovering from illness: no "Ready to push" and no best window */
  illnessCap?: boolean;
}

// ─── Training recommendation ──────────────────────────────────────────────────
// Derived purely from score — turns the number into a plain-English directive.

type TrainingRec = 'push' | 'moderate' | 'rest';

// Aligned with getScoreLabel's app-wide bands: 61–80 reads "Good to Go", so a
// projected 72 must not carry a "Take it easier" chip while the driver text
// says to run the planned session.
function trainingRec(score: number): TrainingRec {
  if (score >= 61) return 'push';
  if (score >= 41) return 'moderate';
  return 'rest';
}

// Status lines on the forecast cards are plain text with a dot or an arrow.
// They are computed, so nothing here is drawn as a pill that looks tappable.

const REC_META: Record<TrainingRec, { label: string; fg: string }> = {
  push:     { label: 'Ready to push',   fg: colors.score.good },
  moderate: { label: 'Take it easier',  fg: colors.score.fair },
  rest:     { label: 'Prioritise rest', fg: colors.score.poor },
};

function TrainingPill({ score, capped }: { score: number; capped: boolean }) {
  const raw  = trainingRec(score);
  const rec  = capped && raw === 'push' ? 'moderate' : raw;
  const meta = REC_META[rec];
  return (
    <View style={statusStyles.row}>
      <View style={[statusStyles.dot, { backgroundColor: meta.fg }]} />
      <Text style={[statusStyles.strong, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

// ─── Trend badge ──────────────────────────────────────────────────────────────

const TREND_META: Record<DayForecast['trend'], { icon: 'arrow-up' | 'arrow-down' | 'remove'; label: string; fg: string }> = {
  up:   { icon: 'arrow-up',   label: 'Rising',   fg: colors.score.good },
  down: { icon: 'arrow-down', label: 'Dropping', fg: colors.score.poor },
  flat: { icon: 'remove',     label: 'Stable',   fg: colors.text.tertiary },
};

function TrendBadge({ trend }: { trend: DayForecast['trend'] }) {
  const meta = TREND_META[trend];
  return (
    <View style={statusStyles.row}>
      <Ionicons name={meta.icon} size={12} color={meta.fg} />
      <Text style={[statusStyles.strong, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

function ConfidenceBadge({ confidence }: { confidence: DayForecast['confidence'] }) {
  const label = confidence === 'high'   ? 'Higher confidence'
              : confidence === 'medium' ? 'Moderate confidence'
              :                           'Lower confidence';
  return <Text style={statusStyles.quiet}>{label}</Text>;
}

function DeltaPill({ delta }: { delta: number }) {
  const isFlat = Math.abs(delta) < 3;
  const isUp = delta > 0;
  const fg = isFlat ? colors.text.tertiary : isUp ? colors.score.good : colors.score.poor;
  const label = isFlat ? 'Steady' : `${isUp ? '+' : ''}${delta}`;
  return <Text style={[statusStyles.strong, { color: fg }]}>{label}</Text>;
}

const statusStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginRight:  2,
  },
  strong: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  quiet: {
    fontSize: fontSize['2xs'],
    color:    colors.text.tertiary,
  },
});

// ─── Forecast card ────────────────────────────────────────────────────────────

function ForecastCard({
  day,
  index,
  baselineScore,
  illnessCap,
}: {
  day: DayForecast;
  index: number;
  baselineScore: number;
  illnessCap: boolean;
}) {
  const scoreColor = getScoreColor(day.score);
  const delta = day.score - baselineScore;
  const opacity    = day.confidence === 'low' ? 0.75 : 1;

  return (
    // Equal heights come from the row itself: it stretches every wrapper to the
    // tallest card and the card grows to fill its wrapper. The old approach
    // measured the tallest card into state that could only grow and fed it
    // back as a fixed height, so one oversized measurement stuck for good and
    // the cards ballooned to several screens tall.
    <Animated.View style={styles.cardWrap} entering={FadeInDown.delay(index * 100).duration(400).springify()}>
      <View style={[styles.card, { opacity }]}>

        {/* Row 1: day labels + confidence */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayLabel}>{day.dateLabel}</Text>
            <Text style={styles.relLabel}>{day.label}</Text>
          </View>
          <ConfidenceBadge confidence={day.confidence} />
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: scoreColor }]}>{day.score}</Text>
            <Text style={styles.scoreCaption}>Projected readiness</Text>
          </View>
          <View style={styles.scoreMeta}>
            <TrendBadge trend={day.trend} />
            <DeltaPill delta={delta} />
          </View>
        </View>

        <TrainingPill score={day.score} capped={illnessCap} />

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

export default function ForecastStrip({ forecast, todayScore, illnessCap = false }: Props) {
  // What the day-ahead forecast got right lately: a forecast nobody can check
  // is a guess with a number on it.
  const record = useForecastTrackRecord();
  // Take both ends of one sort. Sorting twice returned the same element when
  // every day scored alike — a stable sort preserves the original order — which
  // produced "Thursday looks strongest ... keep Thursday more conservative".
  const ranked     = [...forecast].sort((a, b) => b.score - a.score);
  const bestDay    = ranked[0];
  const easiestDay = ranked[ranked.length - 1];

  // Day-one predictions carry ±5, later days more. A gap smaller than that
  // isn't a real difference, so naming a "best window" from it would send
  // someone to train hard on an arbitrary day.
  const MEANINGFUL_SPREAD = 5;
  const hasStandout =
    bestDay !== easiestDay && bestDay.score - easiestDay.score >= MEANINGFUL_SPREAD;

  return (
    <View style={styles.wrapper}>
      <View style={styles.summaryCard}>
        {illnessCap ? (
          <>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEyebrow}>Recovering from illness</Text>
              <Text style={styles.summaryTitle}>Keep all three days easy</Text>
            </View>
            <Text style={styles.summaryBody}>
              Your resting heart rate or HRV is not back to where it was before you were sick.
              Hard sessions wait until they are, even if the projected score rises first.
            </Text>
          </>
        ) : hasStandout ? (
          <>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEyebrow}>Best window</Text>
              <Text style={styles.summaryTitle}>
                {bestDay.dateLabelLong} looks strongest at {bestDay.score}
              </Text>
            </View>
            <Text style={styles.summaryBody}>
              Plan your hardest work around {bestDay.label.toLowerCase()}, and keep {easiestDay.dateLabelLong} more conservative if you need a lighter day.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEyebrow}>Steady ahead</Text>
              <Text style={styles.summaryTitle}>
                No standout day, readiness holds near {bestDay.score}
              </Text>
            </View>
            <Text style={styles.summaryBody}>
              Nothing ahead separates itself by more than the forecast's own margin
              of error. Train to your plan, and let how you feel on the day set the
              intensity.
            </Text>
          </>
        )}
      </View>
      <Text style={styles.sectionNote}>
        Directional estimate based on recent patterns and load
        {record ? `. ${trackRecordLine(record, TRACK_RECORD_DAYS)}` : ''}
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
            baselineScore={forecastBaseline(forecast, i, todayScore)}
            illnessCap={illnessCap}
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
    ...surface.card,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[4],
    gap:               spacing[2],
  },
  summaryHeader: {
    gap: spacing[1],
  },
  summaryEyebrow: {
    ...typography.label,
    color: colors.text.accent,
  },
  summaryTitle: {
    fontFamily:    fontFamily.heading,
    fontSize:      fontSize.md,
    letterSpacing: -0.3,
    color:         colors.text.primary,
  },
  summaryBody: {
    ...typography.caption,
    fontSize:   fontSize.sm,
    lineHeight: 21,
  },
  sectionNote: {
    fontSize:          fontSize['2xs'],
    color:             colors.text.tertiary,
    paddingHorizontal: spacing[1],
  },
  strip: {
    gap:          spacing[3],
    paddingRight: spacing[2],
    alignItems:   'stretch',
  },
  cardWrap: {
    alignSelf: 'stretch',
  },
  card: {
    ...surface.card,
    flexGrow: 1,
    width:    192,
    padding:  spacing[4],
    gap:      spacing[2.5],
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    // The card is a fixed 192 wide: with the larger 1.0.4 text (or iOS
    // Larger Text) "Moderate confidence" no longer fits beside the day name
    // and was cropped. Let the line drop under it instead.
    flexWrap:       'wrap',
    columnGap:      spacing[2],
    rowGap:         spacing[1],
  },
  dayLabel: {
    ...typography.title,
  },
  relLabel: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    marginTop: 1,
  },
  score: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize['2xl'],
    letterSpacing: -0.5,
    lineHeight:    34,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  scoreCaption: {
    fontSize: fontSize['2xs'],
    color: colors.text.tertiary,
    marginTop: 2,
  },
  // The card is 192 wide: "Projected readiness" plus "Dropping" does not fit
  // on one line, so the caption wraps and the status lines never clip.
  scoreBlock: {
    flexShrink: 1,
  },
  scoreMeta: {
    flexShrink: 0,
    alignItems: 'flex-end',
    gap: spacing[1],
  },

  // The reason behind the number: ruled off, not boxed
  factorBox: {
    flexGrow:       1,
    paddingTop:     spacing[2.5],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap:            spacing[1],
  },
  factorLabel: {
    ...typography.label,
    letterSpacing: 1.2,
  },
  factor: {
    ...typography.caption,
  },

  rangeNote: {
    fontSize: fontSize['2xs'],
    color:    colors.text.tertiary,
  },
});
