/**
 * TrialEndingCard
 *
 * The day before the free Pro week ends (and on the day itself), says
 * plainly what stays free and what is Pro, so nothing just disappears on
 * day 7. Shown until dismissed, once per account.
 *
 * Keep both lists in step with what the app actually gates.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';

const STAYS_FREE = [
  'Your daily score and training call',
  'How each score was calculated',
  'Unusual-reading questions and the illness tracker',
  'Water and day tags',
  'The 7-day chart and your 30-day picture',
  'One briefing and 3 coach questions a week',
];

const PRO_ONLY = [
  'The daily briefing and unlimited coach',
  'The 3-day forecast and trend chart',
  'Score breakdowns and nutrition guidance',
  'Full history, patterns and CSV export',
];

interface Props {
  when:      'today' | 'tomorrow';
  onKeepPro: () => void;
  onDismiss: () => void;
}

function List({ items, mark }: { items: string[]; mark: string }) {
  return (
    <View style={styles.list}>
      {items.map(i => (
        <Text key={i} style={styles.item}>{mark}  {i}</Text>
      ))}
    </View>
  );
}

export default function TrialEndingCard({ when, onKeepPro, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR FREE PRO WEEK ENDS {when.toUpperCase()}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Stays free</Text>
      <List items={STAYS_FREE} mark="✓" />

      <Text style={styles.heading}>Pro</Text>
      <List items={PRO_ONLY} mark="★" />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.keepBtn} onPress={onKeepPro} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.keepText}>Keep Pro</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} accessibilityRole="button">
          <Text style={styles.gotIt}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full section width, like the other Today cards.
  card: {
    marginBottom:    spacing[5],
    borderRadius:    radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber[400],
    backgroundColor: colors.bg.tertiary,
    padding:         spacing[4],
    gap:             spacing[2],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            spacing[3],
  },
  eyebrow: {
    flexShrink:    1,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    color:         colors.amber[400],
    letterSpacing: 1.0,
  },
  dismiss: {
    fontSize: fontSize.sm,
    color:    colors.text.tertiary,
  },
  heading: {
    marginTop:  spacing[1],
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  list: { gap: 2 },
  item: {
    fontSize:   fontSize.sm,
    lineHeight: 20,
    color:      colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[5],
    marginTop:     spacing[2],
  },
  keepBtn: {
    paddingVertical:   spacing[2],
    paddingHorizontal: spacing[5],
    borderRadius:      radius.md,
    backgroundColor:   colors.amber[400],
  },
  keepText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.inverse,
  },
  gotIt: {
    fontSize: fontSize.sm,
    color:    colors.text.tertiary,
  },
});
