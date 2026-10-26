import { garminDaysFromRows, overlayGarminToday, sleepFromRow, workoutFromActivity } from '../garminSource';

const daily = [{ calendar_date: '2026-10-26', resting_hr: 52, steps: 8100, active_kcal: 400, avg_stress: 31, moderate_sec: 0, vigorous_sec: 0 }];
const sleep = [
  { calendar_date: '2026-10-26', start_time: '2026-10-25T22:10:00Z', duration_sec: 25200, deep_sec: 4440, rem_sec: 3840, awake_sec: 1920, validation: 'ENHANCED_FINAL' },
  { calendar_date: '2026-10-26', start_time: '2026-10-26T13:00:00Z', duration_sec: 1200, deep_sec: null, rem_sec: null, awake_sec: 0, validation: 'AUTO_FINAL' },
];
const hrv = [{ calendar_date: '2026-10-26', last_night_avg: 44 }];
const hydration = [{ calendar_date: '2026-10-26', fluid_ml: 1473 }];

describe('garmin source', () => {
  it('turns a sleep row into minutes, stages and efficiency', () => {
    expect(sleepFromRow(sleep[0])).toEqual({ duration: 420, deep: 74, rem: 64, efficiency: 93, start: '2026-10-25T22:10:00.000Z', end: '2026-10-26T05:42:00.000Z' });
    expect(sleepFromRow({ ...sleep[0], validation: 'MANUAL' })).toBeNull();
  });

  it('builds per-day maps, keeping the longer sleep for a date', () => {
    const days = garminDaysFromRows({ daily, sleep, hrv, hydration });
    expect(days.rhr['2026-10-26']).toBe(52);
    expect(days.hrv['2026-10-26']).toBe(44);
    expect(days.stress['2026-10-26']).toBe(31);
    expect(days.sleep['2026-10-26'].duration).toBe(420);
    expect(days.hydration['2026-10-26']).toBe(1.47);
  });

  it('lays Garmin values over Apple Health for today and marks the HRV source', () => {
    const days = garminDaysFromRows({ daily, sleep, hrv, hydration });
    const base = { date: '2026-10-26', hrv: null, restingHeartRate: 58, sleepDuration: null, deepSleep: null, remSleep: null, sleepEfficiency: null, stressScore: null, daytimeAvgHR: 70, steps: 900, activeCalories: null, exerciseMinutes: null };
    const out = overlayGarminToday(base, days, '2026-10-26')!;
    expect(out).toMatchObject({ hrv: 44, hrvSource: 'garmin', restingHeartRate: 52, sleepDuration: 420, deepSleep: 74, stressScore: 31, daytimeAvgHR: 70, steps: 900 });
    expect(overlayGarminToday(null, days, '2026-10-26')!.hrv).toBe(44);
    expect(overlayGarminToday(base, days, '2026-10-20')).toBe(base);
  });

  it('turns an activity into a workout for the load analysis', () => {
    expect(workoutFromActivity({ summary_id: 'a', activity_type: 'TRAIL_RUNNING', activity_name: null, start_time: '2026-10-25T10:00:00Z', duration_sec: 3600, active_kcal: 500, avg_hr: 140 }))
      .toEqual({ activityName: 'trail running', durationSecs: 3600, calories: 500, startDate: '2026-10-25T10:00:00.000Z', endDate: '2026-10-25T11:00:00.000Z' });
    expect(workoutFromActivity({ summary_id: 'b', activity_type: 'RUNNING', activity_name: null, start_time: null, duration_sec: 100, active_kcal: null, avg_hr: null })).toBeNull();
  });
});
