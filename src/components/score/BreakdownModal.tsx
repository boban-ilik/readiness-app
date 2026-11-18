/**
 * BreakdownModal
 *
 * The score detail sheet for Recovery, Sleep, Stress and Activity (the 1.3
 * design). One background and flat sections under 11 pt labels: what went
 * in, the 30-day trend, what it means, today's recommendation. Pro users get
 * the AI interpretation and advice in place of the static copy. Free users
 * see the static copy and, at the end, a locked "why it moved" block that
 * opens the paywall: the lock sits where they are most curious.
 */

import {
  Animated,
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRef, useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { HealthData } from '../../types/index';
import { buildBreakdownDetail, recoveryStatus, type MetricRow } from '@utils/breakdown';
import { startSkeletonPulse } from '@utils/motion';
import { useAIInsight }    from '@hooks/useAIInsight';
import { useMetricHistory } from '@hooks/useMetricHistory';
import MetricSparkline      from '@components/score/MetricSparkline';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  surface,
  typography,
  getScoreColor,
} from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreakdownModalProps {
  visible:            boolean;
  onClose:            () => void;
  component:          'recovery' | 'sleep' | 'stress' | 'activity' | null;
  score:              number;
  healthData:         HealthData | null;
  rhrBaseline:        number;
  hrvBaseline:        number;   // personal 30-day HRV baseline (ms)
  /** Whether the user has an active Pro subscription — enables AI insights */
  isPro?:             boolean;
  /** Called when user taps "Enter heart rate variability" on the Recovery sheet */
  onEnterManualHRV?:  () => void;
  /** Called when user taps "Clear manual entry" to remove today's manual HRV */
  onClearManualHRV?:  () => void;
  /** Called when a free user taps the locked insight — show the paywall */
  onUpgrade?:         () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusValueColor(status: MetricRow['status']): string {
  switch (status) {
    case 'good':    return colors.score.optimal;
    case 'ok':      return colors.amber[400];
    case 'poor':    return colors.score.poor;
    default:        return colors.text.secondary;
  }
}

/** Derive a score label without importing the full buildBreakdownDetail. */
function scoreLabel(score: number): string {
  if (score >= 85) return 'Optimal';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Reduced';
  return 'Low';
}

const ARC_SIZE   = 88;
const ARC_STROKE = 6;

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeaderArc({ score, color }: { score: number; color: string }) {
  const r      = (ARC_SIZE - ARC_STROKE) / 2;
  const c      = 2 * Math.PI * r;
  const center = ARC_SIZE / 2;
  const filled = c * Math.min(Math.max(score, 0), 100) / 100;
  return (
    <Svg width={ARC_SIZE} height={ARC_SIZE}>
      <Circle cx={center} cy={center} r={r} stroke={colors.bg.secondary} strokeWidth={ARC_STROKE} fill="none" />
      {filled > 0 && (
        <Circle
          cx={center} cy={center} r={r}
          stroke={color} strokeWidth={ARC_STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={[filled, c]}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </Svg>
  );
}

function SectionLabel({ title, tag }: { title: string; tag?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel} accessibilityRole="header">{title}</Text>
      {!!tag && <Text style={styles.sectionTag}>{tag}</Text>}
    </View>
  );
}

function MetricItem({ metric, last, children }: { metric: MetricRow; last: boolean; children?: React.ReactNode }) {
  return (
    <View style={[styles.metricRow, !last && styles.metricDivider]}>
      <View style={styles.metricMain}>
        <View style={styles.metricText}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          {metric.sub ? <Text style={styles.metricSub}>{metric.sub}</Text> : null}
        </View>
        {/* Numbers in the numeral face; a word ("Moderate") in the text face. */}
        <Text style={[/\d/.test(metric.value) ? styles.metricValue : styles.metricWord, { color: statusValueColor(metric.status) }]}>
          {metric.value}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Pulsing skeleton line — shown while AI content is loading */
function SkeletonLine({
  pulseAnim,
  width = '100%',
  height = 14,
  style,
}: {
  pulseAnim: Animated.Value;
  width?:    number | string;
  height?:   number;
  style?:    object;
}) {
  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        { width, height, opacity: pulseAnim },
        style,
      ]}
    />
  );
}

/**
 * The Pro block a free user sees at the end of the sheet. The copy is honest
 * about what is behind the lock; it shows no sample insight, because the
 * insight function has no free allowance yet and a canned teaser would read
 * as a trick the second day. When that allowance exists, the first line and
 * a half of the real insight go here, the rest blurred.
 */
function LockedInsight({ componentLabel, onUpgrade }: { componentLabel: string; onUpgrade?: () => void }) {
  return (
    <View style={styles.block}>
      <SectionLabel title="WHY IT MOVED" tag="PRO" />
      <TouchableOpacity
        style={styles.lockedCard}
        activeOpacity={onUpgrade ? 0.75 : 1}
        onPress={onUpgrade}
        accessibilityRole="button"
        accessibilityLabel={`The AI read on today's ${componentLabel}, a Pro feature. Opens Readiness Pro`}
      >
        <Text style={styles.lockedTitle}>The AI read on today's {componentLabel}</Text>
        <Text style={styles.lockedBody}>
          What moved your numbers since yesterday and what to do about it, written from your own data each morning.
        </Text>
        <View style={styles.lockedButton}>
          <Ionicons name="lock-closed" size={14} color={colors.bg.primary} />
          <Text style={styles.lockedButtonText}>Read the full insight</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BreakdownModal({
  visible,
  onClose,
  component,
  score,
  healthData,
  rhrBaseline,
  hrvBaseline,
  isPro = false,
  onEnterManualHRV,
  onClearManualHRV,
  onUpgrade,
}: BreakdownModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.round(screenHeight * 0.86);

  // ── Skeleton pulse animation ───────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0.35)).current;
  const pulseLoop = useRef<(() => void) | null>(null);

  // ── AI insight (Pro only) ─────────────────────────────────────────────────
  // Must be called before any conditional returns (Rules of Hooks).
  const statusLabelStr = component === 'recovery' ? recoveryStatus(score).label : scoreLabel(score);
  const { insight: aiInsight, isLoading: aiLoading } = useAIInsight({
    component,
    score,
    statusLabel: statusLabelStr,
    healthData,
    rhrBaseline,
    hrvBaseline,
    isPro,
    enabled:     visible,
  });

  // Start / stop the skeleton pulse in sync with aiLoading
  useEffect(() => {
    if (aiLoading) {
      pulseAnim.setValue(0.35);
      // Respect reduced motion: the helper leaves the static 0.35 opacity
      // when the OS setting is on.
      pulseLoop.current = startSkeletonPulse(pulseAnim, 0.35, 0.7, 700);
    } else {
      pulseLoop.current?.();
      pulseLoop.current = null;
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => { pulseLoop.current?.(); };
  }, [aiLoading, pulseAnim]);

  // ── 30-day metric history (for sparkline) — not shown for activity ────────
  const showSparkline = component !== null && component !== 'activity';
  const { data: historyData, isLoading: historyLoading } = useMetricHistory(
    component,
    visible && showSparkline,
  );

  // Sparkline width = sheet width minus horizontal padding on both sides
  const sparklineWidth = screenWidth - spacing[5] * 2;

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!component) return null;

  const detail = buildBreakdownDetail(component, score, healthData, rhrBaseline, hrvBaseline);

  // Determine what to show in each text section:
  const showAIContent = isPro && !!aiInsight && !aiLoading;
  const showSkeleton  = isPro && aiLoading && component !== 'activity';
  const weightLabel   = detail.weight.includes('%') ? `${detail.weight} of your score` : 'context only';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* ── Backdrop — tap to dismiss ── */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close"
        accessibilityRole="button"
      />

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, { height: sheetHeight }]}>

        {/* Drag handle */}
        <View style={styles.handle} />

        {/* ── Scrollable content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header: arc, label, numeral, status, date ── */}
          <View style={styles.header}>
            <HeaderArc score={score} color={detail.statusColor} />
            <View style={styles.headerText}>
              <Text style={styles.sectionLabel}>{detail.label}, {weightLabel}</Text>
              <View style={styles.numeralRow}>
                <Text style={styles.numeral}>{Math.round(score)}</Text>
                <Text style={[styles.statusLabel, { color: detail.statusColor }]}>{detail.statusLabel}</Text>
              </View>
              {detail.dateContext && (
                <Text style={styles.dateContext}>{detail.dateContext}</Text>
              )}
            </View>
          </View>

          {/* ── What went in ── */}
          <View style={styles.block}>
            <SectionLabel title="WHAT WENT IN" />
            {detail.metrics.map((m, i) => {
              const isHrvRow = component === 'recovery' && m.label.startsWith('Heart Rate Variability');
              return (
                <MetricItem key={i} metric={m} last={i === detail.metrics.length - 1}>
                  {isHrvRow && healthData?.hrv === null && onEnterManualHRV && (
                    <TouchableOpacity style={styles.linkRow} onPress={onEnterManualHRV} accessibilityRole="button">
                      <Text style={styles.link}>Enter heart rate variability</Text>
                    </TouchableOpacity>
                  )}
                  {isHrvRow && healthData?.hrvSource === 'manual' && (
                    <View style={styles.linkRow}>
                      {onEnterManualHRV && (
                        <TouchableOpacity onPress={onEnterManualHRV} accessibilityRole="button">
                          <Text style={styles.link}>Update heart rate variability</Text>
                        </TouchableOpacity>
                      )}
                      {onClearManualHRV && (
                        <TouchableOpacity onPress={onClearManualHRV} accessibilityRole="button">
                          <Text style={styles.linkMuted}>Clear manual entry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </MetricItem>
              );
            })}
          </View>

          {/* ── 30-day trend (Recovery / Sleep / Stress only) ── */}
          {showSparkline && (
            <View style={styles.block}>
              <SectionLabel title="LAST 30 DAYS" />
              <MetricSparkline
                data={historyData}
                scoreColor={getScoreColor(score)}
                chartWidth={sparklineWidth}
                isLoading={historyLoading}
              />
            </View>
          )}

          {/* ── Interpretation ── */}
          <View style={styles.block}>
            <SectionLabel title="WHAT THIS MEANS" tag={showAIContent ? 'AI' : undefined} />
            {showSkeleton ? (
              <View style={styles.skeletonBlock}>
                <SkeletonLine pulseAnim={pulseAnim} width="95%" />
                <SkeletonLine pulseAnim={pulseAnim} width="88%" style={{ marginTop: spacing[2] }} />
                <SkeletonLine pulseAnim={pulseAnim} width="60%" style={{ marginTop: spacing[2] }} />
              </View>
            ) : (
              <Text style={styles.body}>
                {showAIContent ? aiInsight!.interpretation : detail.interpretation}
              </Text>
            )}
          </View>

          {/* ── Recommendation ── */}
          <View style={styles.block}>
            <SectionLabel title="TODAY'S RECOMMENDATION" tag={showAIContent ? 'AI' : undefined} />
            <View style={styles.adviceCard}>
              <Ionicons name="bulb-outline" size={22} color={colors.amber[400]} style={styles.adviceIcon} />
              {showSkeleton ? (
                <View style={{ flex: 1 }}>
                  <SkeletonLine pulseAnim={pulseAnim} width="90%" />
                  <SkeletonLine pulseAnim={pulseAnim} width="65%" style={{ marginTop: spacing[2] }} />
                </View>
              ) : (
                <Text style={styles.adviceText}>
                  {showAIContent ? aiInsight!.advice : detail.advice}
                </Text>
              )}
            </View>
          </View>

          {/* ── The lock, for free users, on the components that have an AI read ── */}
          {!isPro && component !== 'activity' && (
            <LockedInsight componentLabel={detail.label.toLowerCase()} onUpgrade={onUpgrade} />
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>

          {/* Safe area bottom padding on iOS */}
          {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Full-screen transparent backdrop
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  // Bottom sheet panel: the same background as the screen behind it
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius:  radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing[3],
  },

  // Drag handle pill
  handle: {
    width: 36,
    height: 5,
    backgroundColor: colors.border.default,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[5],
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    gap: spacing[7],
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           18,
  },
  headerText: {
    flex: 1,
    gap:  spacing[1],
  },
  numeralRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           spacing[2.5],
  },
  numeral: {
    ...typography.displayNumeral,
    fontSize:      56,
    letterSpacing: -1.5,
  },
  statusLabel: {
    fontSize:   14,
    fontWeight: fontWeight.semiBold,
  },
  dateContext: {
    fontSize: 13,
    color:    colors.text.secondary,
  },

  // ── Sections ──
  block: {
    gap: spacing[2.5],
  },
  sectionLabelRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...typography.label,
  },
  sectionTag: {
    fontSize:      11,
    letterSpacing: 1.2,
    fontWeight:    fontWeight.bold,
    color:         colors.amber[400],
  },

  // ── Metric rows ──
  metricRow: {
    paddingVertical: spacing[3.5],
    gap:             spacing[2],
  },
  metricDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  metricMain: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3.5],
  },
  metricText: {
    flex: 1,
    gap:  2,
  },
  metricLabel: {
    ...typography.title,
  },
  metricSub: {
    fontSize:   13,
    lineHeight: 17,
    color:      colors.text.secondary,
  },
  metricValue: {
    ...typography.rowNumeral,
    fontSize: fontSize.xl,
  },
  metricWord: {
    ...typography.title,
  },
  linkRow: {
    flexDirection: 'row',
    gap:           spacing[4],
  },
  link: {
    fontSize:   13,
    fontWeight: fontWeight.semiBold,
    color:      colors.amber[400],
  },
  linkMuted: {
    fontSize:   13,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.secondary,
  },

  // ── Body copy ──
  body: {
    ...typography.body,
  },
  skeletonBlock: {
    gap: 0,
  },
  skeletonLine: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.sm,
  },

  // ── Recommendation card ──
  adviceCard: {
    ...surface.card,
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[3.5],
    padding:       spacing[4],
  },
  adviceIcon: {
    width:     28,
    textAlign: 'center',
    marginTop: 1,
  },
  adviceText: {
    flex: 1,
    ...typography.body,
  },

  // ── Locked insight ──
  lockedCard: {
    ...surface.card,
    padding: spacing[4],
    gap:     spacing[2],
  },
  lockedTitle: {
    ...typography.title,
  },
  lockedBody: {
    ...typography.caption,
  },
  lockedButton: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[2],
    height:            38,
    paddingHorizontal: spacing[4],
    borderRadius:      radius.md,
    backgroundColor:   colors.amber[400],
    marginTop:         spacing[1.5],
  },
  lockedButtonText: {
    fontSize:   14,
    fontWeight: fontWeight.bold,
    color:      colors.bg.primary,
  },

  // ── Done ──
  closeBtn: {
    height:          48,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeBtnText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.secondary,
  },
  iosBottom: {
    height: spacing[5],
  },
});
