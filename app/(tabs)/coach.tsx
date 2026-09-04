/**
 * Coach tab.
 *
 * The chat screen itself lives at app/coach-chat.tsx so the briefing modal
 * can still push it with a pre-seeded session; this tab opens the same
 * screen directly and the screen builds its own context from today's data.
 *
 * Coach chat is a Pro feature. The briefing modal enforces that at its
 * entry point, so the tab has to as well, otherwise it is a free side door.
 */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProGate } from '@components/common/ProGate';
import { useSubscription } from '@contexts/SubscriptionContext';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import CoachChatScreen from '../coach-chat';

export default function CoachTab() {
  const { isPro, isLoading, identityReady } = useSubscription();

  // Same wait as ProGate: rendering the chat before identity resolves would
  // start a HealthKit fetch and a coach-context build for a user who may be
  // about to see the upgrade panel instead.
  if (isLoading || !identityReady) return <View style={styles.screen} />;
  if (isPro) return <CoachChatScreen />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Coach chat</Text>
        <Text style={styles.subtitle}>Grounded in your real readiness, recovery, and training context.</Text>
        <ProGate
          feature="Coach Chat"
          description="Ask anything about today's numbers and get answers grounded in your own HRV, sleep and training load."
        >
          <View style={styles.preview}>
            <View style={[styles.bubble, styles.bubbleUser]}>
              <Text style={styles.bubbleText}>My HRV is down 12 ms this morning. Should I still do intervals?</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleCoach]}>
              <Text style={styles.bubbleText}>
                Your sleep was solid, so this looks like yesterday's session rather than illness. Keep the intervals but cap them at the lower end of Zone 4.
              </Text>
            </View>
          </View>
        </ProGate>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.bg.primary },
  wrap:     { padding: spacing[4], gap: spacing[2] },
  title:    { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  subtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginBottom: spacing[3] },
  preview:  { gap: spacing[2], padding: spacing[3] },
  bubble:   { borderRadius: radius.md, padding: spacing[3], maxWidth: '85%' },
  bubbleUser:  { alignSelf: 'flex-end', backgroundColor: colors.amber[400] },
  bubbleCoach: { alignSelf: 'flex-start', backgroundColor: colors.bg.secondary },
  bubbleText:  { color: colors.text.primary, fontSize: fontSize.sm, lineHeight: 20 },
});
