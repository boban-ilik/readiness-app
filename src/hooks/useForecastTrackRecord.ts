/**
 * The forecast's recent track record, from the on-device forecast log and the
 * scores saved to Supabase. Null until there are 5 comparable days.
 */

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';
import { fetchHistoryFromSupabase } from '@services/scoreSync';
import { FORECAST_LOG_KEY, type ForecastLog } from '@services/forecastLog';
import { forecastTrackRecord, type TrackRecord } from '@utils/forecastTrackRecord';
import { localDateStr } from '@utils/index';

export const TRACK_RECORD_DAYS = 14;

export function useForecastTrackRecord(): TrackRecord | null {
  const [record, setRecord] = useState<TrackRecord | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [raw, rows] = await Promise.all([
          AsyncStorage.getItem(FORECAST_LOG_KEY),
          fetchHistoryFromSupabase(user.id, TRACK_RECORD_DAYS + 1),
        ]);
        if (!live || !raw) return;
        const actual: Record<string, number> = {};
        for (const r of rows) actual[r.date] = r.score;
        setRecord(forecastTrackRecord(JSON.parse(raw) as ForecastLog, actual, TRACK_RECORD_DAYS, localDateStr()));
      } catch {
        // No record is fine; the strip just shows no line.
      }
    })();
    return () => { live = false; };
  }, []);
  return record;
}
