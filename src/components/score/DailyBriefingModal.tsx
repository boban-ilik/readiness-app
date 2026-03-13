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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDailyBriefing, saveBriefingFeedback, type DailyBriefing } from '@services/dailyBriefing';
import { analyzePatterns, type PatternInsight } from '@services/patternAnalysis';
import { analyzeWorkload, type WorkloadResult } from '@services/workloadAnalysis';
import { askCoach, type ChatMessage } from '@services/coachChat';
import {
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  CONTEXT_WINDOW,
} from '@services/chatMemory';
import { fetchRecentEvents, type LifeEvent } from '@services/lifeEvents';
import { loadUserProfile, type UserProfile } from '@services/userProfile';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData } from '@types/index';
import { supabase } from '@services/supabase';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
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
    items.push('Skip caffeine until at least 10am — your body is still processing overnight stress hormones');
    items.push('If you train today, keep it Zone 1–2 only (conversational pace, 30–40 min max)');
    items.push('Aim for 20g of protein within 30 minutes of waking to kickstart muscle repair');
  } else if (sleep < recovery && sleep < stress) {
    items.push('Prioritise a consistent wind-down tonight — screens off by 9:30pm if possible');
    items.push('A 10–20 min nap before 2pm can partially offset last night\'s deficit without disrupting tonight');
    items.push('Avoid alcohol today — even one drink will suppress the deep sleep you need to recover');
  } else {
    items.push('Try 5 minutes of box breathing (4s in, 4s hold, 4s out, 4s hold) before your first task');
    items.push('Block at least one 30-min window with zero notifications today — your nervous system needs quiet');
    items.push('Move, but gently — a 20-min walk lowers cortisol more effectively than skipping activity entirely');
  }

  return items;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ width = '100%' as const }: { width?: `${number}%` | number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
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
      <Text style={styles.sectionLabel}>TODAY'S FOCUS</Text>
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
    <View style={[styles.pill, { borderColor: color + '44', backgroundColor: color + '15' }]}>
      <Text style={[styles.pillScore, { color }]}>{score}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Handles **bold**, *italic*, and newline-separated paragraphs.
// Pure React Native <Text> nesting — no extra dependency needed.

function parseInline(text: string): React.ReactNode[] {
  // Split on **bold** and *italic* tokens, keeping the delimiters
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: fontWeight.bold, color: 'inherit' as any }}>
          {token.slice(2, -2)}
        </Text>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <Text key={i} style={{ fontStyle: 'italic' }}>
          {token.slice(1, -1)}
        </Text>
      );
    }
    return token;
  });
}

