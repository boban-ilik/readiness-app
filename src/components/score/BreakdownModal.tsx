/**
 * BreakdownModal
 *
 * Polished slide-up bottom sheet for Recovery / Sleep / Stress detail.
 *
 * Phase 2B additions:
 *  • useAIInsight hook — fetches personalised copy from Claude API (Pro only)
 *  • Skeleton loader — pulsing placeholder while AI content fetches
 *  • AI badge — "✨ AI" pill next to section headers when showing AI copy
 *  • Pro upsell card — shown to free-tier users beneath the static advice
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
import type { HealthData } from '../../types/index';
import { buildBreakdownDetail, type MetricRow } from '@utils/breakdown';
import { useAIInsight }                          from '@hooks/useAIInsight';
import { useMetricHistory }                      from '@hooks/useMetricHistory';
import MetricSparkline                           from '@components/score/MetricSparkline';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
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
  /** Called when user taps "Enter HRV manually" on the Recovery modal */
  onEnterManualHRV?:  () => void;
  /** Called when user taps "Clear manual entry" to remove today's manual HRV */
  onClearManualHRV?:  () => void;
  /** Called when a free user taps the upsell card — show the paywall */
  onUpgrade?:         () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusValueColor(status: MetricRow['status']): string {
  switch (status) {
    case 'good':    return colors.score.optimal;
    case 'ok':      return colors.amber[400];
    case 'poor':    return colors.score.poor;
    default:        return colors.text.tertiary;
  }
}

function statusDotColor(status: MetricRow['status']): string {
  switch (status) {
    case 'good':    return colors.score.optimal;
    case 'ok':      return colors.amber[400];
    case 'poor':    return colors.score.poor;
    default:        return colors.text.tertiary;
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, aiActive }: { title: string; aiActive?: boolean }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {aiActive && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>✨ AI</Text>
        </View>
      )}
    </View>
  );
}

