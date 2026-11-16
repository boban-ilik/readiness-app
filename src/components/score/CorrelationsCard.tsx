/**
 * CorrelationsCard
 *
 * Shows 1–3 data-derived insights from the 7-day history.
 * Sits in the Pro history view below the stats row.
 *
 * PHASE 2: Replace `computeInsights()` with a call to a Supabase Edge Function
 * that sends the history JSON to the Claude API and returns AI-generated
 * sentence insights — enabling "your score drops 12 pts after >2 drinks"-style
 * personalisation once the user adds lifestyle inputs.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { computeInsights, type Insight } from '@utils/correlations';
import type { DayHistory } from '@/types/index';
import {
  colors,
  fontSize,
  spacing,
  typography,
} from '@constants/theme';

// ─── Sub-components ───────────────────────────────────────────────────────────

function insightColor(direction: Insight['direction']): string {
  switch (direction) {
    case 'positive': return colors.success;
    case 'negative': return colors.error;
    default:         return colors.text.primary;
  }
}

function InsightRow({ insight, showBorder }: { insight: Insight; showBorder: boolean }) {
  // The icon carries the direction; the headline stays neutral.
  const headlineColor = insightColor(insight.direction);

  return (
    <View style={[styles.insightRow, showBorder && styles.insightRowBorder]}>
      <Ionicons
        name={insight.direction === 'positive' ? 'trending-up' : insight.direction === 'negative' ? 'trending-down' : 'remove'}
        size={18}
        color={insight.direction === 'neutral' ? colors.text.tertiary : headlineColor}
        style={styles.insightIcon}
      />
      <View style={styles.insightBody}>
        <Text style={styles.insightHeadline}>{insight.headline}</Text>
        <Text style={styles.insightDetail}>{insight.detail}</Text>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CorrelationsCardProps {
  history: DayHistory[];
}

export default function CorrelationsCard({ history }: CorrelationsCardProps) {
  const insights = computeInsights(history);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">PATTERNS</Text>
        <Text style={styles.badgeText}>7 DAYS</Text>
      </View>

      {/* Insight rows */}
      {insights.map((insight, i) => (
        <InsightRow
          key={i}
          insight={insight}
          showBorder={i > 0}
        />
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Patterns strengthen as you log more days
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Flat on the page: nothing here is tappable.
  card: {},

  header: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    marginBottom:   spacing[1],
  },
  title: {
    ...typography.label,
  },
  badgeText: {
    ...typography.label,
    letterSpacing: 1,
  },

  insightRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: spacing[3.5],
    gap:             spacing[3],
  },
  insightRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  insightIcon: {
    marginTop: 2,
  },
  insightBody: {
    flex: 1,
    gap:  spacing[1],
  },
  insightHeadline: {
    ...typography.title,
  },
  insightDetail: {
    ...typography.caption,
  },

  footer: {
    paddingTop:     spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  footerText: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
  },
});
