/**
 * CalibrationBanner
 *
 * Shown on the home screen during the first 7 days after onboarding.
 * Communicates that the app is "learning your normal" and that scores
 * become increasingly accurate as personal baselines take shape.
 *
 * ── Behaviour ────────────────────────────────────────────────────────────────
 * • Visible while CalibrationStatus.isCalibrating is true
 * • User can dismiss for the current session (tap ✕) — it reappears
 *   next app open until day 7 is complete
 * • After day 7 it does not render at all (isCalibrating = false)
 *
 * ── Design ───────────────────────────────────────────────────────────────────
 * 7 small dot indicators (1 per day) — filled dots = data collected
 * Warm amber/blue palette — informational, not alarming
 * Day-specific copy that progresses from curious → confident
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import type { CalibrationStatus } from '@hooks/useCalibrationStatus';
import { CALIBRATION_DAYS } from '@hooks/useCalibrationStatus';

// ─── Copy by day ──────────────────────────────────────────────────────────────

interface DayCopy {
  headline: string;
  body:     string;
}

const DAY_COPY: DayCopy[] = [
  // Day 0 (first time opening, no overnight data yet)
  {
    headline: 'First reading — Day 1 of 7 🔬',
    body:     "We're reading your baseline now. Scores get sharper as we learn your personal norms.",
  },
  // Day 1
  {
    headline: 'Learning your normal — Day 2 of 7',
    body:     "Building your HRV and RHR baselines. One night down — each one adds more accuracy.",
  },
  // Day 2
  {
    headline: 'Patterns forming — Day 3 of 7',
    body:     'Your baselines are taking shape. HRV readings are starting to stabilise.',
  },
  // Day 3
  {
    headline: 'Halfway calibrated — Day 4 of 7',
    body:     'Four days of data in. Your recovery baseline is becoming more personal.',
  },
  // Day 4
  {
    headline: 'Getting accurate — Day 5 of 7',
    body:     'Most of your baseline is formed. Scores are now much closer to your personal ceiling.',
  },
  // Day 5
  {
    headline: 'Almost there — Day 6 of 7',
    body:     'One more night and your 7-day baselines will be fully calibrated.',
  },
  // Day 6 (last day — calibration completes tonight)
  {
    headline: 'Final calibration day — Day 7 of 7 ✓',
    body:     "Tonight locks in your personal baselines. Starting tomorrow, your score is fully personalised.",
  },
];

function getCopy(daysComplete: number): DayCopy {
  const idx = Math.min(Math.max(daysComplete, 0), DAY_COPY.length - 1);
  return DAY_COPY[idx];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CalibrationBannerProps {
  status: CalibrationStatus;
}

export function CalibrationBanner({ status }: CalibrationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!status.isCalibrating || status.isLoading || dismissed) return null;

  const { headline, body } = getCopy(status.daysComplete);

  return (
    <View style={styles.container}>
      {/* Header row: headline + dismiss button */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CALIBRATING</Text>
        </View>
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>{headline}</Text>

      {/* Body copy */}
      <Text style={styles.body}>{body}</Text>

      {/* 7-dot progress indicator */}
      <View style={styles.dotsRow}>
        {Array.from({ length: CALIBRATION_DAYS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < status.daysComplete ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
        <Text style={styles.dotsLabel}>
          {status.daysComplete} / {CALIBRATION_DAYS} days
        </Text>
      </View>

      {/* Thin progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(status.progress * 100)}%` }]} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AMBER  = colors.amber[400];
const AMBER_DIM = 'rgba(245,166,35,0.15)';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
    backgroundColor:  colors.bg.elevated,
    borderRadius:     radius.lg,
    borderWidth:      1,
    borderColor:      'rgba(245,166,35,0.25)',
    padding:          spacing[4],
    gap:              spacing[2],
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: AMBER_DIM,
    borderRadius:    radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
  },
  badgeText: {
    color:      AMBER,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.8,
  },
  closeBtn: {
    color:    colors.text.tertiary,
    fontSize: fontSize.sm,
  },

  // ── Copy ────────────────────────────────────────────────────────────────────
  headline: {
    color:      colors.text.primary,
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: 22,
  },
  body: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 20,
  },

  // ── Progress dots ────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
    marginTop:     spacing[1],
  },
  dot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  dotFilled: {
    backgroundColor: AMBER,
  },
  dotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
  },
  dotsLabel: {
    color:     colors.text.tertiary,
    fontSize:  fontSize.xs,
    marginLeft: spacing[1],
  },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  barTrack: {
    height:          3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    2,
    overflow:        'hidden',
    marginTop:       spacing[1],
  },
  barFill: {
    height:          3,
    backgroundColor: AMBER,
    borderRadius:    2,
  },
});
