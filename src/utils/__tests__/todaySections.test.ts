import { pickTodayAlert, proBannerMode, weekSummary } from '../todaySections';
import type { ReadinessForecast } from '@services/readinessForecast';

describe('Today alert slot', () => {
  it('shows nothing when nothing is active', () => {
    expect(pickTodayAlert({})).toBeNull();
    expect(pickTodayAlert({ overtraining: false })).toBeNull();
  });

  it('shows illness before anything else', () => {
    expect(pickTodayAlert({ calibration: true, overtraining: true, illness: true })).toBe('illness');
  });

  it('ranks the rest in order: nudge, reading check, overtraining, calibration', () => {
    expect(pickTodayAlert({ calibration: true, overtraining: true, readingCheck: true, illnessNudge: true })).toBe('illnessNudge');
    expect(pickTodayAlert({ calibration: true, overtraining: true, readingCheck: true })).toBe('readingCheck');
    expect(pickTodayAlert({ calibration: true, overtraining: true })).toBe('overtraining');
    expect(pickTodayAlert({ calibration: true })).toBe('calibration');
  });
});

describe('Pro banner', () => {
  const base = { isPro: false, hasUsableScore: true, isTrialActive: false, trialDaysLeft: 0, dismissedDay: null, today: '2026-10-31' };

  it('never shows for a paying Pro user', () => {
    expect(proBannerMode({ ...base, isPro: true })).toBeNull();
  });

  it('waits for a usable score', () => {
    expect(proBannerMode({ ...base, hasUsableScore: false })).toBeNull();
  });

  it('shows the trial copy every day in the last three trial days, dismissed or not', () => {
    expect(proBannerMode({ ...base, isPro: true, isTrialActive: true, trialDaysLeft: 3, dismissedDay: '2026-10-31' })).toBe('trial');
    expect(proBannerMode({ ...base, isPro: true, isTrialActive: true, trialDaysLeft: 1 })).toBe('trial');
  });

  it('stays quiet earlier in the trial', () => {
    expect(proBannerMode({ ...base, isPro: true, isTrialActive: true, trialDaysLeft: 5 })).toBeNull();
  });

  it('shows the upsell once a day to a free user', () => {
    expect(proBannerMode(base)).toBe('upsell');
    expect(proBannerMode({ ...base, dismissedDay: '2026-10-31' })).toBeNull();
    expect(proBannerMode({ ...base, dismissedDay: '2026-10-30' })).toBe('upsell');
  });
});

describe('This week summary', () => {
  const day = (over: Partial<ReadinessForecast[0]>): ReadinessForecast[0] => ({
    label: 'Tomorrow', dateLabel: 'Sat', dateLabelLong: 'Saturday', score: 60, range: [55, 65],
    trend: 'flat', confidence: 'high', keyFactor: '', ...over,
  });
  const forecast: ReadinessForecast = [day({}), day({ label: 'In 2 days' }), day({ label: 'In 3 days' })];

  it('leads with the forecast for Pro', () => {
    expect(weekSummary({ isPro: true, forecast, lastWorkoutName: 'Lunch hike', eventsTaggedToday: 0 }))
      .toBe('Tomorrow likely 60, steady · Last workout: Lunch hike · Tag today');
  });

  it('tells free users what is Pro, and counts tags', () => {
    expect(weekSummary({ isPro: false, forecast, lastWorkoutName: null, eventsTaggedToday: 2 }))
      .toBe('2 tags today · Trend and forecast are Pro');
  });

  it('names the trend direction', () => {
    expect(weekSummary({ isPro: true, forecast: [day({ trend: 'down', score: 52 }), forecast[1], forecast[2]], lastWorkoutName: null, eventsTaggedToday: 1 }))
      .toBe('Tomorrow likely 52, easing · 1 tag today');
  });
});