function MetricItem({ metric }: { metric: MetricRow }) {
  const dotColor   = statusDotColor(metric.status);
  const valueColor = statusValueColor(metric.status);

  return (
    <View style={styles.metricRow}>
      {/* Status dot */}
      <View style={[styles.metricDot, { backgroundColor: dotColor }]} />

      {/* Labels */}
      <View style={styles.metricLabels}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        {metric.sub ? <Text style={styles.metricSub}>{metric.sub}</Text> : null}
      </View>

      {/* Value — tinted by status */}
      <Text style={[styles.metricValue, { color: valueColor }]}>
        {metric.value}
      </Text>
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

/** Upsell card shown to free-tier users */
function ProUpsellCard({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.upsellCard}
      activeOpacity={onUpgrade ? 0.75 : 1}
      onPress={onUpgrade}
    >
      <Text style={styles.upsellIcon}>✨</Text>
      <View style={styles.upsellText}>
        <Text style={styles.upsellTitle}>AI-Powered Insights</Text>
        <Text style={styles.upsellBody}>
          Upgrade to Pro for personalised interpretation and daily recommendations
          generated by AI from your own biometric patterns.
        </Text>
        {onUpgrade && (
          <Text style={styles.upsellCta}>Upgrade to Pro →</Text>
        )}
      </View>
    </TouchableOpacity>
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
  const sheetHeight = Math.round(screenHeight * 0.74);

  // ── Animated bar ──────────────────────────────────────────────────────────
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      barAnim.setValue(0);
      Animated.timing(barAnim, {
        toValue:         score,
        duration:        600,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, score, barAnim]);

  const animatedBarWidth = barAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

  // ── Skeleton pulse animation ───────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0.35)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── AI insight (Pro only) ─────────────────────────────────────────────────
  // Must be called before any conditional returns (Rules of Hooks).
  const statusLabelStr = scoreLabel(score);
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
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.7,  duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => { pulseLoop.current?.stop(); };
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
      />

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, { height: sheetHeight }]}>

        {/* Drag handle */}
        <View style={styles.handle} />

        {/* ── Header row ── */}
        <View style={styles.cardHeader}>

          {/* Left: icon + name + weight + status badge */}
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardIcon}>{detail.icon}</Text>

            <View style={styles.cardHeaderText}>
              {/* Name + badge on the same row */}
              <View style={styles.nameBadgeRow}>
                <Text style={styles.cardName}>{detail.label}</Text>
                <View style={[
                  styles.badge,
                  { backgroundColor: detail.statusColor + '25', borderColor: detail.statusColor + '60' },
                ]}>
                  <Text style={[styles.badgeText, { color: detail.statusColor }]}>
                    {detail.statusLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardWeight}>
                {detail.weight.includes('%')
                  ? `${detail.weight} of readiness score`
                  : detail.weight}
              </Text>
              {detail.dateContext && (
                <Text style={styles.dateContext}>{detail.dateContext}</Text>
              )}
            </View>
          </View>

          {/* Right: score circle ring */}
          <View style={[styles.scoreCircle, { borderColor: detail.statusColor }]}>
            <Text style={[styles.scoreCircleNum, { color: detail.statusColor }]}>
              {Math.round(score)}
            </Text>
          </View>
        </View>

        {/* ── Animated progress bar ── */}
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { width: animatedBarWidth, backgroundColor: detail.statusColor },
            ]}
          />
        </View>

        <View style={styles.divider} />

        {/* ── Scrollable content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── 30-Day Trend (Recovery / Sleep / Stress only) ── */}
          {showSparkline && (
            <>
              <SectionHeader title="30-DAY TREND" />
              <MetricSparkline
                data={historyData}
                scoreColor={getScoreColor(score)}
                chartWidth={sparklineWidth}
                isLoading={historyLoading}
              />
            </>
          )}

          {/* Metrics */}
          <SectionHeader title="METRICS" />
          {detail.metrics.map((m, i) => {
            const isHrvRow = component === 'recovery'
              && (m.label === 'Heart Rate Variability' || m.label === 'Heart Rate Variability (manual)');
            return (
              <View key={i}>
                <MetricItem metric={m} />
                {isHrvRow && healthData?.hrv === null && onEnterManualHRV && (
                  <TouchableOpacity style={styles.manualBtn} onPress={onEnterManualHRV}>
                    <Text style={styles.manualBtnText}>✏️  Enter heart rate variability</Text>
                  </TouchableOpacity>
                )}
                {isHrvRow && healthData?.hrvSource === 'manual' && (
                  <View style={styles.manualActions}>
                    {onEnterManualHRV && (
                      <TouchableOpacity style={styles.manualBtnSmall} onPress={onEnterManualHRV}>
                        <Text style={styles.manualBtnTextSmall}>✏️  Update heart rate variability</Text>
                      </TouchableOpacity>
                    )}
                    {onClearManualHRV && (
                      <TouchableOpacity style={[styles.manualBtnSmall, styles.clearBtn]} onPress={onClearManualHRV}>
                        <Text style={styles.clearBtnText}>✕  Clear manual entry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* ── Interpretation ─────────────────────────────────────────────── */}
          <SectionHeader title="WHAT THIS MEANS" aiActive={showAIContent} />

          {showSkeleton ? (
            <View style={styles.skeletonBlock}>
              <SkeletonLine pulseAnim={pulseAnim} width="95%" />
              <SkeletonLine pulseAnim={pulseAnim} width="88%" style={{ marginTop: spacing[2] }} />
              <SkeletonLine pulseAnim={pulseAnim} width="60%" style={{ marginTop: spacing[2] }} />
            </View>
          ) : (
            <Text style={styles.bodyText}>
              {showAIContent ? aiInsight!.interpretation : detail.interpretation}
            </Text>
          )}

          {/* ── Recommendation ─────────────────────────────────────────────── */}
          <SectionHeader title="TODAY'S RECOMMENDATION" aiActive={showAIContent} />

          {showSkeleton ? (
            <View style={[styles.adviceCard, styles.skeletonAdviceCard]}>
              <SkeletonLine pulseAnim={pulseAnim} width={24} height={20} />
              <View style={{ flex: 1 }}>
                <SkeletonLine pulseAnim={pulseAnim} width="90%" />
                <SkeletonLine pulseAnim={pulseAnim} width="65%" style={{ marginTop: spacing[2] }} />
              </View>
            </View>
          ) : (
            <View style={styles.adviceCard}>
              <Text style={styles.adviceIcon}>💡</Text>
              <Text style={styles.adviceText}>
                {showAIContent ? aiInsight!.advice : detail.advice}
              </Text>
            </View>
          )}

          {/* ── Pro upsell (free users, non-activity components) ─────────── */}
          {!isPro && component !== 'activity' && (
            <ProUpsellCard onUpgrade={onUpgrade} />
          )}

          <View style={{ height: spacing[6] }} />
        </ScrollView>

        {/* ── Done button ── */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeBtnText}>Done</Text>
        </TouchableOpacity>

        {/* Safe area bottom padding on iOS */}
        {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
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

  // Bottom sheet panel
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius:  radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },

  // Drag handle pill
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.strong,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[5],
  },

  // ── Header ──────────────────────────────────────────────────────────────────

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
    marginRight: spacing[3],
  },
  cardIcon: {
    fontSize: 30,
    lineHeight: 38,
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing[1],
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  cardName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // Status badge — inline with component name
  badge: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.4,
  },

  cardWeight: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },

  dateContext: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 1,
    opacity: 0.75,
  },

  // Score ring — coloured border circle, score number inside
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scoreCircleNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
  },

  // ── Progress bar ─────────────────────────────────────────────────────────────

  barTrack: {
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // ── Divider ──────────────────────────────────────────────────────────────────

  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginBottom: spacing[4],
  },

  // ── Scrollable body ───────────────────────────────────────────────────────────

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[2],
  },

  // Section header row — title + optional AI badge
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  sectionHeader: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },

  // "✨ AI" pill — shown when AI content is active
  aiBadge: {
    backgroundColor: colors.amber[900] + '55',
    borderWidth: 1,
    borderColor: colors.amber[700] + '80',
    borderRadius: radius.full,
    paddingHorizontal: spacing[1.5],
    paddingVertical: 1,
  },
  aiBadgeText: {
    color: colors.amber[400],
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // ── Metric rows ───────────────────────────────────────────────────────────────

  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[3],
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  metricLabels: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  metricSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  metricValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    textAlign: 'right',
  },

  // ── Manual HRV actions ────────────────────────────────────────────────────────

  manualBtn: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
    alignSelf: 'flex-start',
    backgroundColor: colors.amber[900] + '55',
    borderWidth: 1,
    borderColor: colors.amber[700] + '80',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  manualBtnText: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },

  manualActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  manualBtnSmall: {
    alignSelf: 'flex-start',
    backgroundColor: colors.amber[900] + '55',
    borderWidth: 1,
    borderColor: colors.amber[700] + '80',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  manualBtnTextSmall: {
    color: colors.amber[400],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  clearBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.border.default,
  },
  clearBtnText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // ── Skeleton loader ───────────────────────────────────────────────────────────

  skeletonLine: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
  },
  skeletonBlock: {
    marginBottom: spacing[2],
  },
  skeletonAdviceCard: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },

  // ── Body text (interpretation) ────────────────────────────────────────────────

  bodyText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.65,
    marginBottom: spacing[2],
  },

  // ── Advice card ───────────────────────────────────────────────────────────────

  adviceCard: {
    backgroundColor: colors.amber[900] + '55',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.amber[700] + '80',
    borderLeftWidth: 3,
    borderLeftColor: colors.amber[400],
    padding: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  adviceIcon: {
    fontSize: fontSize.base,
    lineHeight: fontSize.sm * 1.65,
    flexShrink: 0,
  },
  adviceText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.65,
  },

  // ── Pro upsell card ───────────────────────────────────────────────────────────

  upsellCard: {
    marginTop: spacing[4],
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(139, 92, 246, 0.7)',
    padding: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  upsellIcon: {
    fontSize: fontSize.xl,
    flexShrink: 0,
  },
  upsellText: {
    flex: 1,
    gap: spacing[1],
  },
  upsellTitle: {
    color: 'rgba(196, 168, 255, 0.95)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  upsellBody: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.6,
    marginTop: 2,
  },
  upsellCta: {
    color: 'rgba(196, 168, 255, 0.9)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing[2],
  },

  // ── Done button ───────────────────────────────────────────────────────────────

  closeBtn: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  closeBtnText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },

  iosBottom: {
    height: spacing[6],
  },
});
