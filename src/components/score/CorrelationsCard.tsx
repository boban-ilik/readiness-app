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
import { computeInsights, type Insight } from '@utils/correlations';
import type { DayHistory } from '@hooks/useHistoryData';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
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
  const headlineColor = insightColor(insight.direction);

  return (
    <View style={[styles.insightRow, showBorder && styles.insightRowBorder]}>
      <Text style={styles.insightIcon}>{insight.icon}</Text>
      <View style={styles.insightBody}>
        <Text style={[styles.insightHeadline, { color: headlineColor }]}>
          {insight.headline}
        </Text>
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
        <Text style={styles.title}>PATTERNS</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>7 DAYS</Text>
        </View>
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
          Patterns strengthen as you log more days · AI insights coming in Pro v2
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    overflow:        'hidden',
  },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing[4],
    paddingTop:      spacing[4],
    paddingBottom:   spacing[3],
  },
  title: {
    color:       colors.text.tertiary,
    fontSize:    fontSize.xs,
    fontWeight:  fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  badgeText: {
    color:      colors.text.tertiary,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.8,
  },

  insightRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap:             spacing[3],
  },
  insightRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  insightIcon: {
    fontSize:   18,
    lineHeight: 24,
    marginTop:  1,
  },
  insightBody: {
    flex: 1,
    gap:  spacing[0.5],
  },
  insightHeadline: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    lineHeight: fontSize.sm * 1.4,
  },
  insightDetail: {
    color:      colors.text.tertiary,
    fontSize:   fontSize.xs,
    lineHeight: fontSize.xs * 1.6,
  },

  footer: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[2],
    paddingBottom:     spacing[4],
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
  },
  footerText: {
    color:     colors.text.tertiary,
    fontSize:  fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    fontStyle: 'italic',
  },
});
