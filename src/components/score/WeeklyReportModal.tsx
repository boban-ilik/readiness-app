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
import { Ionicons } from '@expo/vector-icons';
import { fetchWeeklyReport, type WeeklyReport, type WeeklyReportScore } from '@services/weeklyReport';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  getScoreColor,
  getScoreLabel,
} from '@constants/theme';

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
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.65, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

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

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend?: 'improving' | 'declining' | 'stable' }) {
  if (!trend) return null;
  const cfg = {
    improving: { icon: '↑', label: 'Improving', bg: colors.success + '22', color: colors.success },
    declining: { icon: '↓', label: 'Declining',  bg: colors.error   + '22', color: colors.error   },
    stable:    { icon: '→', label: 'Stable',      bg: colors.warning + '22', color: colors.warning },
  }[trend];

  return (
    <View style={[styles.trendBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.trendBadgeText, { color: cfg.color }]}>
        {cfg.icon} {cfg.label}
      </Text>
    </View>
  );
}

// ─── Mini score bar chart ─────────────────────────────────────────────────────

const BAR_MAX_H = 72;

function MiniBarChart({ scores }: { scores: WeeklyReportScore[] }) {
  const todayStr = new Date().toISOString().split('T')[0];
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
  color,
  isTop,
  isWeak,
}: {
  label:  string;
  value:  number;
  color:  string;
  isTop:  boolean;
  isWeak: boolean;
}) {
  return (
    <View style={styles.compRow}>
      <View style={styles.compLabelWrap}>
        <Text style={[styles.compLabel, isTop && { color }]}>{label}</Text>
        {isTop  && <Text style={[styles.compBadge, { color, borderColor: color + '44' }]}>TOP</Text>}
        {isWeak && <Text style={[styles.compBadge, { color: colors.warning, borderColor: colors.warning + '44' }]}>FOCUS</Text>}
      </View>
      <View style={styles.compBarTrack}>
        <View style={[styles.compBarFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.compValue, { color }]}>{value}</Text>
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

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchWeeklyReport();
      setReport(r);
    } catch (e: any) {
      setErr(e.message ?? 'Could not load weekly report.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setReport(null);
    await load();
  }

  // ── Computed display values ──────────────────────────────────────────────────
  const avgScore  = report?.avgScore ?? null;
  const avgColor  = avgScore !== null ? getScoreColor(avgScore) : colors.text.tertiary;
  const avgLabel  = avgScore !== null ? getScoreLabel(avgScore) : '—';
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
              <TouchableOpacity style={styles.navBtn} onPress={handleRefresh} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.navBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
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
              <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
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
                    <Text style={styles.eyebrow}>WEEK AVERAGE</Text>
                    <Text style={[styles.bigScore, { color: avgColor }]}>
                      {avgScore ?? '—'}
                    </Text>
                    <Text style={[styles.bigScoreLabel, { color: avgColor }]}>
                      {avgLabel}
                    </Text>
                  </View>
                  <View style={styles.summaryRight}>
                    <TrendBadge trend={report.trend} />
                    <View style={styles.dayChips}>
                      {report.bestDay && (
                        <View style={styles.dayChip}>
                          <Text style={styles.dayChipLabel}>BEST</Text>
                          <Text style={[styles.dayChipScore, { color: getScoreColor(report.bestDay.score) }]}>
                            {report.bestDay.score}
                          </Text>
                          <Text style={styles.dayChipDay}>{report.bestDay.dayLabel}</Text>
                        </View>
                      )}
                      {report.worstDay && report.worstDay.date !== report.bestDay?.date && (
                        <View style={styles.dayChip}>
                          <Text style={styles.dayChipLabel}>LOWEST</Text>
                          <Text style={[styles.dayChipScore, { color: getScoreColor(report.worstDay.score) }]}>
                            {report.worstDay.score}
                          </Text>
                          <Text style={styles.dayChipDay}>{report.worstDay.dayLabel}</Text>
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
                      color={colors.error}
                      isTop={report.topComponent === 'recovery'}
                      isWeak={report.weakComponent === 'recovery'}
                    />
                    <ComponentBar
                      label="Sleep"
                      value={avgSleep}
                      color={colors.info}
                      isTop={report.topComponent === 'sleep'}
                      isWeak={report.weakComponent === 'sleep'}
                    />
                    <ComponentBar
                      label="Stress"
                      value={avgStress}
                      color={colors.warning}
                      isTop={report.topComponent === 'stress'}
                      isWeak={report.weakComponent === 'stress'}
                    />
                  </View>
                </View>
              )}

              {/* 4. AI narrative */}
              <View style={styles.card}>
                <View style={styles.aiHeaderRow}>
                  <Text style={styles.sectionLabel}>THIS WEEK</Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✨ AI</Text>
                  </View>
                </View>
                <Text style={styles.summary}>{report.summary}</Text>
              </View>

              {/* 5. Actionable tip */}
              {!!report.tip && (
                <View style={styles.tipCard}>
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
    paddingVertical:   spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  navLeft: {
    gap: 2,
  },
  navTitle: {
    color:      colors.text.primary,
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  navSub: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  navRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
  },
  navBtn: {
    padding: spacing[2],
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[4],
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
    backgroundColor: colors.bg.secondary,
    borderRadius:    radius.xl,
    padding:         spacing[5],
    alignItems:      'center',
    gap:             spacing[3],
    borderWidth:     1,
    borderColor:     colors.error + '44',
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
    backgroundColor: colors.bg.secondary,
    borderRadius:    radius.xl,
    padding:         spacing[5],
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    gap:             spacing[3],
  },
  sectionLabel: {
    color:       colors.text.tertiary,
    fontSize:    fontSize.xs,
    fontWeight:  fontWeight.semiBold,
    letterSpacing: 1.5,
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
  eyebrow: {
    color:        colors.text.tertiary,
    fontSize:     fontSize.xs,
    fontWeight:   fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  bigScore: {
    fontSize:   52,
    fontWeight: fontWeight.bold,
    lineHeight: 56,
  },
  bigScoreLabel: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop:  -spacing[1],
  },
  summaryRight: {
    alignItems: 'flex-end',
    gap:        spacing[3],
  },
  trendBadge: {
    borderRadius:    radius.full,
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[3],
  },
  trendBadgeText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  dayChips: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  dayChip: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.md,
    paddingVertical:   spacing[2],
    paddingHorizontal: spacing[3],
    alignItems:      'center',
    gap:             2,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
  },
  dayChipLabel: {
    color:        colors.text.tertiary,
    fontSize:     9,
    fontWeight:   fontWeight.semiBold,
    letterSpacing: 0.8,
  },
  dayChipScore: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 22,
  },
  dayChipDay: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
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
    fontSize:   9,
    fontWeight: fontWeight.bold,
  },
  barTrackWrap: {
    width:      '70%',
    height:     BAR_MAX_H,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width:           '100%',
    backgroundColor: colors.bg.elevated,
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
    fontSize: 10,
  },
  barLabelToday: {
    color:      colors.amber[400],
    fontWeight: fontWeight.bold,
  },

  // Component bars
  compList: {
    gap: spacing[3],
  },
  compRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  compLabelWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1.5],
    width:         82,
  },
  compLabel: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  compBadge: {
    fontSize:      8,
    fontWeight:    fontWeight.bold,
    letterSpacing: 0.5,
    borderWidth:   1,
    borderRadius:  radius.xs,
    paddingHorizontal: 4,
    paddingVertical:   1,
  },
  compBarTrack: {
    flex:            1,
    height:          8,
    backgroundColor: colors.bg.elevated,
    borderRadius:    4,
    overflow:        'hidden',
  },
  compBarFill: {
    height:       8,
    borderRadius: 4,
  },
  compValue: {
    width:      28,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    textAlign:  'right',
  },

  // AI section
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  aiBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderRadius:    radius.xs,
    paddingHorizontal: spacing[1.5],
    paddingVertical:   2,
    borderWidth:     1,
    borderColor:     'rgba(139, 92, 246, 0.30)',
  },
  aiBadgeText: {
    color:      '#a78bfa',
    fontSize:   9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  summary: {
    color:      colors.text.primary,
    fontSize:   fontSize.base,
    lineHeight: 26,
  },

  // Tip card
  tipCard: {
    backgroundColor: colors.amber[900],
    borderRadius:    radius.xl,
    padding:         spacing[5],
    borderWidth:     1,
    borderColor:     colors.amber[400] + '55',
    gap:             spacing[2],
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1.5],
  },
  tipLabel: {
    color:        colors.amber[400],
    fontSize:     fontSize.xs,
    fontWeight:   fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  tipText: {
    color:      colors.text.primary,
    fontSize:   fontSize.base,
    lineHeight: 24,
  },

  footer: {
    color:     colors.text.tertiary,
    fontSize:  fontSize.xs,
    textAlign: 'center',
    marginTop: -spacing[1],
  },

  skeletonLine: {
    height:          13,
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.xs,
  },

  bottomPad: {
    height: spacing[8],
  },
});
