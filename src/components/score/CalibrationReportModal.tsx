/**
 * CalibrationReportModal
 *
 * Shown once, the day calibration completes. Recaps what the app learned in
 * the user's first week — their personal baselines, their best and hardest
 * days, and (when cycle tracking is on) the cycle context — then makes the
 * Keep-Pro ask while the evidence is on screen.
 *
 * Every number here is already on the device; this screen adds no requests.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, getScoreColor } from '@constants/theme';
import { useHistoryData } from '@hooks/useHistoryData';
import { getCycleContext, getPhaseInfo, type CycleContext } from '@services/cycleTracking';

interface Props {
  visible:       boolean;
  onClose:       () => void;
  hrvBaseline:   number;
  rhrBaseline:   number;
  /** True while the calibration-week trial (or a paid sub) still unlocks Pro. */
  isPro:         boolean;
  isTrialActive: boolean;
  onKeepPro:     () => void;
}

function formatDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
  });
}

export default function CalibrationReportModal({
  visible, onClose, hrvBaseline, rhrBaseline, isPro, isTrialActive, onKeepPro,
}: Props) {
  const { history } = useHistoryData(7);
  const [cycle, setCycle] = useState<CycleContext | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getCycleContext().then(c => { if (!cancelled) setCycle(c); });
    return () => { cancelled = true; };
  }, [visible]);

  const scored = history
    .filter(d => d.score !== null && d.score > 0)
    .map(d => ({ ...d, score: d.score as number }));
  const avg    = scored.length
    ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
    : 0;
  const best   = scored.length
    ? scored.reduce((a, b) => (b.score >= a.score ? b : a))
    : null;
  const worst  = scored.length
    ? scored.reduce((a, b) => (b.score < a.score ? b : a))
    : null;
  const sleepVals   = history.map(d => d.sleepMinutes ?? 0).filter(m => m > 0);
  const avgSleepMin = sleepVals.length
    ? Math.round(sleepVals.reduce((s, m) => s + m, 0) / sleepVals.length)
    : 0;
  const sleepH = Math.floor(avgSleepMin / 60);
  const sleepM = avgSleepMin % 60;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>CALIBRATION COMPLETE</Text>
          <Text style={styles.title}>Your scores are personal now 🎉</Text>
          <Text style={styles.lede}>
            Readiness spent this week learning what normal looks like for your body.
            From today, every score measures you against you.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your baselines</Text>
            {hrvBaseline > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Overnight HRV</Text>
                <Text style={styles.rowValue}>{Math.round(hrvBaseline)} ms</Text>
              </View>
            )}
            {rhrBaseline > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Resting heart rate</Text>
                <Text style={styles.rowValue}>{Math.round(rhrBaseline)} bpm</Text>
              </View>
            )}
            {avgSleepMin > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Typical night's sleep</Text>
                <Text style={styles.rowValue}>{sleepH}h {sleepM}m</Text>
              </View>
            )}
            <Text style={styles.cardFoot}>
              These are the yardsticks your daily score is measured against, and they
              keep refining as you go.
            </Text>
          </View>

          {scored.length >= 3 && best && worst && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your week</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Average readiness</Text>
                <Text style={[styles.rowValue, { color: getScoreColor(avg) }]}>{avg}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Strongest day</Text>
                <Text style={[styles.rowValue, { color: getScoreColor(best.score) }]}>
                  {formatDay(best.date)} · {best.score}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hardest day</Text>
                <Text style={[styles.rowValue, { color: getScoreColor(worst.score) }]}>
                  {formatDay(worst.date)} · {worst.score}
                </Text>
              </View>
            </View>
          )}

          {cycle && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cycle context</Text>
              <Text style={styles.cardBody}>
                {getPhaseInfo(cycle.phase).emoji} You're on day {cycle.dayOfCycle} of your
                cycle, in the {getPhaseInfo(cycle.phase).name.toLowerCase()} phase. Your
                briefings and coach now read your numbers with that in mind, so a
                phase-typical dip won't be mistaken for overtraining.
              </Text>
            </View>
          )}

          {isTrialActive ? (
            <View style={styles.ctaBlock}>
              <Text style={styles.ctaText}>
                Your free week of Pro ends soon. Keep the daily briefing, coach and
                forecast running on the baselines you just built.
              </Text>
              <TouchableOpacity style={styles.ctaButton} onPress={onKeepPro} accessibilityRole="button">
                <Text style={styles.ctaButtonText}>Keep Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} accessibilityRole="button">
                <Text style={styles.dismiss}>Continue with the free score</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.ctaButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.ctaButtonText}>{isPro ? 'Continue' : 'Got it'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll:    { padding: spacing[5], paddingBottom: spacing[8] },
  kicker: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: spacing[5],
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing[3],
  },
  lede: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  cardBody: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  cardFoot: {
    color: colors.text.tertiary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { color: colors.text.secondary, fontSize: 14 },
  rowValue: { color: colors.text.primary, fontSize: 15, fontWeight: '700' },
  ctaBlock: { marginTop: spacing[3], alignItems: 'stretch' },
  ctaText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: colors.text.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaButtonText: { color: colors.bg.primary, fontSize: 16, fontWeight: '800' },
  dismiss: {
    color: colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing[4],
    paddingVertical: 6,
  },
});
