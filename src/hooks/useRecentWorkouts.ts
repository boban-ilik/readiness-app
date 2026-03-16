/**
 * useRecentWorkouts
 *
 * Fetches yesterday's workouts from Apple Health and returns a classified
 * WorkoutLoadSummary alongside the raw workout list.
 *
 * Pass `todayHrv` and `hrvBaseline` so the summary can flag whether HRV
 * suppression is likely due to training load.
 */

import { useState, useEffect } from 'react';
import { fetchYesterdayWorkouts, type RawWorkout } from '@services/healthkit';
import { buildWorkoutLoadSummary, type WorkoutLoadSummary } from '@utils/workoutLoad';

export interface RecentWorkoutsData {
  workouts:    RawWorkout[];
  loadSummary: WorkoutLoadSummary;
  isLoading:   boolean;
}

export function useRecentWorkouts(
  todayHrv:    number | null = null,
  hrvBaseline: number = 0,
): RecentWorkoutsData {
  const [workouts,  setWorkouts]  = useState<RawWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchYesterdayWorkouts()
      .then(raw => {
        if (!cancelled) setWorkouts(raw);
      })
      .catch(() => {
        if (!cancelled) setWorkouts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const loadSummary = buildWorkoutLoadSummary(workouts, todayHrv, hrvBaseline);

  return { workouts, loadSummary, isLoading };
}
