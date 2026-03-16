/**
 * CyclePhaseCard
 *
 * Shows the current menstrual cycle phase on the home screen, contextualising
 * why HRV, RHR, or readiness score may be lower (or higher) than usual.
 *
 * Only renders when:
 *   • user has biological sex = 'female' set in profile
 *   • cycle tracking is enabled in settings
 *   • at least one period start has been logged
 *
 * ── What it shows ─────────────────────────────────────────────────────────────
 *  Phase badge + emoji (colour-coded by phase)
 *  Day X of cycle
 *  Readiness context note — why the score/metrics may look different
 *  Metrics note — what to expect from HRV/RHR/sleep in this phase
 *  Training advice for the phase
 *  Next period estimate
 *  "Log period start" button (always accessible for quick logging)
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import {
  getPhaseInfo,
  nextPeriodLabel,
  type CyclePhase,
  type CycleState,
} from '@services/cycleTracking';

// ─── Cycle arc progress ───────────────────────────────────────────────────────

function CycleProgress({
  progress,
  phase,
  color,
}: {
  progress:  number;
  phase:     CyclePhase;
  color:     string;
}) {
  // 28 dots in a horizontal row — filled = complete days
  const TOTAL = 28;
  const filled = Math.round(progress * TOTAL);

  return (
    <View style={progressStyles.row}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            i < filled
              ? { backgroundColor: color }
              : { backgroundColor: 'rgba(255,255,255,0.10)' },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    flexWrap:       'nowrap',
    gap:            3,
    alignItems:     'center',
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    flexShrink:   0,
  },
});

// ─── Expandable detail section ────────────────────────────────────────────────

function DetailSection({
  label,
  text,
  color,
}: {
  label: string;
  text:  string;
  color: string;
}) {
  return (
    <View style={detailStyles.section}>
      <Text style={[detailStyles.label, { color }]}>{label}</Text>
      <Text style={detailStyles.text}>{text}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  section: {
    gap: 4,
  },
  label: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.8,
  },
  text: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 20,
  },
});

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  cycleState: CycleState;
  onLogToday: () => Promise<void>;
}

export function CyclePhaseCard({ cycleState, onLogToday }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [logging,  setLogging]    = useState(false);

  const { phase, dayOfCycle, daysUntilNext, cycleProgress } = cycleState;
  const info = getPhaseInfo(phase);

  const handleLogToday = async () => {
    setLogging(true);
    try {
      await onLogToday();
    } finally {
      setLogging(false);
    }
  };

  return (
    <View style={[styles.card, { borderColor: info.color + '30' }]}>
      {/* ── Header row ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.phaseBadge, { backgroundColor: info.colorDim }]}>
            <Text style={styles.phaseEmoji}>{info.emoji}</Text>
            <Text style={[styles.phaseName, { color: info.color }]}>{info.name}</Text>
          </View>
          <Text style={styles.dayLabel}>Day {dayOfCycle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setExpanded(e => !e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
          style={styles.expandBtn}
        >
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Cycle progress dots ── */}
      <CycleProgress progress={cycleProgress} phase={phase} color={info.color} />

      {/* ── Readiness context note ── */}
      <Text style={styles.readinessNote}>{info.readinessNote}</Text>

      {/* ── Expanded detail ── */}
      {expanded && (
        <View style={styles.detail}>
          <View style={[styles.divider, { backgroundColor: info.color + '25' }]} />

          <DetailSection
            label="WHAT'S HAPPENING"
            text={info.phaseDesc}
            color={info.color}
          />
          <DetailSection
            label="METRICS THIS PHASE"
            text={info.metricsNote}
            color={info.color}
          />
          <DetailSection
            label="TRAINING ADVICE"
            text={info.trainingAdvice}
            color={info.color}
          />
        </View>
      )}

      {/* ── Footer: next period + log button ── */}
      <View style={styles.footer}>
        <View style={styles.nextPeriodRow}>
          <Text style={styles.nextPeriodLabel}>Next period</Text>
          <Text style={[styles.nextPeriodValue, { color: info.color }]}>
            {nextPeriodLabel(daysUntilNext)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logBtn, { borderColor: info.color + '50', backgroundColor: info.colorDim }]}
          onPress={handleLogToday}
          disabled={logging}
          activeOpacity={0.75}
        >
          <Text style={[styles.logBtnText, { color: info.color }]}>
            {logging ? 'Logged ✓' : '+ Log period start'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  sex:        string | null;
  enabled:    boolean;
  cycleState: CycleState | null;
  hasEntries: boolean;
  onLogToday: () => Promise<void>;
}

export function CyclePhaseSection({
  sex,
  enabled,
  cycleState,
  hasEntries,
  onLogToday,
}: SectionProps) {
  // Only show for female users with tracking enabled and at least one entry
  if (sex !== 'female' || !enabled || !hasEntries || !cycleState) return null;

  return (
    <View style={sectionStyles.section}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.label}>CYCLE PHASE</Text>
        <Text style={sectionStyles.privacy}>🔒 stored on device only</Text>
      </View>
      <CyclePhaseCard cycleState={cycleState} onLogToday={onLogToday} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderWidth:     1,
    padding:         spacing[4],
    gap:             spacing[3],
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  phaseBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   4,
  },
  phaseEmoji: {
    fontSize: 13,
  },
  phaseName: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  dayLabel: {
    color:    colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  expandBtn: {
    padding: spacing[1],
  },
  expandIcon: {
    color:    colors.text.tertiary,
    fontSize: 10,
  },

  // ── Context note ──────────────────────────────────────────────────────────
  readinessNote: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 20,
  },

  // ── Expanded detail ───────────────────────────────────────────────────────
  detail: {
    gap: spacing[3],
  },
  divider: {
    height: 1,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing[2],
  },
  nextPeriodRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           spacing[1],
  },
  nextPeriodLabel: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  nextPeriodValue: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  logBtn: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingHorizontal: spacing[3],
    paddingVertical:   5,
  },
  logBtnText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});

const sectionStyles = StyleSheet.create({
  section: {
    marginBottom:      spacing[5],
    paddingHorizontal: spacing[4],
    gap:               spacing[2],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
  },
  label: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 2,
  },
  privacy: {
    color:    colors.text.tertiary,
    fontSize: 10,
  },
});
