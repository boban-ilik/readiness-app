/**
 * DailyBriefingModal
 *
 * Full-screen Pro modal with three layers:
 *
 *  1. AI Daily Briefing  — headline, overview, focus, action plan
 *  2. Recovery Protocol  — shown when score < 55: 3 concrete actions
 *  3. Coach Chat         — "Ask your coach" conversational Q&A grounded in real data
 */

import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchDailyBriefing, saveBriefingFeedback, type DailyBriefing } from '@services/dailyBriefing';
import { analyzePatterns, type PatternInsight } from '@services/patternAnalysis';
import { analyzeWorkload, type WorkloadResult } from '@services/workloadAnalysis';
import { fetchRecentEvents, type LifeEvent } from '@services/lifeEvents';
import { setCoachSession } from '@services/coachSession';
import { track } from '@services/analytics';
import { startSkeletonPulse } from '@utils/motion';
import { useSubscription } from '@contexts/SubscriptionContext';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData } from '@/types/index';
import { supabase } from '@services/supabase';
import { Ionicons } from '@expo/vector-icons';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyBriefingModalProps {
  visible:     boolean;
  onClose:     () => void;
  readiness:   ReadinessResult | null;
  healthData:  HealthData | null;
  rhrBaseline: number;
  hrvBaseline: number;
  /** A briefing was shown; `fresh` is false when today's cached one was reused. */
  onDelivered?: (fresh: boolean) => void;
}

// ─── Recovery Protocol ────────────────────────────────────────────────────────
// Rules-based 3-item care plan when score is low.
// Warm and specific — not generic "rest more" advice.

function getRecoveryProtocol(
  score:      number,
  components: ReadinessResult['components'],
): string[] | null {
  if (score >= 55) return null;

  const items: string[] = [];
  const recovery = components.recovery;
  const sleep    = components.sleep;
  const stress   = components.stress;

  // Pick the most actionable items based on which component is lowest
  if (recovery < sleep && recovery < stress) {
    // No heart-rate zones or protein amounts here: the app knows neither this
    // user's zones nor what they eat, and the nutrition card already sets a
    // protein target scaled to their bodyweight. A fixed "20 g" contradicted it.
    items.push('Skip caffeine until at least 10am, while your body is still processing overnight stress hormones');
    items.push('If you train today, keep it easy enough to hold a conversation, and cap it around 30 to 40 minutes');
    items.push('Eat a protein-rich breakfast within an hour of waking rather than delaying your first meal');
  } else if (sleep < recovery && sleep < stress) {
    items.push('Prioritise a consistent wind-down tonight, with screens off by 9:30pm if possible');
    items.push('A 10 to 20 min nap before 2pm can partially offset last night\'s deficit without disrupting tonight');
    items.push('Avoid alcohol today: even one drink will suppress the deep sleep you need to recover');
  } else {
    items.push('Try 5 minutes of box breathing (4s in, 4s hold, 4s out, 4s hold) before your first task');
    items.push('Block at least one 30-min window with zero notifications today, so your nervous system gets some quiet');
    items.push('Move, but gently: a 20-min walk lowers cortisol more effectively than skipping activity entirely');
  }

  return items;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ width = '100%' as const }: { width?: `${number}%` | number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => startSkeletonPulse(anim, 0.3, 0.7, 700), [anim]);
  return <Animated.View style={[styles.skeletonLine, { width, opacity: anim }]} />;
}

function SkeletonContent() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonLine width="75%" />
      <View style={{ height: spacing[5] }} />
      <Text style={styles.sectionLabel}>WHAT'S HAPPENING</Text>
      <View style={{ height: spacing[2] }} />
      <SkeletonLine /><View style={{ height: spacing[1] }} />
      <SkeletonLine /><View style={{ height: spacing[1] }} />
      <SkeletonLine width="60%" />
      <View style={{ height: spacing[5] }} />
      <Text style={styles.sectionLabel}>DO TODAY</Text>
      <View style={{ height: spacing[2] }} />
      <SkeletonLine width="90%" /><View style={{ height: spacing[1] }} />
      <SkeletonLine width="80%" /><View style={{ height: spacing[1] }} />
      <SkeletonLine width="70%" />
    </View>
  );
}

// ─── Component pills ──────────────────────────────────────────────────────────

