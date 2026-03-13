/**
 * ShareCard
 *
 * A visually polished card designed to be captured as an image and shared
 * to Instagram Stories, Twitter/X, iMessage, or anywhere else via the
 * native iOS share sheet.
 *
 * Usage:
 *   1. Mount this component off-screen using absolute positioning + opacity 0.
 *   2. Call captureShareCard() which captures it with react-native-view-shot
 *      and opens the native Share sheet.
 *
 * The card is 1080×1920 (9:16 Story ratio) rendered at a logical size of
 * 270×480 pts with a 4× pixel ratio — matching full HD Story resolution.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │                                          │
 *   │   READINESS         [date]               │
 *   │   ─────────────────────────────          │
 *   │                                          │
 *   │              [ 72 ]                      │  ← large score ring
 *   │            GOOD TO GO                    │
 *   │                                          │
 *   │   Recovery  ████████░░   68              │
 *   │   Sleep     ██████████   84              │
 *   │   Stress    ██████░░░░   59              │
 *   │                                          │
 *   │   readiness.app                          │
 *   └─────────────────────────────────────────┘
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReadinessResult } from '@utils/readiness';
import { getScoreColor, getScoreLabel } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareCardProps {
  readiness: ReadinessResult;
}

// ─── Component bar ────────────────────────────────────────────────────────────

function ComponentBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${score}%` as any, backgroundColor: color + 'CC' }]} />
      </View>
      <Text style={[barStyles.value, { color }]}>{score}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginVertical: 5,
  },
  label: {
    width:      68,
    fontSize:   12,
    color:      'rgba(255,255,255,0.65)',
    fontFamily: 'System',
  },
  track: {
    flex:            1,
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow:        'hidden',
  },
  fill: {
    height:       6,
    borderRadius: 3,
  },
  value: {
    width:      28,
    fontSize:   13,
    fontWeight: '700' as const,
    textAlign:  'right',
    fontFamily: 'System',
  },
});

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  return (
    <View style={[ringStyles.outer, { borderColor: color + '33', backgroundColor: color + '18' }]}>
      <View style={[ringStyles.inner, { borderColor: color }]}>
        <Text style={[ringStyles.score, { color }]}>{score}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  outer: {
    width:         136,
    height:        136,
    borderRadius:  68,
    borderWidth:   2,
    alignItems:    'center',
    justifyContent: 'center',
  },
  inner: {
    width:         108,
    height:        108,
    borderRadius:  54,
    borderWidth:   3,
    alignItems:    'center',
    justifyContent: 'center',
  },
  score: {
    fontSize:   48,
    fontWeight: '800' as const,
    fontFamily: 'System',
    lineHeight: 52,
  },
});

// ─── Main card ────────────────────────────────────────────────────────────────

const ShareCard = forwardRef<View, ShareCardProps>(({ readiness }, ref) => {
  const score      = Math.round(readiness.score);
  const recovery   = Math.round(readiness.components.recovery);
  const sleep      = Math.round(readiness.components.sleep);
  const stress     = Math.round(readiness.components.stress);
  const scoreColor = getScoreColor(score);
  const label      = getScoreLabel(score).toUpperCase();

  // Date string — e.g. "MON, 10 MAR"
  const now       = new Date();
  const dayName   = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day       = now.getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dateStr   = `${dayName}, ${day} ${monthName}`;

  return (
    <View ref={ref} style={styles.card} collapsable={false}>

      {/* ── Background gradient simulation via layered views ── */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* ── Glow circle behind score ── */}
      <View style={[styles.glow, { backgroundColor: scoreColor + '1A' }]} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.appName}>READINESS</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      <View style={styles.divider} />

      {/* ── Score ── */}
      <View style={styles.scoreSection}>
        <ScoreRing score={score} color={scoreColor} />
        <View style={{ height: 14 }} />
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>{label}</Text>
        <Text style={styles.scoreSub}>Today's readiness score</Text>
      </View>

      {/* ── Component bars ── */}
      <View style={styles.components}>
        <ComponentBar label="Recovery" score={recovery} color={getScoreColor(recovery)} />
        <ComponentBar label="Sleep"    score={sleep}    color={getScoreColor(sleep)} />
        <ComponentBar label="Stress"   score={stress}   color={getScoreColor(stress)} />
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={[styles.footerDot, { backgroundColor: scoreColor }]} />
        <Text style={styles.footerText}>readiness.app</Text>
      </View>

    </View>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = 270;
const CARD_H = 480;

const styles = StyleSheet.create({
  card: {
    width:           CARD_W,
    height:          CARD_H,
    backgroundColor: '#0D0D10',
    borderRadius:    28,
    overflow:        'hidden',
    padding:         28,
    justifyContent:  'space-between',
  },

  // Background layers
  bgTop: {
    position:        'absolute',
    top:             -60,
    left:            -60,
    width:           220,
    height:          220,
    borderRadius:    110,
    backgroundColor: '#1A1A2E',
  },
  bgBottom: {
    position:        'absolute',
    bottom:          -40,
    right:           -40,
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: '#12121A',
  },
  glow: {
    position:     'absolute',
    top:          '30%',
    alignSelf:    'center',
    width:        180,
    height:       180,
    borderRadius: 90,
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  appName: {
    fontSize:      11,
    fontWeight:    '700' as const,
    color:         'rgba(255,255,255,0.55)',
    letterSpacing: 2.5,
    fontFamily:    'System',
  },
  date: {
    fontSize:      10,
    fontWeight:    '600' as const,
    color:         'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
    fontFamily:    'System',
  },

  divider: {
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical:  4,
  },

  // Score section
  scoreSection: {
    alignItems: 'center',
    flex:       1,
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize:      16,
    fontWeight:    '700' as const,
    letterSpacing: 1.5,
    fontFamily:    'System',
  },
  scoreSub: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.4)',
    marginTop:  4,
    fontFamily: 'System',
  },

  // Components
  components: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    16,
    padding:         16,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
  },

  // Footer
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginTop:      4,
  },
  footerDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  footerText: {
    fontSize:      10,
    color:         'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    fontFamily:    'System',
  },
});
