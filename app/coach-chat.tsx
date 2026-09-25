import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { askCoach, CoachError, type ChatMessage } from '@services/coachChat';
import { buildCoachExtras } from '@services/coachContext';
import { addCoachMemory } from '@services/coachMemory';
import { useSubscription } from '@contexts/SubscriptionContext';
import { getCoachSession, setCoachSession, type CoachSessionContext } from '@services/coachSession';
import { loadChatHistory, saveChatHistory, clearChatHistory, selectContext, todayLocal } from '@services/chatMemory';
import { loadUserProfile, type UserProfile } from '@services/userProfile';
import { useHealthData } from '@hooks/useHealthData';
import { analyzePatterns } from '@services/patternAnalysis';
import { analyzeWorkload } from '@services/workloadAnalysis';
import { fetchRecentEvents } from '@services/lifeEvents';
import { supabase } from '@services/supabase';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { track } from '@services/analytics';

function parseInline(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <Text key={i} style={styles.messageTextBold}>
          {token.slice(2, -2)}
        </Text>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <Text key={i} style={styles.messageTextItalic}>
          {token.slice(1, -1)}
        </Text>
      );
    }
    return token;
  });
}

function MarkdownMessage({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter(Boolean);
  return (
    <View style={styles.messageParagraphs}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.messageText}>
          {parseInline(paragraph)}
        </Text>
      ))}
    </View>
  );
}

