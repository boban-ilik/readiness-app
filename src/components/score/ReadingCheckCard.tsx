/**
 * ReadingCheckCard
 *
 * Shown on Today when HRV or resting heart rate is well outside the user's
 * own usual range. It asks what changed instead of calling the reading good
 * or bad, then explains the reading in one line once the user answers.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { CHECK_OPTIONS, checkQuestion, type CheckOption } from '@utils/readingCheck';
import type { ReadingCheckState } from '@services/readingCheck';

interface Props {
  state:      ReadingCheckState;
  /** Today's answer while the user is picking a different one */
  changing:   CheckOption | null;
  onAnswer:   (option: CheckOption) => void;
  onChange:   () => void;
  /** Closes the card, or keeps today's answer when one is being changed */
  onDismiss:  () => void;
  onAskCoach: () => void;
}

export default function ReadingCheckCard({ state, changing, onAnswer, onChange, onDismiss, onAskCoach }: Props) {
  const { check, answered } = state;
  const options = CHECK_OPTIONS[`${check.metric}_${check.direction}`];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>UNUSUAL FOR YOU</Text>
        {!answered && (
          <TouchableOpacity onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={changing ? 'Keep my answer' : 'Dismiss'}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.question}>{checkQuestion(check)}</Text>

      {answered ? (
        <>
          <View style={styles.answerRow}>
            <View style={styles.answerChip}>
              <Text style={styles.answerChipText}>{answered.label}</Text>
            </View>
            <TouchableOpacity onPress={onChange} hitSlop={10} accessibilityRole="button" accessibilityLabel="Change my answer">
              <Text style={styles.change}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.reading}>{answered.reading}</Text>
          <TouchableOpacity onPress={onAskCoach} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.link}>Ask your coach about this ›</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.chips}>
            {options.map(o => (
              <TouchableOpacity
                key={o.key}
                style={[styles.chip, changing?.key === o.key && styles.chipCurrent]}
                onPress={() => onAnswer(o)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footnote}>
            Your usual is the middle 80% of your last 30 days. An unusual reading isn't good or bad by itself.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // No side margin: Today's scroll view already insets its content, and a
  // second inset made this card narrower than its neighbours.
  card: {
    marginBottom:     spacing[5],
    borderRadius:     radius.lg,
    borderLeftWidth:  3,
    borderLeftColor:  colors.info,
    backgroundColor:  colors.bg.tertiary,
    padding:          spacing[4],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[2],
  },
  sectionLabel: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    color:         colors.text.secondary,
    letterSpacing: 1.0,
  },
  dismiss: {
    fontSize: fontSize.sm,
    color:    colors.text.tertiary,
  },
  question: {
    fontSize:     fontSize.base,
    fontWeight:   fontWeight.semiBold,
    color:        colors.text.primary,
    lineHeight:   24,
    marginBottom: spacing[3],
  },
  chips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[2],
  },
  chip: {
    paddingVertical:   spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius:      radius.full,
    backgroundColor:   colors.bg.elevated,
  },
  chipText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      colors.text.primary,
  },
  footnote: {
    fontSize:   fontSize.xs,
    color:      colors.text.tertiary,
    lineHeight: 17,
    marginTop:  spacing[3],
  },
  answerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    marginBottom:  spacing[2],
  },
  change: {
    fontSize: fontSize.sm,
    color:    colors.text.tertiary,
  },
  chipCurrent: {
    backgroundColor: colors.info,
  },
  // Background on a View, not on the Text: the rounded Text rendered as an
  // empty gap on device.
  answerChip: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius:      radius.full,
    backgroundColor:   colors.info,
  },
  answerChipText: {
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  reading: {
    fontSize:     fontSize.sm,
    color:        colors.text.secondary,
    lineHeight:   22,
    marginBottom: spacing[3],
  },
  link: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      colors.amber[400],
  },
});
