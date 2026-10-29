import { summariseSleepSamples, todaysSleep } from '../sleepSamples';
import { calculateReadiness } from '../readiness';
import type { HealthData } from '@/types/index';

const s = (start: string, end: string, value: string) => ({ startDate: start, endDate: end, value });

describe('summariseSleepSamples', () => {
  it('reports deep, REM and efficiency as not measured for an unstaged night', () => {
    const r = summariseSleepSamples([s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP')]);
    expect(r).toMatchObject({ duration: 420, deep: null, rem: null, efficiency: null });
  });

  it('counts stages and ignores the duplicate generic ASLEEP sample', () => {
    const r = summariseSleepSamples([
      s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP'),
      s('2026-09-22T23:00:00', '2026-09-23T03:00:00', 'CORE'),
      s('2026-09-23T03:00:00', '2026-09-23T04:30:00', 'DEEP'),
      s('2026-09-23T04:30:00', '2026-09-23T06:00:00', 'REM'),
    ]);
    expect(r).toMatchObject({ duration: 420, deep: 90, rem: 90, efficiency: null });
  });

  it('computes efficiency only when in-bed time exists', () => {
    const r = summariseSleepSamples([
      s('2026-09-22T22:30:00', '2026-09-23T06:30:00', 'INBED'),
      s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP'),
    ]);
    expect(r?.efficiency).toBe(88);
  });

  it('returns null below the minimum asleep time', () => {
    expect(summariseSleepSamples([s('2026-09-23T13:00:00', '2026-09-23T13:40:00', 'ASLEEP')], 60)).toBeNull();
  });
});

describe('unstaged night in the score', () => {
  it('scores a 7-hour unstaged night 100 for sleep (was 58 before 1.0.3)', () => {
    const night = summariseSleepSamples([s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP')])!;
    const data: HealthData = {
      date: '2026-09-23', hrv: null, restingHeartRate: null,
      sleepDuration: night.duration, deepSleep: night.deep, remSleep: night.rem,
      sleepEfficiency: night.efficiency, stressScore: null, daytimeAvgHR: null,
      steps: null, activeCalories: null, exerciseMinutes: null,
    };
    const r = calculateReadiness(data);
    expect(r.components.sleep).toBe(100);
    expect(r.score).toBe(70);
  });
});

import { splitSleepSessions, sleepByDay } from '../sleepSamples';

describe('sleep sessions (1.0.4)', () => {
  const night = [
    s('2026-09-22T22:40:00', '2026-09-22T23:50:00', 'CORE'),
    s('2026-09-22T23:50:00', '2026-09-23T01:10:00', 'DEEP'),
    s('2026-09-23T01:10:00', '2026-09-23T05:00:00', 'CORE'),
    s('2026-09-23T05:00:00', '2026-09-23T06:30:00', 'REM'),
  ];

  it('keeps stages that end before midnight in the same night', () => {
    const byDay = sleepByDay(night);
    expect(Object.keys(byDay)).toEqual(['2026-09-23']);
    expect(byDay['2026-09-23'].duration).toBe(470);   // 22:40 to 06:30
    expect(byDay['2026-09-23'].deep).toBe(80);
  });

  it('records the session start and end', () => {
    const r = sleepByDay(night)['2026-09-23'];
    expect(new Date(r.start!).getHours()).toBe(22);
    expect(new Date(r.end!).getHours()).toBe(6);
  });

  it('skips an afternoon nap and splits on a long gap', () => {
    const withNap = [...night, s('2026-09-23T14:00:00', '2026-09-23T15:10:00', 'ASLEEP')];
    expect(splitSleepSessions(withNap)).toHaveLength(2);
    expect(Object.keys(sleepByDay(withNap))).toEqual(['2026-09-23']);
  });
});

describe('warning banner with only a typed-in HRV (1.0.4)', () => {
  it('does not claim heart rate is tracked', () => {
    const data: HealthData = {
      date: '2026-09-28', hrv: 55, hrvSource: 'manual', restingHeartRate: null,
      sleepDuration: null, deepSleep: null, remSleep: null, sleepEfficiency: null,
      stressScore: null, daytimeAvgHR: null, steps: null, activeCalories: null, exerciseMinutes: null,
    };
    const msg = calculateReadiness(data).dataQuality.warningMessage ?? '';
    expect(msg).toContain('HRV you entered');
    expect(msg).not.toContain('Heart rate is tracked');
  });
});

describe("today's sleep uses History's rule (1.2.1)", () => {
  const night = [
    s('2026-09-22T22:40:00', '2026-09-22T23:50:00', 'CORE'),
    s('2026-09-22T23:50:00', '2026-09-23T01:10:00', 'DEEP'),
    s('2026-09-23T01:10:00', '2026-09-23T05:00:00', 'CORE'),
    s('2026-09-23T05:00:00', '2026-09-23T06:30:00', 'REM'),
  ];
  const at = (iso: string) => new Date(iso);

  it('returns the night that ended this morning, with its bounds for the HRV window', () => {
    const r = todaysSleep(night, at('2026-09-23T09:00:00'));
    expect(r?.duration).toBe(470);
    expect(r?.deep).toBe(80);
    expect(new Date(r!.start!).getHours()).toBe(22);
    expect(new Date(r!.end!).getHours()).toBe(6);
  });

  it('keeps the night when an afternoon nap was recorded after it', () => {
    const withNap = [...night, s('2026-09-23T14:00:00', '2026-09-23T15:10:00', 'ASLEEP')];
    expect(todaysSleep(withNap, at('2026-09-23T16:00:00'))?.duration).toBe(470);
  });

  it('is null when the only session ended yesterday morning', () => {
    expect(todaysSleep(night, at('2026-09-24T09:00:00'))).toBeNull();
  });

  it('skips a session ending today at 14:00 or later', () => {
    const late = [s('2026-09-23T08:00:00', '2026-09-23T14:00:00', 'ASLEEP')];
    expect(todaysSleep(late, at('2026-09-23T16:00:00'))).toBeNull();
    const later = [s('2026-09-23T09:30:00', '2026-09-23T15:30:00', 'ASLEEP')];
    expect(todaysSleep(later, at('2026-09-23T17:00:00'))).toBeNull();
  });
});
