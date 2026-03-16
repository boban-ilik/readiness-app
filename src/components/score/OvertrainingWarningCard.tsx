/**
 * OvertrainingWarningCard
 *
 * Surfaces the overtraining risk assessment computed by useOvertrainingWarning
 * as a dedicated card on the home screen. Only renders when riskLevel ≠ 'none'.
 *
 * ── Visual language ─────────────────────────────────────────────────────────
 *   low      → amber left border, amber badge     ("Watch closely")
 *   moderate → orange left border, orange badge   ("Overtraining Risk")
 *   high     → red left border, red badge         ("High Risk")
 *
 * The card collapses to a compact summary by default.
 * Tapping "See what's triggering this ▾" expands the full signal list and the
 * 3-point action plan.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   <OvertrainingWarningCard warning={warning} />
 *
 * Render nothing (null) when warning.riskLevel === 'none' or isLoading.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import type { OvertrainingWarning, OvertRiskLevel, OvertSignal } from '@hooks/useOvertrainingWarning';

// ─── Risk palette ─────────────────────────────────────────────────────────────

interface RiskPalette {
  border:   string;
  badge:    string;
  badgeBg:  string;
  glow:     string;
  title:    string;
  icon:     string;
}

const PALETTE: Record<Exclude<OvertRiskLevel, 'none'>, RiskPalette> = {
  low: {
    border:  colors.amber[400],
    badge:   colors.amber[400],
    badgeBg: 'rgba(245,166,35,0.12)',
    glow:    'rgba(245,166,35,0.06)',
    title:   'Watch Closely',
    icon:    '⚠️',
  },
  moderate: {
    border:  '#FB8C00',
    badge:   '#FB8C00',
    badgeBg: 'rgba(251,140,0,0.12)',
    glow:    'rgba(251,140,0,0.06)',
    title:   'Overtraining Risk',
    icon:    '🔶',
  },
  high: {
    border:  colors.error,
    badge:   colors.error,
    badgeBg: 'rgba(229,57,53,0.12)',
    glow:    'rgba(229,57,53,0.06)',
    title:   'High Overtraining Risk',
    icon:    '🚨',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SignalRowProps {
  signal:  OvertSignal;
  palette: RiskPalette;
}

function SignalRow({ signal, palette }: SignalRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.signalRow}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.7}
    >
      <View style={styles.signalHeader}>
        <Text style={styles.signalIcon}>{signal.icon}</Text>
        <View style={styles.signalLabelWrap}>
          <Text style={[styles.signalLabel, { color: signal.severity === 'alert' ? palette.badge : colors.text.primary }]}>
            {signal.label}
          </Text>
        </View>
        <View style={[
          styles.severityPill,
          { backgroundColor: signal.severity === 'alert' ? palette.badgeBg : 'rgba(155,163,184,0.10)' },
        ]}>
          <Text style={[
            styles.severityText,
            { color: signal.severity === 'alert' ? palette.badge : colors.text.secondary },
          ]}>
            {signal.severity === 'alert' ? 'Alert' : 'Warning'}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <Text style={styles.signalDetail}>{signal.detail}</Text>
      )}
    </TouchableOpacity>
  );
}

interface ActionStepProps {
  index:   number;
  text:    string;
  palette: RiskPalette;
}

function ActionStep({ index, text, palette }: ActionStepProps) {
  return (
    <View style={styles.actionRow}>
      <View style={[styles.actionIndex, { backgroundColor: palette.badgeBg, borderColor: palette.border }]}>
        <Text style={[styles.actionIndexText, { color: palette.badge }]}>{index}</Text>
      </View>
      <Text style={styles.actionText}>{text}</Text>
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  warning: OvertrainingWarning;
}

export function OvertrainingWarningCard({ warning }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Don't render while loading or when there's no meaningful signal
  if (warning.isLoading || warning.riskLevel === 'none') return null;

  const palette = PALETTE[warning.riskLevel];

  // Compact summary text
  const summaryText = warning.riskLevel === 'high'
    ? `${warning.signals.length} overtraining signal${warning.signals.length > 1 ? 's' : ''} detected. Your body is asking for a break.`
    : warning.riskLevel === 'moderate'
    ? `${warning.signals.length} signal${warning.signals.length > 1 ? 's' : ''} suggest${warning.signals.length === 1 ? 's' : ''} your recovery is under pressure. Time to dial it back.`
    : 'An early fatigue signal is building. Keep today light and monitor your trend.';

  return (
    <View style={[styles.card, { borderLeftColor: palette.border, backgroundColor: palette.glow }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>{palette.icon}</Text>
          <Text style={styles.sectionLabel}>OVERTRAINING ALERT</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: palette.badgeBg, borderColor: palette.border }]}>
          <Text style={[styles.riskBadgeText, { color: palette.badge }]}>
            {palette.title}
          </Text>
        </View>
      </View>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <Text style={styles.summary}>{summaryText}</Text>

      {/* ── Signal pills (compact) ───────────────────────────────────────── */}
      <View style={styles.pillRow}>
        {warning.signals.map((s, i) => (
          <View
            key={i}
            style={[styles.signalPill, { borderColor: s.severity === 'alert' ? palette.border : colors.border.default }]}
          >
            <Text style={styles.pillIcon}>{s.icon}</Text>
            <Text style={[
              styles.pillText,
              { color: s.severity === 'alert' ? palette.badge : colors.text.secondary },
            ]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Expand / collapse ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandText, { color: palette.badge }]}>
          {expanded ? 'Hide detail ▲' : 'See what\'s triggering this ▼'}
        </Text>
      </TouchableOpacity>

      {/* ── Expanded detail ──────────────────────────────────────────────── */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: palette.border + '30' }]} />

          {/* Signal list */}
          <Text style={styles.sectionSubLabel}>SIGNALS DETECTED</Text>
          {warning.signals.map((s, i) => (
            <SignalRow key={i} signal={s} palette={palette} />
          ))}

          <View style={[styles.divider, { backgroundColor: palette.border + '30' }]} />

          {/* Action plan */}
          <Text style={styles.sectionSubLabel}>WHAT TO DO</Text>
          {warning.actionPlan.map((step, i) => (
            <ActionStep key={i} index={i + 1} text={step} palette={palette} />
          ))}

          <Text style={styles.disclaimer}>
            These signals are based on your personal baselines and recent training data. Always listen to your body.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginBottom:     spacing[3],
    borderRadius:     radius.lg,
    borderLeftWidth:  3,
    backgroundColor:  colors.bg.tertiary,
    paddingTop:       spacing[4],
    paddingRight:     spacing[4],
    paddingBottom:    spacing[4],
    paddingLeft:      spacing[4],
    overflow:         'hidden',
  },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  headerIcon: {
    fontSize: 16,
  },
  sectionLabel: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.secondary,
    letterSpacing: 1.0,
  },
  riskBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
    borderRadius:      radius.full,
    borderWidth:       1,
  },
  riskBadgeText: {
    fontSize:   10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },

  // Summary
  summary: {
    fontSize:     fontSize.sm,
    color:        colors.text.primary,
    lineHeight:   20,
    marginBottom: spacing[3],
  },

  // Compact signal pills
  pillRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            spacing[2],
    marginBottom:   spacing[2],
  },
  signalPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: spacing[2],
    paddingVertical:   4,
    borderRadius:      radius.sm,
    borderWidth:       1,
    backgroundColor:   colors.bg.secondary,
  },
  pillIcon: {
    fontSize: 11,
  },
  pillText: {
    fontSize:   11,
    fontWeight: fontWeight.medium,
  },

  // Expand button
  expandButton: {
    paddingTop: spacing[1],
  },
  expandText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },

  // Expanded content
  expandedContent: {
    marginTop: spacing[3],
  },
  divider: {
    height:        1,
    marginBottom:  spacing[3],
  },
  sectionSubLabel: {
    fontSize:     9,
    fontWeight:   fontWeight.bold,
    color:        colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom:  spacing[2],
  },

  // Signal rows
  signalRow: {
    marginBottom: spacing[2],
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  signalIcon: {
    fontSize: 14,
    width:    20,
  },
  signalLabelWrap: {
    flex: 1,
  },
  signalLabel: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      radius.sm,
  },
  severityText: {
    fontSize: 10,
    fontWeight: fontWeight.semiBold,
  },
  chevron: {
    fontSize: 9,
    color:    colors.text.tertiary,
  },
  signalDetail: {
    fontSize:   fontSize.xs,
    color:      colors.text.secondary,
    lineHeight: 17,
    marginTop:  spacing[1],
    marginLeft: 24,
  },

  // Action plan
  actionRow: {
    flexDirection: 'row',
    gap:           spacing[3],
    marginBottom:  spacing[3],
    alignItems:    'flex-start',
  },
  actionIndex: {
    width:         22,
    height:        22,
    borderRadius:  11,
    borderWidth:   1,
    alignItems:    'center',
    justifyContent: 'center',
    flexShrink:    0,
    marginTop:     1,
  },
  actionIndexText: {
    fontSize:   11,
    fontWeight: fontWeight.bold,
  },
  actionText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      colors.text.primary,
    lineHeight: 20,
  },

  // Disclaimer
  disclaimer: {
    fontSize:   10,
    color:      colors.text.tertiary,
    lineHeight: 14,
    marginTop:  spacing[1],
    fontStyle:  'italic',
  },
});
