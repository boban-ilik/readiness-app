/**
 * OvertrainingWarningCard
 *
 * Surfaces the overtraining risk assessment computed by useOvertrainingWarning
 * as a dedicated card on the home screen. Only renders when riskLevel ≠ 'none'.
 *
 * ── Visual language ─────────────────────────────────────────────────────────
 *   low      → amber left border and status       ("Watch closely")
 *   moderate → orange left border and status      ("Overtraining Risk")
 *   high     → red left border and status         ("High Risk")
 *
 * The card collapses to a compact summary by default. The status and the
 * signals are computed, so they are drawn as plain text, never as pills that
 * look editable. A tap anywhere on the summary expands the full signal list
 * and the 3-point action plan.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   <OvertrainingWarningCard warning={warning} />
 *
 * Render nothing (null) when warning.riskLevel === 'none' or isLoading.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, fontWeight, spacing, surface, typography } from '@constants/theme';
import type { OvertrainingWarning, OvertRiskLevel, OvertSignal } from '@hooks/useOvertrainingWarning';

// ─── Risk palette ─────────────────────────────────────────────────────────────

interface RiskPalette {
  border:   string;
  badge:    string;
  badgeBg:  string;
  glow:     string;
  title:    string;
}

const PALETTE: Record<Exclude<OvertRiskLevel, 'none'>, RiskPalette> = {
  low: {
    border:  colors.amber[400],
    badge:   colors.amber[400],
    badgeBg: 'rgba(245,166,35,0.12)',
    glow:    'rgba(245,166,35,0.06)',
    title:   'Watch Closely',
  },
  moderate: {
    border:  '#FB8C00',
    badge:   '#FB8C00',
    badgeBg: 'rgba(251,140,0,0.12)',
    glow:    'rgba(251,140,0,0.06)',
    title:   'Overtraining Risk',
  },
  high: {
    border:  colors.error,
    badge:   colors.error,
    badgeBg: 'rgba(229,57,53,0.12)',
    glow:    'rgba(229,57,53,0.06)',
    title:   'High Overtraining Risk',
  },
};

const RECOVERY_TITLE: Record<Exclude<OvertRiskLevel, 'none'>, string> = {
  low:      'Watch Closely',
  moderate: 'Under Pressure',
  high:     'Recovery Strained',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SignalRowProps {
  signal:  OvertSignal;
  palette: RiskPalette;
}

function SignalRow({ signal, palette }: SignalRowProps) {
  const [expanded, setExpanded] = useState(false);
  const tone = signal.severity === 'alert' ? palette.badge : colors.text.secondary;

  return (
    <TouchableOpacity
      style={styles.signalRow}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <View style={styles.signalHeader}>
        <View style={[styles.signalDot, { backgroundColor: tone }]} />
        <Text style={styles.signalLabel}>{signal.label}</Text>
        <Text style={[styles.severityText, { color: tone }]}>
          {signal.severity === 'alert' ? 'Alert' : 'Warning'}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.tertiary} />
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

  // "Overtraining" only when training is part of the cause. Sleep debt or a
  // falling HRV on a week with no sessions is recovery under pressure, not
  // overtraining, and saying so would be a verdict the data doesn't support.
  const fromTraining = warning.signals.some(s => s.label.includes('Training load'));
  const title = fromTraining ? palette.title : RECOVERY_TITLE[warning.riskLevel];

  // Compact summary text
  const summaryText = warning.riskLevel === 'high'
    ? `${warning.signals.length} ${fromTraining ? 'overtraining' : 'recovery'} signal${warning.signals.length > 1 ? 's' : ''} detected. Your body is asking for a break.`
    : warning.riskLevel === 'moderate'
    ? `${warning.signals.length} signal${warning.signals.length > 1 ? 's' : ''} suggest${warning.signals.length === 1 ? 's' : ''} your recovery is under pressure. Time to dial it back.`
    : 'An early fatigue signal is building. Keep today light and monitor your trend.';

  return (
    <View style={[styles.card, { borderLeftColor: palette.border }]}>

      {/* ── Summary: one tap target that opens the detail ───────────────── */}
      <TouchableOpacity
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="warning" size={15} color={palette.badge} />
            <Text style={styles.sectionLabel}>{fromTraining ? 'OVERTRAINING ALERT' : 'RECOVERY ALERT'}</Text>
          </View>
          <Text style={[styles.statusText, { color: palette.badge }]}>{title}</Text>
        </View>

        <Text style={styles.summary}>{summaryText}</Text>

        {warning.signals.map((s, i) => (
          <View key={i} style={styles.signalLine}>
            <View style={[styles.signalDot, { backgroundColor: s.severity === 'alert' ? palette.badge : colors.text.secondary }]} />
            <Text style={styles.signalLineText}>{s.label}</Text>
          </View>
        ))}

        <View style={styles.expandRow}>
          <Text style={[styles.expandText, { color: palette.badge }]}>
            {expanded ? 'Hide detail' : 'See what\'s triggering this'}
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={palette.badge} />
        </View>
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
            These signals are based on your personal baselines and your recent data. Always listen to your body.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // No side margin: Today's scroll view already insets its content, and a
  // second inset made this card narrower than its neighbours.
  card: {
    ...surface.card,
    borderLeftWidth: 3,
    marginBottom:    spacing[3],
    padding:         spacing[4],
    overflow:        'hidden',
  },

  // Header
  // Wraps the status onto its own line when the label and status don't fit
  // side by side, instead of letting them touch.
  header: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing[2],
    marginBottom:   spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  sectionLabel: {
    ...typography.label,
  },
  statusText: {
    fontSize:   13,
    fontWeight: fontWeight.semiBold,
  },

  // Summary
  summary: {
    ...typography.body,
    marginBottom: spacing[2.5],
  },

  // Signals in the summary: plain lines, not pills
  signalLine: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
    marginBottom:  spacing[1],
  },
  signalLineText: {
    ...typography.caption,
  },
  signalDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },

  // Expand link
  expandRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
    paddingTop:    spacing[2],
  },
  expandText: {
    fontSize:   13,
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
    ...typography.label,
    marginBottom: spacing[2],
  },

  // Signal rows
  signalRow: {
    marginBottom: spacing[2.5],
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  signalLabel: {
    flex:       1,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      colors.text.primary,
  },
  severityText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  signalDetail: {
    ...typography.caption,
    marginTop:  spacing[1],
    marginLeft: 6 + spacing[2],
  },

  // Action plan
  actionRow: {
    flexDirection: 'row',
    gap:           spacing[3],
    marginBottom:  spacing[3],
    alignItems:    'flex-start',
  },
  actionIndex: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      1,
  },
  actionIndexText: {
    fontFamily: fontFamily.numeral,
    fontSize:   14,
  },
  actionText: {
    flex: 1,
    ...typography.body,
  },

  // Disclaimer
  disclaimer: {
    fontSize:   fontSize['2xs'],
    color:      colors.text.tertiary,
    lineHeight: 15,
    marginTop:  spacing[1],
  },
});
