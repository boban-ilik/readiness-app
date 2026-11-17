/**
 * WeeklyReportModal
 *
 * Full-screen Pro modal surfacing the weekly AI readiness report.
 * Sections:
 *   1. Header — week range + trend badge
 *   2. Score summary — big avg, best/worst day chips
 *   3. Mini bar chart — 7 days of scores as coloured bars
 *   4. Component performance — recovery / sleep / stress avg bars
 *   5. AI narrative — the summary paragraph
 *   6. Actionable tip — highlighted call-to-action card
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIN_DAYS_FOR_TREND } from '@utils/trendChart';
import { Ionicons } from '@expo/vector-icons';
import { fetchWeeklyReport, type WeeklyReport, type WeeklyReportScore } from '@services/weeklyReport';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  radius,
  surface,
  typography,
  getScoreColor,
  getScoreLabel,
} from '@constants/theme';
import { localDateStr } from '@utils/index';
import { startSkeletonPulse } from '@utils/motion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}

function weekRangeLabel(scores: WeeklyReportScore[]): string {
  if (scores.length === 0) return '';
  const first = shortDate(scores[0].date);
  const last  = shortDate(scores[scores.length - 1].date);
  return `${first} – ${last}`;
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => startSkeletonPulse(opacity, 0.35, 0.65, 800), [opacity]);

  const widths = ['92%', '85%', '70%', '88%', '76%'];
  return (
    <View style={{ gap: spacing[2] }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.skeletonLine, { width: widths[i % widths.length] as any, opacity }]}
        />
      ))}
    </View>
  );
}

// ─── Trend status ─────────────────────────────────────────────────────────────
// Plain coloured text with an arrow: a computed status, not a control.

function TrendBadge({ trend }: { trend?: 'improving' | 'declining' | 'stable' }) {
  if (!trend) return null;
  const cfg = ({
    improving: { icon: 'arrow-up',   label: 'Improving', color: colors.score.good    },
    declining: { icon: 'arrow-down', label: 'Declining', color: colors.score.poor    },
    stable:    { icon: 'remove',     label: 'Stable',    color: colors.text.tertiary },
  } as const)[trend];

  return (
    <View style={styles.trend}>
      <Ionicons name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[styles.trendText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Mini score bar chart ─────────────────────────────────────────────────────

const BAR_MAX_H = 72;

function MiniBarChart({ scores }: { scores: WeeklyReportScore[] }) {
  const todayStr = localDateStr();
  return (
    <View style={styles.barChart}>
      {scores.map(day => {
        const color   = getScoreColor(day.score);
        const barH    = Math.max(6, (day.score / 100) * BAR_MAX_H);
        const isToday = day.date === todayStr;
        return (
          <View key={day.date} style={styles.barCol}>
            {/* Score label above bar */}
            <Text style={[styles.barScore, { color }]}>{day.score}</Text>
            {/* Bar */}
            <View style={styles.barTrackWrap}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: barH, backgroundColor: color + (isToday ? 'FF' : 'BB') },
                  ]}
                />
              </View>
            </View>
            {/* Day label below */}
            <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
              {day.dayLabel.slice(0, 1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Component performance row ────────────────────────────────────────────────

function ComponentBar({
  label,
  value,
  isTop,
  isWeak,
}: {
  label:  string;
  value:  number;
  isTop:  boolean;
  isWeak: boolean;
}) {
  return (
    <View style={styles.compRow}>
      <View style={styles.compHead}>
        <View style={styles.compLabelWrap}>
          <Text style={styles.compLabel}>{label}</Text>
          {isTop  && <Text style={styles.compTag}>TOP</Text>}
          {isWeak && <Text style={styles.compTag}>FOCUS</Text>}
        </View>
        <Text style={styles.compValue}>{value}</Text>
      </View>
      <View style={styles.compBarTrack}>
        <View style={[styles.compBarFill, { width: `${value}%` as any, backgroundColor: getScoreColor(value) }]} />
      </View>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface WeeklyReportModalProps {
  visible:  boolean;
  onClose:  () => void;
}

export default function WeeklyReportModal({ visible, onClose }: WeeklyReportModalProps) {
  const [report,  setReport]  = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Only re-fetch if we don't already have a report loaded this session
    if (report) return;
    load();
  }, [visible]);

  async function load(forceRefresh = false) {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchWeeklyReport(forceRefresh);
      setReport(r);
    } catch (e: any) {
      setErr(e.message ?? 'Could not load weekly report.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setReport(null);
    await load(true);
  }

  // ── Computed display values ──────────────────────────────────────────────────
  const avgScore  = report?.avgScore ?? null;
  const avgColor  = avgScore !== null ? getScoreColor(avgScore) : colors.text.tertiary;
  const avgLabel  = avgScore !== null ? getScoreLabel(avgScore) : '-';
  const scores    = report?.scores ?? [];
  const rangeText = scores.length > 0 ? weekRangeLabel(scores) : (report?.weekOf ? shortDate(report.weekOf) : '');

  const avgRecovery = scores.length > 0
    ? Math.round(scores.reduce((a, s) => a + s.components.recovery, 0) / scores.length)
    : null;
  const avgSleep = scores.length > 0
    ? Math.round(scores.reduce((a, s) => a + s.components.sleep, 0) / scores.length)
    : null;
  const avgStress = scores.length > 0
    ? Math.round(scores.reduce((a, s) => a + s.components.stress, 0) / scores.length)
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Nav bar ──────────────────────────────────────────────────── */}
        <View style={styles.navBar}>
          <View style={styles.navLeft}>
            <Text style={styles.navTitle}>Weekly Report</Text>
            {rangeText ? <Text style={styles.navSub}>{rangeText}</Text> : null}
          </View>
          <View style={styles.navRight}>
            {!loading && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handleRefresh}
                activeOpacity={0.7}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel="Refresh report"
              >
                <Ionicons name="refresh" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.navBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Loading ───────────────────────────────────────────────── */}
          {loading && (
            <View style={styles.loadingBlock}>
              <View style={[styles.card, { gap: spacing[5] }]}>
                <View style={styles.loadingHeader}>
                  <ActivityIndicator color={colors.amber[400]} size="small" />
                  <Text style={styles.loadingText}>Analysing your week…</Text>
                </View>
                <SkeletonBlock lines={2} />
                <SkeletonBlock lines={3} />
              </View>
            </View>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {!loading && err && (
            <View style={styles.errCard}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={styles.errText}>{err}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => load()} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Report content ───────────────────────────────────────── */}
          {!loading && report && (
            <>

              {/* 1. Score summary */}
              <View style={styles.card}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    {/* A 3-day average is not a week's: say how many days it covers. */}
                    <Text style={styles.sectionLabel}>
                      {scores.length > 0 && scores.length < 7 ? `AVERAGE · ${scores.length} OF 7 DAYS` : 'WEEK AVERAGE'}
                    </Text>
                    <Text style={[styles.bigScore, { color: avgColor }]}>
                      {avgScore ?? '-'}
                    </Text>
                    <Text style={[styles.bigScoreLabel, { color: avgColor }]}>
                      {avgLabel}
                    </Text>
                  </View>
                  <View style={styles.summaryRight}>
                    {/* No direction from fewer than four days, whatever the
                        server or an older cached report says. */}
                    {scores.length >= MIN_DAYS_FOR_TREND && <TrendBadge trend={report.trend} />}
                    <View style={styles.dayStats}>
                      {report.bestDay && (
                        <View style={styles.dayStat}>
                          <Text style={styles.sectionLabel}>BEST</Text>
                          <Text style={[styles.dayStatScore, { color: getScoreColor(report.bestDay.score) }]}>
                            {report.bestDay.score}
                          </Text>
                          <Text style={styles.dayStatDay}>{report.bestDay.dayLabel}</Text>
                        </View>
                      )}
                      {report.worstDay && report.worstDay.date !== report.bestDay?.date && (
                        <View style={styles.dayStat}>
                          <Text style={styles.sectionLabel}>LOWEST</Text>
                          <Text style={[styles.dayStatScore, { color: getScoreColor(report.worstDay.score) }]}>
                            {report.worstDay.score}
                          </Text>
                          <Text style={styles.dayStatDay}>{report.worstDay.dayLabel}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Mini bar chart */}
              {scores.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>READINESS · {scores.length} DAYS</Text>
                  <MiniBarChart scores={scores} />
                </View>
              )}

              {/* 3. Component performance */}
              {avgRecovery !== null && avgSleep !== null && avgStress !== null && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>COMPONENT AVERAGES</Text>
                  <View style={styles.compList}>
                    <ComponentBar
                      label="Recovery"
                      value={avgRecovery}
                      isTop={report.topComponent === 'recovery'}
                      isWeak={report.weakComponent === 'recovery'}
                    />
                    <ComponentBar
                      label="Sleep"
                      value={avgSleep}
                      isTop={report.topComponent === 'sleep'}
                      isWeak={report.weakComponent === 'sleep'}
                    />
                    <ComponentBar
                      label="Stress"
                      value={avgStress}
                      isTop={report.topComponent === 'stress'}
                      isWeak={report.weakComponent === 'stress'}
                    />
                  </View>
                </View>
              )}

              {/* 4. AI narrative */}
              <View style={styles.card}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>THIS WEEK</Text>
                  <Text style={styles.sectionTag}>AI</Text>
                </View>
                <Text style={styles.summary}>{report.summary}</Text>
              </View>

              {/* 5. Actionable tip */}
              {!!report.tip && (
                <View style={styles.card}>
                  <View style={styles.tipHeader}>
                    <Ionicons name="bulb-outline" size={16} color={colors.amber[400]} />
                    <Text style={styles.tipLabel}>THIS WEEK'S FOCUS</Text>
                  </View>
                  <Text style={styles.tipText}>{report.tip}</Text>
                </View>
              )}

              {/* Footer */}
              <Text style={styles.footer}>
                Generated {shortDate(report.weekOf)} · Updates each Monday
              </Text>

            </>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Nav bar
  navBar: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
  },
  navLeft: {
    flex: 1,
  },
  navTitle: {
    ...typography.heading,
  },
  navSub: {
    ...typography.caption,
    marginTop: 2,
  },
  navRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  navBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    gap:               spacing[3],
  },

  // Loading
  loadingBlock: {
    flex: 1,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  loadingText: {
    color:    colors.text.secondary,
    fontSize: fontSize.sm,
  },

  // Error
  errCard: {
    ...surface.card,
    padding:    spacing[5],
    alignItems: 'center',
    gap:        spacing[3],
  },
  errText: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    textAlign:  'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: colors.amber[400],
    borderRadius:    radius.md,
    paddingVertical:   spacing[2.5],
    paddingHorizontal: spacing[5],
  },
  retryBtnText: {
    color:      colors.text.inverse,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },

  // Generic card
  card: {
    ...surface.card,
    padding: spacing[4],
    gap:     spacing[3],
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

  // Score summary
  summaryRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  summaryLeft: {
    flex: 1,
    gap:  spacing[0.5],
  },
  bigScore: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize['5xl'],
    lineHeight:    68,
    letterSpacing: -1.5,
  },
  bigScoreLabel: {
    fontSize:   14,
    fontWeight: fontWeight.semiBold,
  },
  summaryRight: {
    alignItems: 'flex-end',
    gap:        spacing[4],
  },
  trend: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
  },
  trendText: {
    fontSize:   13,
    fontWeight: fontWeight.semiBold,
  },
  dayStats: {
    flexDirection: 'row',
    gap:           spacing[5],
  },
  dayStat: {
    alignItems: 'flex-end',
    gap:        2,
  },
  dayStatScore: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize.xl,
    letterSpacing: -0.5,
  },
  dayStatDay: {
    ...typography.caption,
  },

  // Mini bar chart
  barChart: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    paddingTop:     spacing[1],
  },
  barCol: {
    flex:      1,
    alignItems: 'center',
    gap:        spacing[1],
  },
  barScore: {
    fontFamily: fontFamily.numeral,
    fontSize:   13,
  },
  barTrackWrap: {
    width:      '70%',
    height:     BAR_MAX_H,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width:           '100%',
    backgroundColor: colors.bg.tertiary,
    borderRadius:    3,
    overflow:        'hidden',
    justifyContent:  'flex-end',
  },
  barFill: {
    width:        '100%',
    borderRadius: 3,
  },
  barLabel: {
    color:    colors.text.tertiary,
    fontSize: 11,
  },
  barLabelToday: {
    color:      colors.amber[400],
    fontWeight: fontWeight.bold,
  },

  // Component bars: label and value on one line, a thin track under them
  compList: {
    gap: spacing[4],
  },
  compRow: {
    gap: spacing[2],
  },
  compHead: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
  },
  compLabelWrap: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           spacing[2],
  },
  compLabel: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  compTag: {
    fontSize:      11,
    letterSpacing: 1.2,
    fontWeight:    fontWeight.bold,
    color:         colors.amber[400],
  },
  compBarTrack: {
    height:          4,
    backgroundColor: colors.bg.tertiary,
    borderRadius:    2,
    overflow:        'hidden',
  },
  compBarFill: {
    height:       4,
    borderRadius: 2,
  },
  compValue: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize.lg,
    letterSpacing: -0.5,
    color:         colors.text.primary,
  },

  // AI narrative
  summary: {
    ...typography.body,
  },

  // Tip card
  tipHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1.5],
  },
  tipLabel: {
    ...typography.label,
    color: colors.amber[400],
  },
  tipText: {
    ...typography.body,
  },

  footer: {
    color:     colors.text.tertiary,
    fontSize:  fontSize.xs,
    textAlign: 'center',
    marginTop: -spacing[1],
  },

  skeletonLine: {
    height:          13,
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.xs,
  },

  bottomPad: {
    height: spacing[8],
  },
});
