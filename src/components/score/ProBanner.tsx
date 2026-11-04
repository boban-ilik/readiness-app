/**
 * ProBanner
 *
 * The one Pro pitch in the Today stream: a slim row under the ring. In the
 * last days of the free Pro week it says so and cannot be dismissed; for a
 * free user it is a once-a-day reminder with a close button. Replaces the
 * Pro summary card and the trial-ending card.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import type { ProBannerMode } from '@utils/todaySections';

interface Props {
  mode:        Exclude<ProBannerMode, null>;
  daysLeft:    number;
  onPress:     () => void;
  onDismiss?:  () => void;
}

export default function ProBanner({ mode, daysLeft, onPress, onDismiss }: Props) {
  const text = mode === 'trial'
    ? (daysLeft <= 1
        ? 'Last day of your free Pro week. Keep the breakdown, trend and coach.'
        : `${daysLeft} days left of your free Pro week. Keep the breakdown, trend and coach.`)
    : 'Recovery detail, nutrition, trends and the coach.';

  return (
    <View style={styles.banner}>
      <TouchableOpacity
        style={styles.main}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={mode === 'trial' ? 'Keep Pro' : 'See what Pro includes'}
      >
        <View style={styles.badge}><Text style={styles.badgeText}>PRO</Text></View>
        <Text style={styles.text} numberOfLines={2}>{text}</Text>
        <Text style={styles.cta}>{mode === 'trial' ? 'Keep Pro' : 'See Pro'}</Text>
      </TouchableOpacity>
      {mode === 'upsell' && onDismiss && (
        <TouchableOpacity
          style={styles.dismiss}
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Hide for today"
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    marginBottom:    spacing[4],
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.amber[800],
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  main: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[2.5],
    paddingHorizontal: spacing[3.5],
    paddingVertical:   spacing[2.5],
    minHeight:         44,
  },
  badge: {
    backgroundColor:   colors.amber[400],
    borderRadius:      radius.sm,
    paddingHorizontal: spacing[1.5],
    paddingVertical:   2,
  },
  badgeText: {
    color:         colors.bg.primary,
    fontSize:      10,
    fontWeight:    fontWeight.bold,
    letterSpacing: 1,
  },
  text: {
    flex:       1,
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    lineHeight: 18,
  },
  cta: {
    color:      colors.amber[400],
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  dismiss: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[3],
  },
  dismissText: {
    color:    colors.text.secondary,
    fontSize: fontSize.sm,
  },
});
