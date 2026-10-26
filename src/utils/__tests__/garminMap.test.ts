import { mapSummary, itemsOf, garminUserId } from '../../../supabase/functions/_shared/garmin';

describe('garmin summary mapping', () => {
  it('maps a daily summary to the stored columns', () => {
    const row = mapSummary('dailies', 'u1', {
      summaryId: 'EXAMPLE_67891', calendarDate: '2026-10-25', startTimeInSeconds: 1761350400, startTimeOffsetInSeconds: 7200,
      durationInSeconds: 86400, steps: 8210, restingHeartRateInBeatsPerMinute: 52, averageStressLevel: 31, maxStressLevel: 88,
      bodyBatteryChargedValue: 61, bodyBatteryDrainedValue: 58, stressQualifier: 'balanced', activeKilocalories: 421,
    })!;
    expect(row).toMatchObject({ user_id: 'u1', calendar_date: '2026-10-25', resting_hr: 52, avg_stress: 31, steps: 8210, body_battery_charged: 61, stress_qualifier: 'balanced' });
    expect(row.start_time).toBe('2025-10-25T00:00:00.000Z');  // 1761350400 as ISO
  });

  it('maps sleep stages, validation and the sleep score', () => {
    const row = mapSummary('sleeps', 'u1', {
      summaryId: 'x1', calendarDate: '2026-10-25', startTimeInSeconds: 1761330000, durationInSeconds: 25200,
      deepSleepDurationInSeconds: 4440, lightSleepDurationInSeconds: 15000, remSleepInSeconds: 3840, awakeDurationInSeconds: 1920,
      validation: 'ENHANCED_FINAL', overallSleepScore: { value: 82, qualifierKey: 'GOOD' },
    })!;
    expect(row).toMatchObject({ deep_sec: 4440, rem_sec: 3840, validation: 'ENHANCED_FINAL', sleep_score: 82, sleep_quality: 'GOOD', duration_sec: 25200 });
  });

  it('keeps the overnight HRV average and the five-minute series', () => {
    const row = mapSummary('hrv', 'u1', { summaryId: 'h1', calendarDate: '2026-10-25', lastNightAvg: 44, lastNight5MinHigh: 72, startTimeInSeconds: 1761330004, durationInSeconds: 3820, hrvValues: { '300': 32, '600': 24 } })!;
    expect(row).toMatchObject({ last_night_avg: 44, last_night_5min_high: 72, values_5min: { '300': 32, '600': 24 } });
  });

  it('maps hydration, user metrics and activities', () => {
    expect(mapSummary('hydration', 'u1', { summaryId: 'w1', calendarDate: '2026-10-25', fluidIntakeInML: 473 })).toMatchObject({ fluid_ml: 473 });
    expect(mapSummary('userMetrics', 'u1', { summaryId: 'm1', calendarDate: '2026-10-25', vo2Max: 48.5, fitnessAge: 31, enhanced: true })).toMatchObject({ vo2_max: 48.5, fitness_age: 31, enhanced: true });
    expect(mapSummary('activities', 'u1', { summaryId: '5001968355', activityId: 5001968355, activityType: 'RUNNING', startTimeInSeconds: 1452470400, durationInSeconds: 11580, averageHeartRateInBeatsPerMinute: 142, distanceInMeters: 519818.125, activeKilocalories: 448, deviceName: 'fenix 8' }))
      .toMatchObject({ summary_id: '5001968355', activity_id: '5001968355', activity_type: 'RUNNING', avg_hr: 142, duration_sec: 11580 });
  });

  it('drops items that lack their key fields', () => {
    expect(mapSummary('dailies', 'u1', { summaryId: 'x' })).toBeNull();
    expect(mapSummary('sleeps', 'u1', { calendarDate: '2026-10-25' })).toBeNull();
    expect(mapSummary('activities', 'u1', { activityType: 'RUNNING' })).toBeNull();
  });

  it('reads the items of a push body by summary type', () => {
    const body = { dailies: [{ userId: 'g1', calendarDate: '2026-10-25' }, null, 'junk'] };
    const items = itemsOf(body, 'dailies');
    expect(items).toHaveLength(1);
    expect(garminUserId(items[0])).toBe('g1');
    expect(itemsOf(body, 'sleeps')).toEqual([]);
    expect(itemsOf('nope', 'dailies')).toEqual([]);
  });
});