function MarkdownText({
  text,
  style,
}: {
  text: string;
  style?: object;
}) {
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  return (
    <View style={{ gap: 6 }}>
      {paragraphs.map((para, i) => (
        <Text key={i} style={style}>
          {parseInline(para)}
        </Text>
      ))}
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
// Three dots that pulse in sequence — matches the coach bubble structure so
// the layout doesn't jump when the real response arrives.

function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1,   duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          Animated.delay(480 - i * 160),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}>
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={{
            width:           7,
            height:          7,
            borderRadius:    4,
            backgroundColor: colors.text.secondary,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

// ─── Briefing feedback row ────────────────────────────────────────────────────
// Shows "Was this helpful?" with 👍 / 👎 thumbs. On tap, saves to AsyncStorage
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
            ? '👍 Glad it helped — keep the feedback coming'
            : "👎 Got it — I'll be more specific next time"}
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
        >
          <Text style={styles.feedbackBtnText}>👍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => handleRate('unhelpful')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.feedbackBtnText}>👎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
      {!isUser && <Text style={styles.bubbleLabel}>COACH</Text>}
      {isUser ? (
        <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      ) : (
        <MarkdownText
          text={msg.content}
          style={styles.bubbleText}
        />
      )}
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
}: DailyBriefingModalProps) {
  const [briefing,     setBriefing]     = useState<DailyBriefing | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Coach chat state
  const [chatHistory,         setChatHistory]         = useState<ChatMessage[]>([]);
  const [chatInput,           setChatInput]           = useState('');
  const [chatLoading,         setChatLoading]         = useState(false);
  const [chatError,           setChatError]           = useState<string | null>(null);
  const [hasRestoredHistory,  setHasRestoredHistory]  = useState(false);

  const patternsRef   = useRef<PatternInsight[]>([]);
  const workloadRef   = useRef<WorkloadResult | null>(null);
  const lifeEventsRef = useRef<LifeEvent[]>([]);
  const profileRef    = useRef<UserProfile>({});
  const scrollRef     = useRef<ScrollView>(null);

  const score      = readiness ? Math.round(readiness.score) : 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const protocol   = readiness ? getRecoveryProtocol(score, readiness.components) : null;

  // Load on open
  useEffect(() => {
    if (!visible || !readiness || !healthData) return;
    setChatError(null);

    // Restore persisted chat history so conversation continues across opens
    loadChatHistory().then(history => {
      setChatHistory(history);
      setHasRestoredHistory(history.length > 0);
    });

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
    loadUserProfile()
      .then(p => { profileRef.current = p; })
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
      const result = await fetchDailyBriefing(
        readiness, healthData, rhrBaseline, hrvBaseline, forceRefresh,
        patternsRef.current,
        workloadRef.current,
        lifeEventsRef.current,
      );
      setBriefing(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load briefing');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    const q = chatInput.trim();
    if (!q || chatLoading || !readiness || !healthData) return;

    const userMsg: ChatMessage = { role: 'user', content: q };
    setChatInput('');
    // Save immediately when user sends — fire and forget inside updater
    setChatHistory(prev => {
      const updated = [...prev, userMsg];
      saveChatHistory(updated);
      return updated;
    });
    setChatLoading(true);
    setChatError(null);

    // Scroll to bottom after user message renders
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Cap history sent to the API to avoid token bloat — display shows full history
      const contextHistory = chatHistory.slice(-CONTEXT_WINDOW);
      const answer = await askCoach(
        q,
        readiness,
        healthData,
        rhrBaseline,
        hrvBaseline,
        patternsRef.current,
        workloadRef.current,
        lifeEventsRef.current,
        contextHistory,
        profileRef.current,
      );
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer };
      // Save after assistant responds too
      setChatHistory(prev => {
        const updated = [...prev, assistantMsg];
        saveChatHistory(updated);
        return updated;
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setChatError('Couldn\'t reach your coach. Try again.');
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

          {/* ── Score header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerScore, { color: scoreColor }]}>{score}</Text>
              <View>
                <Text style={styles.headerLabel}>{scoreLabel.toUpperCase()}</Text>
                <Text style={styles.headerSub}>Today's readiness</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => load(true)} disabled={isLoading}>
                <Text style={styles.iconBtnText}>↻</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Text style={styles.iconBtnText}>✕</Text>
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
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading && <SkeletonContent />}

            {!isLoading && error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
                <TouchableOpacity onPress={() => load(true)} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && briefing && (
              <View style={styles.content}>
                {/* AI badge + headline */}
                <View style={styles.headlineRow}>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✦ AI</Text>
                  </View>
                  <Text style={styles.headline}>{briefing.headline}</Text>
                </View>

                {/* Overview */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>WHAT'S HAPPENING</Text>
                  <Text style={styles.body}>{briefing.overview}</Text>
                </View>

                {/* Focus areas */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>TODAY'S FOCUS</Text>
                  {briefing.focusAreas.map((item, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={[styles.bullet, { color: scoreColor }]}>●</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Action plan */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>ACTION PLAN</Text>
                  <View style={[styles.actionBox, { borderLeftColor: scoreColor }]}>
                    <Text style={styles.body}>{briefing.actionPlan}</Text>
                  </View>
                </View>

                {/* ── Recovery Protocol (low score only) ── */}
                {protocol && (
                  <View style={styles.protocolCard}>
                    <View style={styles.protocolHeader}>
                      <Text style={styles.protocolIcon}>🫶</Text>
                      <View>
                        <Text style={styles.protocolTitle}>Recovery Protocol</Text>
                        <Text style={styles.protocolSub}>Your body is asking for care today</Text>
                      </View>
                    </View>
                    {protocol.map((item, i) => (
                      <View key={i} style={styles.protocolItem}>
                        <Text style={styles.protocolNum}>{i + 1}</Text>
                        <Text style={styles.protocolText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.disclaimer}>
                  AI-generated · Based on your biometrics and personal baselines
                </Text>

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
                    {chatHistory.length > 0 && (
                      <TouchableOpacity
                        onPress={async () => {
                          await clearChatHistory();
                          setChatHistory([]);
                          setHasRestoredHistory(false);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.clearBtn}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.chatSub}>Questions answered with your actual data</Text>
                </View>

                {/* Session continuity separator */}
                {hasRestoredHistory && (
                  <View style={styles.sessionSeparator}>
                    <View style={styles.sessionLine} />
                    <Text style={styles.sessionLabel}>previous session</Text>
                    <View style={styles.sessionLine} />
                  </View>
                )}

                {/* Suggestion chips when chat is empty */}
                {chatHistory.length === 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsRow}
                  >
                    {[
                      'Why is my score low?',
                      'Can I train hard today?',
                      'What should I focus on this week?',
                      'Is this normal for me?',
                    ].map(q => (
                      <TouchableOpacity
                        key={q}
                        style={styles.suggestionChip}
                        onPress={() => { setChatInput(q); }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionText}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Message history */}
                {chatHistory.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} />
                ))}

                {/* Typing indicator — same bubble structure as ChatBubble to prevent layout jump */}
                {chatLoading && (
                  <View style={[styles.bubble, styles.bubbleCoach]}>
                    <Text style={styles.bubbleLabel}>COACH</Text>
                    <TypingDots />
                  </View>
                )}

                {chatError && (
                  <Text style={styles.chatError}>{chatError}</Text>
                )}
              </View>
            )}

            <View style={{ height: spacing[4] }} />
          </ScrollView>

          {/* ── Chat input (sticky at bottom) ── */}
          {!isLoading && briefing && (
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything about your data…"
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!chatLoading}
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!chatInput.trim() || chatLoading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!chatInput.trim() || chatLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </TouchableOpacity>
            </View>
          )}

        </SafeAreaView>
      </KeyboardAvoidingView>
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
    gap:           spacing[3],
  },
  headerScore: {
    fontSize:   64,
    fontWeight: fontWeight.bold,
    lineHeight: 68,
  },
  headerLabel: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.semiBold,
    color:         colors.text.primary,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  iconBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.elevated,
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconBtnText: {
    fontSize: fontSize.base,
    color:    colors.text.secondary,
  },

  // Pills
  pills: {
    flexDirection:     'row',
    gap:               spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom:     spacing[3],
  },
  pill: {
    flex:            1,
    borderRadius:    radius.md,
    borderWidth:     1,
    paddingVertical: spacing[2],
    alignItems:      'center',
    gap:             2,
  },
  pillScore: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  pillLabel: {
    fontSize: fontSize.xs,
    color:    colors.text.tertiary,
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
    paddingTop:        spacing[5],
    paddingBottom:     spacing[4],
  },

  // Content
  content: { gap: spacing[5] },

  headlineRow: {
    flexDirection: 'row',
    gap:           spacing[2],
    alignItems:    'flex-start',
  },
  aiBadge: {
    borderRadius:      radius.sm,
    backgroundColor:   '#6C4BEF22',
    borderWidth:       1,
    borderColor:       '#6C4BEF55',
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
    marginTop:         1,
  },
  aiBadgeText: {
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
    color:      '#A78BFA',
  },
  headline: {
    flex:       1,
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
    lineHeight: 24,
  },

  section:      { gap: spacing[2] },
  sectionLabel: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    color:         colors.text.tertiary,
    letterSpacing: 0.8,
  },
  body: {
    fontSize:   fontSize.sm,
    color:      colors.text.secondary,
    lineHeight: 20,
  },

  bulletRow: {
    flexDirection: 'row',
    gap:           spacing[2],
    alignItems:    'flex-start',
  },
  bullet: {
    fontSize:  8,
    marginTop: 6,
  },
  bulletText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      colors.text.secondary,
    lineHeight: 20,
  },

  actionBox: {
    borderLeftWidth: 3,
    paddingLeft:     spacing[3],
  },

  disclaimer: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },

  // Briefing feedback
  feedbackRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[3],
    paddingVertical: spacing[1],
  },
  feedbackPrompt: {
    fontSize: fontSize.xs,
    color:    colors.text.tertiary,
  },
  feedbackBtns: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  feedbackBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    alignItems:      'center',
    justifyContent:  'center',
  },
  feedbackBtnText: {
    fontSize: 16,
  },
  feedbackThanks: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textAlign: 'center',
  },

  // Recovery Protocol
  protocolCard: {
    backgroundColor: '#0F172A',
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     '#1E293B',
    padding:         spacing[4],
    gap:             spacing[3],
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  protocolIcon: { fontSize: 24 },
  protocolTitle: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  protocolSub: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    marginTop: 2,
  },
  protocolItem: {
    flexDirection: 'row',
    gap:           spacing[3],
    alignItems:    'flex-start',
  },
  protocolNum: {
    fontSize:          fontSize.xs,
    fontWeight:        fontWeight.bold,
    color:             '#60A5FA',
    backgroundColor:   '#1E3A5F',
    width:             20,
    height:            20,
    borderRadius:      10,
    textAlign:         'center',
    lineHeight:        20,
  },
  protocolText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      colors.text.secondary,
    lineHeight: 20,
  },

  // Skeleton
  skeletonContainer: { gap: spacing[1] },
  skeletonLine: {
    height:          12,
    borderRadius:    radius.sm,
    backgroundColor: colors.bg.elevated,
  },

  // Error
  errorBox: {
    alignItems: 'center',
    gap:        spacing[3],
    paddingTop: spacing[10],
  },
  errorText: {
    fontSize:  fontSize.sm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[2],
    backgroundColor:   colors.bg.elevated,
    borderRadius:      radius.md,
  },
  retryText: {
    fontSize:   fontSize.sm,
    color:      colors.text.accent,
    fontWeight: fontWeight.medium,
  },

  // ── Coach Chat ──
  chatSection: {
    marginTop: spacing[6],
    gap:       spacing[4],
  },
  chatHeader: { gap: 4 },
  chatHeaderTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  chatTitle: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  clearBtn: {
    fontSize:  fontSize.xs,
    color:     colors.text.tertiary,
    textDecorationLine: 'underline' as const,
  },
  chatSub: {
    fontSize: fontSize.xs,
    color:    colors.text.tertiary,
  },
  sessionSeparator: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[2],
    marginVertical: spacing[1],
  },
  sessionLine: {
    flex:            1,
    height:          1,
    backgroundColor: colors.border.subtle,
  },
  sessionLabel: {
    fontSize:  9,
    color:     colors.text.tertiary,
    opacity:   0.6,
    letterSpacing: 0.5,
  },

  suggestionsRow: {
    gap:            spacing[2],
    paddingVertical: spacing[1],
  },
  suggestionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[2],
    borderRadius:      radius.full ?? 99,
    backgroundColor:   colors.bg.elevated,
    borderWidth:       1,
    borderColor:       colors.border.subtle,
  },
  suggestionText: {
    fontSize: fontSize.xs,
    color:    colors.text.secondary,
  },

  bubble: {
    maxWidth:     '85%',
    borderRadius: radius.lg,
    padding:      spacing[3],
    gap:          4,
  },
  bubbleUser: {
    alignSelf:       'flex-end',
    backgroundColor: colors.text.accent + '20',
    borderWidth:     1,
    borderColor:     colors.text.accent + '40',
  },
  bubbleCoach: {
    alignSelf:       'flex-start',
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
  },
  bubbleLabel: {
    fontSize:   9,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  bubbleText: {
    fontSize:   fontSize.sm,
    color:      colors.text.secondary,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: colors.text.primary,
  },

  chatError: {
    fontSize:  fontSize.xs,
    color:     '#F87171',
    textAlign: 'center',
    marginTop: spacing[2],
  },

  // Input bar
  inputBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
    backgroundColor:   colors.bg.primary,
  },
  input: {
    flex:              1,
    backgroundColor:   colors.bg.elevated,
    borderRadius:      radius.full ?? 99,
    borderWidth:       1,
    borderColor:       colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[2],
    fontSize:          fontSize.sm,
    color:             colors.text.primary,
    maxHeight:         80,
  },
  sendBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.text.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  sendBtnText: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.bold,
    color:      colors.text.primary,
  },
});
