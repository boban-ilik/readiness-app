/**
 * TodayPlanCard
 *
 * One card for "what do I do today": the training recommendation, nutrition
 * and water as rows with dividers, instead of three cards in the stream.
 * Children render flat (no card chrome of their own); a locked row stands in
 * for a Pro row when the user is on the free tier.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';

interface Props {
  children: React.ReactNode;
}

export default function TodayPlanCard({ children }: Props) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i > 0 && styles.rowDivider]}>{row}</View>
      ))}
    </View>
  );
}

interface LockedRowProps {
  title:   string;
  body:    string;
  onPress: () => void;
}

/** A Pro row shown to a free user: what it is, and a padlock that opens the paywall. */
export function LockedPlanRow({ title, body, onPress }: LockedRowProps) {
  return (
    <TouchableOpacity
      style={styles.locked}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}, Pro feature`}
    >
      <View style={styles.lockedText}>
        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedBody}>{body}</Text>
      </View>
      <Ionicons name="lock-closed-outline" size={16} color={colors.text.secondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    overflow:        'hidden',
  },
  row: {
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  locked: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    minHeight:     44,
  },
  lockedText: {
    flex: 1,
    gap:  spacing[0.5],
  },
  lockedTitle: {
    color:      colors.text.secondary,
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  lockedBody: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 18,
  },
});