function ComponentPill({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillScore, { color }]}>{score}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Briefing feedback row ────────────────────────────────────────────────────
// Shows "Was this helpful?" with thumbs up and down. On tap, saves to AsyncStorage
// and shows a one-line acknowledgement. Feedback is sent to the edge function
// the next morning so the AI can calibrate specificity.

function BriefingFeedbackRow({ date }: { date: string }) {
  const [rating, setRating] = useState<'helpful' | 'unhelpful' | null>(null);

  async function handleRate(r: 'helpful' | 'unhelpful') {
    setRating(r);
    await saveBriefingFeedback(date, r);
  }

  if (rating) {
    return (
      <View style={styles.feedbackRow}>
        <Text style={styles.feedbackThanks}>
          {rating === 'helpful'
            ? 'Glad it helped, keep the feedback coming'
            : "Got it, I'll be more specific next time"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.feedbackRow}>
      <Text style={styles.feedbackPrompt}>Was this helpful?</Text>
      <View style={styles.feedbackBtns}>
        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => handleRate('helpful')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Helpful briefing"
        >
          <Ionicons name="thumbs-up-outline" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => handleRate('unhelpful')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Not helpful"
        >
          <Ionicons name="thumbs-down-outline" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function DailyBriefingModal({
  visible,
  onClose,
  readiness,
  healthData,
  rhrBaseline,
  hrvBaseline,
  onDelivered,
}: DailyBriefingModalProps) {
  const router = useRouter();
  const { isPro, presentPaywall } = useSubscription();
  const [briefing,     setBriefing]     = useState<DailyBriefing | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const patternsRef   = useRef<PatternInsight[]>([]);
  const workloadRef   = useRef<WorkloadResult | null>(null);
  const lifeEventsRef = useRef<LifeEvent[]>([]);

  const score      = readiness ? Math.round(readiness.score) : 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const protocol   = readiness ? getRecoveryProtocol(score, readiness.components) : null;

  // Load on open
  useEffect(() => {
    if (!visible || !readiness || !healthData) return;

    // Pre-load patterns + workload + life events in parallel
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        analyzePatterns(data.user.id)
          .then(p => { patternsRef.current = p; })
          .catch(() => {});
      }
    });
    analyzeWorkload()
      .then(w => { workloadRef.current = w; })
      .catch(() => {});
    fetchRecentEvents(7)
      .then(e => { lifeEventsRef.current = e; })
      .catch(() => {});
    load();
  }, [visible]);

  async function load(forceRefresh = false) {
    if (!readiness || !healthData) return;
    setIsLoading(true);
    setError(null);
    try {
      if (forceRefresh) {
        const { data } = await supabase.auth.getUser();
        const [freshPatterns, freshWorkload, freshEvents] = await Promise.all([
          data.user ? analyzePatterns(data.user.id).catch(() => []) : Promise.resolve([]),
          analyzeWorkload().catch(() => null),
          fetchRecentEvents(7).catch(() => []),
        ]);
        patternsRef.current   = freshPatterns;
        workloadRef.current   = freshWorkload;
        lifeEventsRef.current = freshEvents;
      }
      const { briefing: result, fresh } = await fetchDailyBriefing(
        readiness, healthData, rhrBaseline, hrvBaseline, forceRefresh,
        patternsRef.current,
        workloadRef.current,
        lifeEventsRef.current,
      );
      setBriefing(result);
      onDelivered?.(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load briefing');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenCoach(question?: string) {
    // From 1.0.4 free users reach the coach too: the server allows them three
    // questions a week and the coach screen shows what's left.
    if (!readiness || !healthData) return;
    if (question) track('coach_followup_tapped', { pro: isPro });
    setCoachSession({
      readiness,
      healthData,
      rhrBaseline,
      hrvBaseline,
      patterns: patternsRef.current,
      workload: workloadRef.current,
      lifeEvents: lifeEventsRef.current,
    });
    onClose();
    router.push(question
      ? { pathname: '/coach-chat', params: { q: question, source: 'briefing' } }
      : '/coach-chat');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {/* A Modal renders in its own native view hierarchy, outside the app's
          SafeAreaProvider, so SafeAreaView here resolved a top inset of zero
          and drew the score straight under the status bar and notch. Seeding a
          provider with the window metrics restores the real insets. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

          {/* ── Score header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerScore, { color: scoreColor }]}>{score}</Text>
              <View>
                <Text style={[styles.headerLabel, { color: scoreColor }]}>{scoreLabel.toUpperCase()}</Text>
                <Text style={styles.headerSub}>Today's readiness</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {/* Regenerate is metered; the free weekly briefing is one call. */}
              {isPro && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => load(true)}
                  disabled={isLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Regenerate briefing"
                >
                  <Ionicons name="refresh" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Component pills ── */}
          {readiness && (
            <View style={styles.pills}>
              <ComponentPill label="Recovery" score={Math.round(readiness.components.recovery)} />
              <ComponentPill label="Sleep"    score={Math.round(readiness.components.sleep)} />
              <ComponentPill label="Stress"   score={Math.round(readiness.components.stress)} />
            </View>
          )}

          <View style={styles.divider} />

          {/* ── Scrollable body ── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading && <SkeletonContent />}

            {!isLoading && error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={20} color={colors.text.tertiary} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => load(true)} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && briefing && (
              <View style={styles.content}>
                {/* Label + AI tag, then the headline */}
                <View style={styles.section}>
                  <View style={styles.headlineRow}>
                    <Text style={styles.sectionLabel}>TODAY'S BRIEFING</Text>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                  <Text style={styles.headline}>{briefing.headline}</Text>
                </View>

                {/* Overview */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>WHAT'S HAPPENING</Text>
                  <Text style={styles.body}>{briefing.overview}</Text>
                </View>

                {/* What to do today */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>DO TODAY</Text>
                  {briefing.doToday.map((item, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bullet, { backgroundColor: scoreColor }]} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Sits above the Recovery Protocol, which is rules-based, not
                    generated. Below it, the notice read as if it covered the
                    protocol too. */}
                <Text style={styles.disclaimer}>
                  AI-generated · Based on your biometrics and personal baselines · Not medical advice
                </Text>

                {/* ── Recovery Protocol (low score only) ── */}
                {protocol && (
                  <View style={styles.protocolCard}>
                    <View style={styles.protocolHeader}>
                      <Ionicons name="heart-outline" size={20} color={colors.amber[400]} style={styles.protocolIcon} />
                      <View>
                        <Text style={styles.protocolTitle}>Recovery Protocol</Text>
                        <Text style={styles.protocolSub}>Your body is asking for care today</Text>
                      </View>
                    </View>
                    {protocol.map((item, i) => (
                      <View key={i} style={styles.protocolItem}>
                        <View style={styles.protocolNumWrap}><Text style={styles.protocolNum}>{i + 1}</Text></View>
                        <Text style={styles.protocolText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── Briefing feedback ── */}
                <BriefingFeedbackRow date={healthData?.date ?? ''} />
              </View>
            )}

            {/* ── Coach Chat ── */}
            {!isLoading && briefing && (
              <View style={styles.chatSection}>
                <View style={styles.chatHeader}>
                  <View style={styles.chatHeaderTop}>
                    <Text style={styles.chatTitle}>Ask your coach</Text>
                  </View>
                  <Text style={styles.chatSub}>Tap a question and your coach answers it with your actual numbers.</Text>
                </View>
                {briefing.followUps && briefing.followUps.length > 0 && (
                  <View style={styles.followUps}>
                    {briefing.followUps.map(q => (
                      <TouchableOpacity
                        key={q}
                        style={styles.followUpChip}
                        onPress={() => handleOpenCoach(q)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                      >
                        <Text style={styles.followUpText}>{q}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.chatOpenBtn} onPress={() => handleOpenCoach()} activeOpacity={0.8} accessibilityRole="button">
                  <Text style={styles.chatOpenBtnText}>Ask your own question</Text>
                </TouchableOpacity>
                {!isPro && (
                  <Text style={styles.followUpNote}>Free accounts get 3 coach questions a week.</Text>
                )}
              </View>
            )}

            <View style={{ height: spacing[4] }} />
          </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[4],
    paddingBottom:     spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3.5],
  },
  headerScore: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize['5xl'],
    letterSpacing: -1.5,
    lineHeight:    68,
  },
  headerLabel: {
    fontSize:      13,
    fontWeight:    fontWeight.bold,
    letterSpacing: 1.6,
  },
  headerSub: {
    ...typography.caption,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  iconBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Component scores: flat, ruled, coloured by their own level
  pills: {
    flexDirection:     'row',
    marginHorizontal:  spacing[5],
    paddingVertical:   spacing[3],
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
  },
  pill: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
  },
  pillScore: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize.xl,
    letterSpacing: -0.5,
  },
  pillLabel: {
    ...typography.label,
    letterSpacing: 1.2,
  },

  divider: {
    height:           1,
    backgroundColor:  colors.border.subtle,
    marginHorizontal: spacing[5],
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[6],
    paddingBottom:     spacing[4],
  },

  // Content
  content: { gap: spacing[6] },

  headlineRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
  },
  aiBadgeText: {
    fontSize:      11,
    letterSpacing: 1.2,
    fontWeight:    fontWeight.bold,
    color:         colors.amber[400],
  },
  headline: {
    fontFamily:    fontFamily.heading,
    fontSize:      22,
    lineHeight:    28,
    letterSpacing: -0.4,
    color:         colors.text.primary,
  },

  section:      { gap: spacing[2] },
  sectionLabel: {
    ...typography.label,
  },
  // Paragraph text sits at base, not sm: this is prose read every morning.
  body: {
    fontSize:   fontSize.base,
    lineHeight: 26,
    color:      colors.text.primary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[3],
    paddingTop:    spacing[1],
  },
  bullet: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginTop:    10,
  },
  bulletText: {
    flex:       1,
    fontSize:   fontSize.base,
    lineHeight: 26,
    color:      colors.text.primary,
  },
  disclaimer: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Recovery protocol (low score only)
  protocolCard: {
    ...surface.card,
    padding: spacing[4],
    gap:     spacing[3],
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[3],
  },
  protocolIcon: {
    marginTop: 2,
  },
  protocolTitle: {
    ...typography.title,
  },
  protocolSub: {
    ...typography.caption,
    marginTop: 2,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[3],
  },
  protocolNumWrap: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    1,
    borderColor:    colors.amber[400],
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      2,
  },
  protocolNum: {
    fontFamily: fontFamily.numeral,
    fontSize:   14,
    color:      colors.amber[400],
  },
  protocolText: {
    flex: 1,
    ...typography.body,
  },

  // Feedback
  feedbackRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[3],
  },
  feedbackPrompt: {
    ...typography.caption,
  },
  feedbackBtns: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  feedbackBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  feedbackThanks: {
    ...typography.caption,
    textAlign: 'center',
  },

  // Skeleton
  skeletonContainer: { gap: spacing[1] },
  skeletonLine: {
    height:          12,
    borderRadius:    radius.sm,
    backgroundColor: colors.bg.tertiary,
  },

  // Error
  errorBox: {
    alignItems: 'center',
    gap:        spacing[3],
    paddingTop: spacing[10],
  },
  errorText: {
    ...typography.caption,
    fontSize:  fontSize.sm,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing[4],
    height:            40,
    justifyContent:    'center',
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border.subtle,
  },
  retryText: {
    fontSize:   fontSize.sm,
    color:      colors.text.accent,
    fontWeight: fontWeight.semiBold,
  },

  // Coach hand-off
  chatSection: {
    marginTop: spacing[7],
    gap:       spacing[4],
  },
  chatHeader: { gap: 4 },
  chatHeaderTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  chatTitle: {
    fontFamily:    fontFamily.heading,
    fontSize:      fontSize.lg,
    letterSpacing: -0.3,
    color:         colors.text.primary,
  },
  chatSub: {
    ...typography.caption,
  },
  followUps: {
    gap: spacing[2],
  },
  // Tappable, so each question keeps a card.
  followUpChip: {
    ...surface.card,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    gap:               spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3.5],
  },
  followUpText: {
    flex: 1,
    ...typography.title,
    lineHeight: 22,
  },
  followUpNote: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textAlign: 'center',
  },
  chatOpenBtn: {
    height:          48,
    borderRadius:    radius.md,
    backgroundColor: colors.amber[400],
    alignItems:      'center',
    justifyContent:  'center',
  },
  chatOpenBtnText: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.bold,
    color:      colors.text.inverse,
  },
});
