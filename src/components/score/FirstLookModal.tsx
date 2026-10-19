/**
 * FirstLookModal
 *
 * Shown once after onboarding to a user whose Apple Health already holds a
 * week or more of watch data: what their last 30 days say, instead of
 * "come back in a week". Reopenable from History.
 *
 * Every number is computed on the device from Health history (the same
 * per-day scores History shows); the screen adds no requests.
 */

import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, getScoreColor } from '@constants/theme';
import { useHistoryData } from '@hooks/useHistoryData';
import { buildFirstLook, formatSleep, howLongAgo, type NotableDay } from '@utils/firstLook';
import { localDateStr } from '@utils/index';

interface Props {
  onClose:     () => void;
  /** Today's score, or null when there isn't a usable one */
  todayScore:  number | null;
  /** When the free Pro week ends (ms), or null when not on the trial */
  trialEndsAt: number | null;
  /** Reopened from History: drops the first-day wording */
  reopened?:   boolean;
}

const formatDay = (date: string) =>
  new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const sentence = (notes: string[]) => {
  const s = notes.join(', ');
  return s ? s[0].toUpperCase() + s.slice(1) + '.' : '';
};

function Morning({ label, day }: { label: string; day: NotableDay }) {
  return (
    <View style={styles.morning}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label} · {formatDay(day.date)} · {howLongAgo(day.date, localDateStr())}</Text>
        <Text style={[styles.rowValue, { color: getScoreColor(day.score) }]}>{day.score}</Text>
      </View>
      {day.notes.length > 0 && <Text style={styles.morningNotes}>{sentence(day.notes)}</Text>}
    </View>
  );
}

/** Mount only while open: it reads 30 days of Health history. */
export default function FirstLookModal({ onClose, todayScore, trialEndsAt, reopened = false }: Props) {
  const { history, isLoading } = useHistoryData(30);
  const look = isLoading ? null : buildFirstLook(history, localDateStr(), todayScore);

  const where = { below: 'below your usual range', inside: 'inside your usual range', above: 'above your usual range' };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>YOUR FIRST LOOK</Text>
          <Text style={styles.title}>Your last 30 days, from Apple Health</Text>

          {isLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.text.accent} />
          ) : !look ? (
            <Text style={styles.lede}>
              There isn't a week of watch data in Apple Health yet, so Readiness will learn your normal over
              your first nights instead.
            </Text>
          ) : (
            <>
              <Text style={styles.lede}>
                {reopened
                  ? `From ${look.nights} nights of your watch data.`
                  : `Readiness read ${look.nights} nights of your watch data, so it doesn't need a week to learn you.`}
              </Text>

              {(look.hrv || look.rhr || look.sleep) && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Your usual</Text>
                  {look.hrv && (
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Overnight HRV</Text>
                      <Text style={styles.rowValue}>{look.hrv.low} to {look.hrv.high} ms</Text>
                    </View>
                  )}
                  {look.rhr && (
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Resting heart rate</Text>
                      <Text style={styles.rowValue}>{look.rhr.low} to {look.rhr.high} bpm</Text>
                    </View>
                  )}
                  {look.sleep && (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>Sleep, on average</Text>
                        <Text style={styles.rowValue}>{formatSleep(look.sleep.avgMinutes)}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>Nights under 6 hours</Text>
                        <Text style={styles.rowValue}>{look.sleep.shortNights} of {look.sleep.nights}</Text>
                      </View>
                    </>
                  )}
                  <Text style={styles.cardFoot}>
                    Usual means the middle 80% of your nights. The "Unusual for you" card uses the same range.
                  </Text>
                </View>
              )}

              {look.best && look.toughest && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Your best and toughest mornings</Text>
                  <Morning label="Best" day={look.best} />
                  <Morning label="Toughest" day={look.toughest} />
                </View>
              )}

              {look.today && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Today</Text>
                  <Text style={styles.cardBody}>
                    <Text style={{ color: getScoreColor(look.today.score), fontWeight: '800' }}>{look.today.score}</Text>
                    , {where[look.today.position]}.
                  </Text>
                </View>
              )}

              {!reopened && <View style={styles.card}>
                <Text style={styles.cardTitle}>What's next</Text>
                <Text style={styles.cardBody}>
                  Your score is personal from today.
                  {trialEndsAt
                    ? ` You have every Pro feature free until ${new Date(trialEndsAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}.`
                    : ''}
                </Text>
              </View>}
            </>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.ctaButtonText}>{reopened ? 'Close' : "See today's score"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Same look as the calibration report, the other once-only recap.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll:    { padding: spacing[5], paddingBottom: spacing[8] },
  kicker: {
    color: colors.text.accent,
    fontSize: 13,
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
    fontSize: 17,
    lineHeight: 22,
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },
  loading: { marginVertical: spacing[8] },
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
    fontSize: 16,
    lineHeight: 21,
  },
  cardFoot: {
    color: colors.text.tertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing[3],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: 6,
  },
  rowLabel: { color: colors.text.secondary, fontSize: 16, flexShrink: 1 },
  rowValue: { color: colors.text.primary, fontSize: 17, fontWeight: '700' },
  morning: { paddingVertical: 4 },
  morningNotes: { color: colors.text.tertiary, fontSize: 14, lineHeight: 19 },
  ctaButton: {
    backgroundColor: colors.text.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing[3],
  },
  ctaButtonText: { color: colors.bg.primary, fontSize: 16, fontWeight: '800' },
});
