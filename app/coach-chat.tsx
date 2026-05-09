import { useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { askCoach, type ChatMessage } from '@services/coachChat';
import { getCoachSession } from '@services/coachSession';
import { loadChatHistory, saveChatHistory, clearChatHistory, CONTEXT_WINDOW } from '@services/chatMemory';
import { loadUserProfile, type UserProfile } from '@services/userProfile';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';

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

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {!isUser && <Text style={styles.bubbleLabel}>COACH</Text>}
      {isUser ? (
        <Text style={[styles.messageText, styles.userMessageText]}>{message.content}</Text>
      ) : (
        <MarkdownMessage text={message.content} />
      )}
    </View>
  );
}

export default function CoachChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = getCoachSession();
  const scrollRef = useRef<ScrollView>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    loadChatHistory().then(setHistory).catch(() => {});
    loadUserProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [history, isSending]);

  async function handleSend() {
    const question = input.trim();
    if (!session || !question || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextHistory = [...history, userMessage];

    setInput('');
    setError(null);
    setHistory(nextHistory);
    saveChatHistory(nextHistory);
    setIsSending(true);

    try {
      const answer = await askCoach(
        question,
        session.readiness,
        session.healthData,
        session.rhrBaseline,
        session.hrvBaseline,
        session.patterns,
        session.workload,
        session.lifeEvents,
        nextHistory.slice(-CONTEXT_WINDOW),
        profile,
      );

      const assistantMessage: ChatMessage = { role: 'assistant', content: answer };
      const updatedHistory: ChatMessage[] = [...nextHistory, assistantMessage];
      setHistory(updatedHistory);
      saveChatHistory(updatedHistory);
    } catch {
      setError("Couldn't fetch the Coach. Try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleClear() {
    await clearChatHistory();
    setHistory([]);
    setError(null);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Coach chat needs a score context</Text>
          <Text style={styles.emptyBody}>
            Open your readiness score first, then launch coach chat from there so we can include today&apos;s data.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach chat</Text>
            <Text style={styles.subtitle}>Grounded in your real readiness, recovery, and training context.</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleClear} activeOpacity={0.8}>
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
                    onPress={() => setInput(prompt)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {history.map((message, index) => (
            <MessageBubble key={`${message.role}-${index}`} message={message} />
          ))}

          {isSending && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={styles.bubbleLabel}>COACH</Text>
              <Text style={styles.messageText}>Thinking…</Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  headerButton: {
    paddingVertical: spacing[1.5],
  },
  headerButtonText: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  messages: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[3],
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
    paddingVertical: spacing[2],
    minHeight: 52,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: colors.text.primary,
    fontSize: fontSize.base,
    lineHeight: 20,
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
