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
  onAnswer:   (option: CheckOption) => void;
  onDismiss:  () => void;
  onAskCoach: () => void;
}

export default function ReadingCheckCard({ state, onAnswer, onDismiss, onAskCoach }: Props) {
  const { check, answered } = state;
  const options = CHECK_OPTIONS[`${check.metric}_${check.direction}`];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>UNUSUAL FOR YOU</Text>
        {!answered && (
          <TouchableOpacity onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.question}>{checkQuestion(check)}</Text>

      {answered ? (
        <>
          <View style={styles.answerRow}>
            <Text style={styles.answerChip}>{answered.label}</Text>
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
                style={styles.chip}
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
  card: {
    marginHorizontal: spacing[4],
    marginBottom:     spacing[3],
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
    marginBottom:  spacing[2],
  },
  answerChip: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius:      radius.full,
    backgroundColor:   colors.info,
    color:             colors.text.primary,
    fontSize:          fontSize.sm,
    fontWeight:        fontWeight.semiBold,
    overflow:          'hidden',
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