function MessageBubble({ message, onRate }: { message: ChatMessage; onRate?: (r: 'up' | 'down') => void }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {!isUser && <Text style={styles.bubbleLabel}>COACH</Text>}
      {isUser ? (
        <Text style={[styles.messageText, styles.userMessageText]}>{message.content}</Text>
      ) : (
        <MarkdownMessage text={message.content} />
      )}
      {!isUser && message.remembered && message.remembered.length > 0 && (
        <Text style={styles.rememberedNote}>Remembered: {message.remembered.join('; ')}</Text>
      )}
      {!isUser && onRate && (
        <View style={styles.rateRow}>
          {(['up', 'down'] as const).map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => onRate(r)}
              disabled={!!message.rating}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={r === 'up' ? 'Helpful answer' : 'Not helpful'}
              style={[styles.rateBtn, message.rating === r && styles.rateBtnActive, message.rating && message.rating !== r && styles.rateBtnDim]}
            >
              <Text style={styles.rateText}>{r === 'up' ? '👍' : '👎'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Free accounts get 3 coach questions per ISO week (enforced by the server).
// The last count the server reported is kept so the banner is right before
// the first question of a session.
const FREE_WEEKLY_QUESTIONS = 3;
const FREE_REMAINING_KEY = '@readiness/coach_free_remaining_v1';

function isoWeekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${week}`;
}

export default function CoachChatScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // As a pushed route the screen owns the bottom edge and pads the composer
  // above the home indicator. Inside the tab the tab bar already covers that
  // inset, so doing it again left a band of empty space under the composer.
  const safeEdges: Array<'top' | 'bottom'> = embedded ? ['top'] : ['top', 'bottom'];
  const composerBottom = embedded ? spacing[3] : Math.max(insets.bottom, spacing[3]);
  const { readiness, isLoading: isHealthLoading, error: healthError, rhrBaseline, hrvBaseline } = useHealthData();
  const [session, setSession] = useState<CoachSessionContext | null>(() => getCoachSession());
  const [isContextLoading, setIsContextLoading] = useState(() => !getCoachSession());
  const scrollRef = useRef<ScrollView>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [errorKind, setErrorKind] = useState<'pro_required' | 'daily_limit' | 'other' | null>(null);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const { isPro, presentPaywall } = useSubscription();
  const params = useLocalSearchParams<{ q?: string; source?: string }>();
  const autoAsked = useRef(false);

  // The briefing flow seeds a session before navigating here. When Coach is
  // opened directly from the tab bar, build the same context from today's
  // readiness data so the screen is useful on its own.
  useEffect(() => {
    if (session || isHealthLoading) return;
    if (!readiness) {
      setIsContextLoading(false);
      return;
    }

    let cancelled = false;
    const currentReadiness = readiness;

    async function hydrateContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const [patterns, workload, lifeEvents] = await Promise.all([
          user ? analyzePatterns(user.id).catch(() => []) : Promise.resolve([]),
          analyzeWorkload().catch(() => null),
          fetchRecentEvents(7).catch(() => []),
        ]);

        if (cancelled) return;
        const nextSession: CoachSessionContext = {
          readiness: currentReadiness,
          healthData: currentReadiness.healthData,
          rhrBaseline,
          hrvBaseline,
          patterns,
          workload,
          lifeEvents,
        };
        setCoachSession(nextSession);
        setSession(nextSession);
      } finally {
        if (!cancelled) setIsContextLoading(false);
      }
    }

    hydrateContext();
    return () => { cancelled = true; };
  }, [session, isHealthLoading, readiness, rhrBaseline, hrvBaseline]);

  useEffect(() => {
    track('coach_opened');
    loadChatHistory().then(setHistory).catch(() => {});
    loadUserProfile().then(setProfile).catch(() => {});
    AsyncStorage.getItem(FREE_REMAINING_KEY)
      .then(raw => {
        const saved = raw ? JSON.parse(raw) : null;
        if (saved?.week === isoWeekKey() && typeof saved.remaining === 'number') setFreeRemaining(saved.remaining);
      })
      .catch(() => {});
  }, []);

  // A question handed over from a briefing follow-up or a coach check-in
  // notification is asked as soon as the context is ready.
  useEffect(() => {
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    if (!q || !session || autoAsked.current || isSending) return;
    autoAsked.current = true;
    const source = params.source === 'notification' ? 'notification' : 'briefing';
    sendQuestion(q, source);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, session]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [history, isSending]);

  function handleSend() {
    sendQuestion(input, 'typed');
  }

  async function sendQuestion(raw: string, source: 'typed' | 'chip' | 'briefing' | 'notification') {
    const question = raw.trim();
    if (!session || !question || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: question, date: todayLocal() };
    const nextHistory = [...history, userMessage];

    if (source === 'typed') setInput('');
    setError(null);
    setErrorKind(null);
    setHistory(nextHistory);
    saveChatHistory(nextHistory);
    setIsSending(true);
    track('coach_message_sent', { source, pro: isPro });

    try {
      const extras = await buildCoachExtras();
      const reply = await askCoach(
        question,
        session.readiness,
        session.healthData,
        session.rhrBaseline,
        session.hrvBaseline,
        session.patterns,
        session.workload,
        session.lifeEvents,
        selectContext(nextHistory),
        profile,
        extras,
      );

      const added = reply.remember.length > 0 ? await addCoachMemory(reply.remember) : 0;
      if (added > 0) track('coach_memory_saved', { count: added });

      const assistantMessage: ChatMessage = {
        role: 'assistant', content: reply.answer, date: todayLocal(),
        ...(added > 0 ? { remembered: reply.remember } : {}),
      };
      const updatedHistory: ChatMessage[] = [...nextHistory, assistantMessage];
      setHistory(updatedHistory);
      saveChatHistory(updatedHistory);

      if (reply.freeRemaining !== null) {
        setFreeRemaining(reply.freeRemaining);
        AsyncStorage.setItem(FREE_REMAINING_KEY, JSON.stringify({ week: isoWeekKey(), remaining: reply.freeRemaining })).catch(() => {});
      }
    } catch (e) {
      if (e instanceof CoachError) {
        setErrorKind(e.kind);
        setError(e.kind === 'other' ? "Couldn't reach your coach. Try again." : e.message);
        if (e.kind === 'pro_required') {
          setFreeRemaining(0);
          AsyncStorage.setItem(FREE_REMAINING_KEY, JSON.stringify({ week: isoWeekKey(), remaining: 0 })).catch(() => {});
        }
      } else {
        setErrorKind('other');
        setError("Couldn't reach your coach. Try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  function rateAnswer(index: number, rating: 'up' | 'down') {
    setHistory(prev => {
      const next = prev.map((m, i) => (i === index ? { ...m, rating } : m));
      saveChatHistory(next);
      return next;
    });
    track('coach_answer_rated', { rating });
  }

  async function handleClear() {
    await clearChatHistory();
    setHistory([]);
    setError(null);
  }

  if (isContextLoading || isHealthLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={safeEdges}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading your coach</Text>
          <Text style={styles.emptyBody}>Pulling in today&apos;s readiness and training context.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.screen} edges={safeEdges}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{healthError ? 'Your coach is waiting for a score' : 'No score context yet'}</Text>
          <Text style={styles.emptyBody}>
            Open Today after your wearable syncs overnight data, then come back here for questions grounded in your numbers.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryButtonText}>Open Today</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={safeEdges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          {/* Pushed from the briefing there is somewhere to go back to; as the
              Coach tab there is not. canGoBack() is true inside the tab
              navigator whenever the root stack has any history, so the tab
              says so explicitly instead. */}
          {!embedded && router.canGoBack() ? (
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.headerButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
          <Text style={styles.title}>Coach</Text>
          <TouchableOpacity style={[styles.headerButton, styles.headerButtonRight]} onPress={handleClear} activeOpacity={0.8}>
            <Text style={styles.headerButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.messages, { paddingBottom: spacing[4] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 && (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeLabel}>COACH</Text>
              <Text style={styles.welcomeText}>
                Ask anything about today&apos;s score, whether to push or back off, or what trend matters most right now.
              </Text>
              <View style={styles.promptRow}>
                {[
                  'Why is my score low today?',
                  'Can I train hard today?',
                  'What should I prioritize tonight?',
                ].map(prompt => (
                  <TouchableOpacity
                    key={prompt}
                    style={styles.promptChip}
                    onPress={() => sendQuestion(prompt, 'chip')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!isPro && (
            <Text style={styles.freeNote}>
              {freeRemaining === null
                ? `Free accounts get ${FREE_WEEKLY_QUESTIONS} coach questions a week.`
                : freeRemaining > 0
                  ? `${freeRemaining} of ${FREE_WEEKLY_QUESTIONS} free questions left this week.`
                  : 'No free questions left this week. They reset on Monday.'}
            </Text>
          )}

          {history.map((message, index) => (
            <MessageBubble
              key={`${message.role}-${index}`}
              message={message}
              onRate={message.role === 'assistant' ? r => rateAnswer(index, r) : undefined}
            />
          ))}

          {isSending && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={styles.bubbleLabel}>COACH</Text>
              <Text style={styles.messageText}>Thinking…</Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
          {errorKind === 'pro_required' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => presentPaywall()} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>See Readiness Pro</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={[styles.composerWrap, { paddingBottom: composerBottom }]}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything about your data..."
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isSending}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  // One compact row: fixed-width buttons either side keep the title centred
  // whether or not Back is showing.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerButton: {
    width: 56,
    paddingVertical: spacing[1.5],
  },
  headerButtonRight: {
    alignItems: 'flex-end',
  },
  headerButtonText: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  messages: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2.5],
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.amber[400] + '22',
    borderWidth: 1,
    borderColor: colors.amber[400] + '55',
  },
  bubbleLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  messageParagraphs: {
    gap: spacing[2],
  },
  messageText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  userMessageText: {
    color: colors.text.primary,
  },
  messageTextBold: {
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  messageTextItalic: {
    fontStyle: 'italic',
    color: colors.text.primary,
  },
  welcomeCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  welcomeLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  welcomeText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  promptChip: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  promptChipText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  composerWrap: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    paddingLeft: spacing[4],
    paddingRight: spacing[3],
    paddingVertical: spacing[1.5],
    minHeight: 46,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: colors.text.primary,
    fontSize: fontSize.base,
    lineHeight: 23,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: colors.bg.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  rememberedNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  rateRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  rateBtn: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  rateBtnActive: { borderColor: colors.amber[400] },
  rateBtnDim: { opacity: 0.35 },
  rateText: { fontSize: fontSize.sm },
  freeNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  emptyBody: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.amber[400],
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  primaryButtonText: {
    color: colors.bg.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
