/**
 * TrainingLoadCard
 *
 * Displays today's training prescription derived from the readiness score.
 * This is the primary free action on Today, so users can act on their score
 * before they decide whether they need the deeper Pro analysis.
 *
 * Props:
 *   score      — today's overall readiness score (0–100)
 *   components — recovery / sleep / stress sub-scores
 *   illnessCap — hold the call at Easy Day while recovering from illness
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { getTrainingRecommendation } from '@utils/training';
import type { ReadinessResult } from '@utils/readiness';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingLoadCardProps {
  score:      number;
  components: ReadinessResult['components'];
  illnessCap?: boolean;
  /** Render as a row inside TodayPlanCard: no card chrome of its own. */
  flat?:       boolean;
}

// ─── Zone badge ───────────────────────────────────────────────────────────────

function ZoneBadge({ zone, color }: { zone: number; color: string }) {
  const label = zone === 0 ? 'REST' : `Z${zone}`;
  return (
    <View style={[styles.zoneBadge, { borderColor: color }]}>
      <Text style={[styles.zoneLabel, { color }]}>{label}</Text>
    </View>
  );
}

/** First sentence only, for the one-line reason; the full text is behind the tap. */
function firstSentence(text: string): string {
  const i = text.indexOf('. ');
  return i === -1 ? text : text.slice(0, i + 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingLoadCard({
  score,
  components,
  illnessCap = false,
  flat = false,
}: TrainingLoadCardProps) {
  const rec = getTrainingRecommendation(score, components, { illnessCap });
  const [showWhy, setShowWhy] = useState(false);

  const durationText =
    rec.durationMin === 0
      ? 'Rest today'
      : `${rec.durationMin}–${rec.durationMax} min`;

  const isRest = rec.durationMin === 0;

  return (
    <View style={flat ? styles.flat : styles.card}>

      {/* ── Top row: zone badge + headline ── */}
      <View style={styles.topRow}>
        <ZoneBadge zone={rec.zone} color={rec.zoneColor} />

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>{rec.headline}</Text>
          <Text style={[styles.zoneName, { color: rec.zoneColor }]}>
            {rec.zoneName}
          </Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Short lines to act on; the explanation is behind the Why line ── */}
      <View style={styles.lines}>
        <Text style={styles.line}>⏱  {isRest ? 'Rest today' : `${durationText} · effort ${rec.rpe}/10`}</Text>
        <Text style={styles.line}>🏃  {rec.doThis}</Text>
        <TouchableOpacity
          onPress={() => setShowWhy(v => !v)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: showWhy }}
        >
          <Text style={styles.whyLine}>
            <Text style={[styles.whyLabel, { color: rec.zoneColor }]}>Why: </Text>
            {firstSentence(rec.rationale)} <Text style={{ color: rec.zoneColor }}>{showWhy ? '▲' : '›'}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {showWhy && (
        <>
          <Text style={styles.sectionBody}>{rec.rationale}</Text>
          {!isRest && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WHAT {rec.rpe}/10 FEELS LIKE</Text>
              <Text style={styles.sectionBody}>{rec.effortDescription}</Text>
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{isRest ? 'TODAY' : 'IDEAS'}</Text>
            <Text style={styles.sectionBody}>{rec.suggestedActivities}</Text>
          </View>
        </>
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {illnessCap ? 'Held at Easy Day while you recover' : "Based on today's readiness score"}
        </Text>
        <View style={[styles.scoreDot, { backgroundColor: rec.zoneColor }]} />
        <Text style={[styles.footerScore, { color: rec.zoneColor }]}>
          {score}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  lines: { gap: spacing[2] },
  line: {
    fontSize:   fontSize.base,
    lineHeight: 22,
    color:      colors.text.primary,
  },
  whyLine: {
    fontSize:   fontSize.sm,
    lineHeight: 20,
    color:      colors.text.secondary,
  },
  whyLabel: { fontWeight: fontWeight.semiBold },
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  flat: {
    gap: spacing[3],
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },

  // Zone badge
  zoneBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
    flexShrink: 0,
  },
  zoneLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // Headline block
  headlineBlock: {
    flex: 1,
    gap: spacing[0.5],
  },
  headline: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  zoneName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },



  // Section (activities + rationale)
  section: {
    gap: spacing[1.5],
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  sectionBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  footerText: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  footerScore: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
});
