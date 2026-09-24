/**
 * How today's score was calculated
 *
 * The open score model, free for every user: each component worked out with
 * the user's own numbers. Text comes from utils/scoreMath.ts, which reads the
 * same explanation object the score was computed from.
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, getScoreColor } from '@constants/theme';
import { useScoreSnapshot } from '@hooks/useScoreSnapshot';
import { buildScoreMath, type MathSection } from '@utils/scoreMath';

function SectionCard({ section }: { section: MathSection }) {
  const isTotal = section.key === 'total';
  return (
    <View style={[styles.card, isTotal && styles.totalCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          {section.weight && <Text style={styles.cardWeight}>{section.weight}</Text>}
        </View>
        {section.result !== undefined && (
          <Text style={[styles.cardResult, isTotal && { color: getScoreColor(section.result), fontSize: fontSize['3xl'] }]}>
            {section.result}
          </Text>
        )}
      </View>
      {section.lines.map((line, i) => (
        <Text key={i} style={[styles.line, isTotal && styles.totalLine]}>{line}</Text>
      ))}
    </View>
  );
}

export default function ScoreMathScreen() {
  const router = useRouter();
  const snap   = useScoreSnapshot();

  const sections = snap
    ? buildScoreMath({
        explanation:         snap.explanation,
        hrvBaseline:         snap.hrvBaseline,
        rhrBaseline:         snap.rhrBaseline,
        hrvBaselineAllMonth: snap.hrvBaselineAllMonth,
        rhrBaselineAllMonth: snap.rhrBaselineAllMonth,
        cycle:               snap.cycle,
        uncorrectedScore:    snap.uncorrectedScore,
      })
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The math</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How today's score was calculated</Text>
        <Text style={styles.intro}>
          Every number below is the one your score used this morning. The formula is the same for everyone. The baselines are yours.
        </Text>

        {snap === null ? (
          <View style={styles.card}>
            <Text style={styles.line}>
              Open Today first so there is a score to explain, then come back here.
            </Text>
          </View>
        ) : (
          sections.map(s => <SectionCard key={s.key} section={s} />)
        )}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Where the weights come from</Text>
          <Text style={styles.noteText}>
            The weights are a reasoned starting point from the sports-science literature, not a clinical finding. A trend over a week tells you more than a two-point change between days. Readiness is a training aid, not a medical device.
          </Text>
          <TouchableOpacity onPress={() => router.push('/sources')} accessibilityRole="link">
            <Text style={styles.noteLink}>See the sources ›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  back:         { color: colors.text.accent, fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  headerTitle:  { color: colors.text.primary, fontSize: fontSize.md, fontWeight: fontWeight.semiBold },
  headerSpacer: { width: 52 },

  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[4],
  },

  title: {
    color:      colors.text.primary,
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  intro: {
    color:      colors.text.secondary,
    fontSize:   fontSize.base,
    lineHeight: 23,
    marginBottom: spacing[2],
  },

  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    padding:         spacing[4],
    gap:             spacing[2],
  },
  totalCard: {
    backgroundColor: colors.bg.tertiary,
    borderColor:     colors.border.default,
  },
  cardHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[1],
  },
  cardTitleBlock: { gap: 2, flexShrink: 1 },
  cardTitle: {
    color:      colors.text.primary,
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semiBold,
  },
  cardWeight: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    letterSpacing: 0.3,
  },
  cardResult: {
    color:       colors.text.primary,
    fontSize:    fontSize['2xl'],
    fontWeight:  fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  line: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  totalLine: { color: colors.text.primary },

  note: {
    marginTop: spacing[2],
    gap:       spacing[2],
  },
  noteTitle: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  noteText:  { color: colors.text.secondary, fontSize: fontSize.sm, lineHeight: 21 },
  noteLink:  { color: colors.text.accent, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
});
