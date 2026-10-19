/**
 * NewTodayLine
 *
 * Days 1 to 6: one line under the score naming something new in the user's
 * own data (see pickNewToday). Mount only in that window: it reads 30 days
 * of Health history for the personal-best check.
 */

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, fontWeight, spacing } from '@constants/theme';
import { useHistoryData } from '@hooks/useHistoryData';
import { FORECAST_LOG_KEY, type ForecastLog } from '@services/forecastLog';
import { loadOpenedFeatures, type Feature } from '@services/openedFeatures';
import { track } from '@services/analytics';
import { pickNewToday, type NewToday } from '@utils/newToday';
import { localDateStr } from '@utils/index';

interface Props {
  todayScore: number;
  unusual:    { metric: 'hrv' | 'rhr'; direction: 'high' | 'low' } | null;
  trendShown: boolean;
  onAskCoach: () => void;
}

export default function NewTodayLine({ todayScore, unusual, trendShown, onAskCoach }: Props) {
  const { history, isLoading } = useHistoryData(30);
  const [forecast, setForecast] = useState<{ score: number; low: number; high: number } | null | undefined>(undefined);
  const [opened,   setOpened]   = useState<Record<Feature, boolean> | null>(null);

  useEffect(() => {
    const today = localDateStr();
    AsyncStorage.getItem(FORECAST_LOG_KEY)
      .then(raw => {
        // Made yesterday, one day ahead: the forecast the user saw for today
        const e = raw ? (JSON.parse(raw) as ForecastLog)[today]?.['1'] : undefined;
        setForecast(e ? { score: e.score, low: e.low, high: e.high } : null);
      })
      .catch(() => setForecast(null));
    loadOpenedFeatures().then(setOpened);
  }, []);

  const today = localDateStr();
  const item: NewToday | null = isLoading || forecast === undefined || !opened
    ? null
    : pickNewToday({
        todayScore,
        unusual,
        forecast,
        pastScores: history.filter(d => d.date < today && d.score != null && d.score > 0).map(d => d.score as number),
        opened,
        trendShown,
      });

  useEffect(() => {
    if (item) track('new_today_shown', { kind: item.kind });
  }, [item?.kind]);

  if (!item) return null;

  const body = (
    <Text style={styles.text}>
      <Text style={styles.label}>NEW TODAY  </Text>
      {item.text}
    </Text>
  );

  return item.kind === 'try_coach' ? (
    <TouchableOpacity onPress={onAskCoach} activeOpacity={0.7} accessibilityRole="button" style={styles.wrap}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={styles.wrap}>{body}</View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf:    'center',
    maxWidth:     340,
    marginTop:    -spacing[3],
    marginBottom: spacing[5],
  },
  text: {
    textAlign:  'center',
    fontSize:   fontSize.sm,
    lineHeight: 20,
    color:      colors.text.secondary,
  },
  label: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 1.0,
    color:         colors.amber[400],
  },
});
