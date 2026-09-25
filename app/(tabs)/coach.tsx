/**
 * Coach tab.
 *
 * The chat screen itself lives at app/coach-chat.tsx so the briefing and the
 * coach check-in notifications can push it with a question; this tab opens
 * the same screen directly and the screen builds its own context.
 *
 * From 1.0.4 the coach is open to every account: free accounts get three
 * questions a week (enforced by the coach-chat function), and the screen
 * shows what's left and offers Pro when they run out.
 */

import { View, StyleSheet } from 'react-native';
import { useSubscription } from '@contexts/SubscriptionContext';
import { colors } from '@constants/theme';
import CoachChatScreen from '../coach-chat';

export default function CoachTab() {
  const { isLoading, identityReady } = useSubscription();

  // Wait for the subscription state so the free-question note is right from
  // the first frame instead of flashing for a Pro user.
  if (isLoading || !identityReady) return <View style={styles.screen} />;
  return <CoachChatScreen embedded />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
});
