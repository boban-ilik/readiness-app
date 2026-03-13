/**
 * TrainingLoadCard
 *
 * Displays today's training prescription derived from the readiness score.
 * Sits behind a ProGate on the home screen — free users see the locked preview.
 *
 * Props:
 *   score      — today's overall readiness score (0–100)
 *   components — recovery / sleep / stress sub-scores
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingLoadCard({
  score,
  components,
}: TrainingLoadCardProps) {
  const rec = getTrainingRecommendation(score, components);
  const [effortExpanded, setEffortExpanded] = useState(false);

  const durationText =
    rec.durationMin === 0
      ? 'Rest today'
      : `${rec.durationMin}–${rec.durationMax} min`;

  const isRest = rec.durationMin === 0;

  return (
    <View style={styles.card}>

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

      {/* ── Metric pills: duration + tappable effort ── */}
      <View style={styles.metricsRow}>

        {/* Duration pill */}
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>⏱</Text>
          <Text style={styles.pillText}>{durationText}</Text>
        </View>

        {/* Effort pill — tappable, expands explanation */}
        {!isRest && (
          <TouchableOpacity
            style={[styles.pill, styles.effortPill, effortExpanded && styles.effortPillActive]}
            onPress={() => setEffortExpanded(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={styles.pillIcon}>💥</Text>
            <Text style={[styles.pillText, effortExpanded && styles.effortPillTextActive]}>
              Effort {rec.rpe}/10
            </Text>
            <Text style={[styles.effortChevron, effortExpanded && styles.effortChevronOpen]}>
              ›
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Effort explanation (expanded) ── */}
      {effortExpanded && !isRest && (
        <View style={styles.effortBox}>
          <Text style={styles.effortBoxTitle}>
            What does {rec.rpe}/10 feel like?
          </Text>
          <Text style={styles.effortBoxBody}>{rec.effortDescription}</Text>
          <Text style={styles.effortBoxScale}>
            Scale: 1 = completely at rest · 10 = all-out sprint
          </Text>
        </View>
      )}

      {/* ── What to do ── */}
      {!isRest && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🏃 WHAT TO DO</Text>
          <Text style={styles.sectionBody}>{rec.suggestedActivities}</Text>
        </View>
      )}

      {/* ── Why today? ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WHY TODAY?</Text>
        <Text style={styles.sectionBody}>{rec.rationale}</Text>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Based on today's readiness score</Text>
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
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
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

  // Metric pills row
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillIcon: {
    fontSize: 13,
  },
  pillText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Effort pill — tappable variant
  effortPill: {
    borderColor: colors.border.default,
  },
  effortPillActive: {
    backgroundColor: colors.amber[900] + '44',
    borderColor: colors.amber[500],
  },
  effortPillTextActive: {
    color: colors.amber[400],
  },
  effortChevron: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    marginLeft: spacing[0.5],
    transform: [{ rotate: '0deg' }],
  },
  effortChevronOpen: {
    transform: [{ rotate: '90deg' }],
    color: colors.amber[400],
  },

  // Effort explanation box
  effortBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: colors.amber[500],
  },
  effortBoxTitle: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  effortBoxBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
  effortBoxScale: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
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
