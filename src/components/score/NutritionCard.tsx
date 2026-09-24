/**
 * NutritionCard
 *
 * Displays today's personalised nutrition recommendations, derived from
 * HRV vs baseline, sleep duration/quality, readiness score, and sub-scores.
 *
 * Sits behind a ProGate on the home screen.
 *
 * Props:
 *   score       — today's overall readiness score (0–100)
 *   components  — recovery / sleep / stress sub-scores
 *   healthData  — raw Apple Health data for this cycle
 *   hrvBaseline — user's rolling HRV baseline in ms
 */

import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNutritionRecommendation } from '@utils/nutrition';
import { PROFILE_WEIGHT_KEY } from '@services/userProfile';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData }      from '@/types/index';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionCardProps {
  score:       number;
  components:  ReadinessResult['components'];
  healthData:  HealthData | null;
  hrvBaseline: number;
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function BulletRow({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NutritionCard({
  score,
  components,
  healthData,
  hrvBaseline,
}: NutritionCardProps) {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);

  // Weight is edited on the Profile tab while this screen stays mounted behind
  // it, so re-read on focus rather than once on mount — otherwise the targets
  // keep showing the old bodyweight until the app restarts.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(PROFILE_WEIGHT_KEY)
        .then(v => { if (active && v) setWeightKg(Number(v)); })
        .catch(() => { /* falls back to generic targets */ });
      return () => { active = false; };
    }, []),
  );

  const rec = getNutritionRecommendation(score, components, healthData, hrvBaseline, weightKg);

  return (
    <View style={styles.card}>

      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={[styles.tierBadge, { borderColor: rec.color }]}>
          <Text style={[styles.tierIcon, { color: rec.color }]}>🥗</Text>
        </View>
        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>{rec.headline}</Text>
          <Text style={[styles.context, { color: rec.color }]}>{rec.context}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Hydration pill ── */}
      <View style={styles.hydrationPill}>
        <Text style={styles.hydrationIcon}>💧</Text>
        <Text style={styles.hydrationText}>{rec.hydration}</Text>
      </View>

      {/* ── Protein pill (only when a bodyweight is on file) ── */}
      {rec.protein && (
        <View style={styles.hydrationPill}>
          <Text style={styles.hydrationIcon}>🍗</Text>
          <Text style={styles.hydrationText}>{rec.protein}</Text>
        </View>
      )}

      {/* ── Weight affordance ── */}
      <TouchableOpacity
        style={styles.weightRow}
        onPress={() => router.push('/(tabs)/profile')}
        accessibilityRole="button"
        accessibilityLabel={
          weightKg
            ? `Bodyweight ${weightKg} kilograms. Update in profile.`
            : 'Add your bodyweight in profile'
        }
      >
        <Text style={styles.weightText}>
          {weightKg
            ? `Hydration and protein scaled to ${weightKg} kg`
            : 'Add your weight for personal hydration and protein targets'}
        </Text>
        <Text style={styles.weightChevron}>{weightKg ? 'Update ›' : 'Add ›'}</Text>
      </TouchableOpacity>

      {/* ── Prioritise ── */}
      <View style={styles.section}>
        <SectionLabel text="✅  PRIORITISE TODAY" />
        {rec.prioritise.map((item, i) => (
          <BulletRow key={i} text={item} />
        ))}
      </View>

      {/* ── Moderate ── */}
      <View style={styles.section}>
        <SectionLabel text="⚠️  MODERATE" />
        {rec.moderate.map((item, i) => (
          <BulletRow key={i} text={item} />
        ))}
      </View>

      {/* ── Timing tip ── */}
      <View style={styles.section}>
        <SectionLabel text="⏰  MEAL TIMING" />
        <Text style={styles.timingText}>{rec.timing}</Text>
      </View>

      {/* ── Rationale ── */}
      <View style={[styles.rationaleBox, { borderLeftColor: rec.color }]}>
        <Text style={styles.rationaleText}>{rec.rationale}</Text>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Based on HRV, sleep & readiness</Text>
        <View style={[styles.scoreDot, { backgroundColor: rec.color }]} />
        <Text style={[styles.footerScore, { color: rec.color }]}>{score}</Text>
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

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  tierBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
    flexShrink: 0,
  },
  tierIcon: {
    fontSize: 24,
  },
  headlineBlock: {
    flex: 1,
    gap: spacing[0.5],
  },
  headline: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  context: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // Hydration pill
  weightRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing[2],
    paddingVertical: spacing[1],
  },
  weightText: {
    flex:     1,
    color:    colors.text.secondary,
    fontSize: fontSize.xs,
  },
  weightChevron: {
    color:      colors.text.accent,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },

  hydrationPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  hydrationIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  hydrationText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },

  // Section
  section: {
    gap: spacing[2],
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.2,
  },

  // Bullet rows
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.text.tertiary,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },

  // Timing
  timingText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },

  // Rationale box
  rationaleBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[4],
    borderLeftWidth: 3,
  },
  rationaleText: {
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
