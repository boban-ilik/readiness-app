import { summariseSleepSamples } from '../sleepSamples';
import { calculateReadiness } from '../readiness';
import type { HealthData } from '@/types/index';

const s = (start: string, end: string, value: string) => ({ startDate: start, endDate: end, value });

describe('summariseSleepSamples', () => {
  it('reports deep, REM and efficiency as not measured for an unstaged night', () => {
    const r = summariseSleepSamples([s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP')]);
    expect(r).toEqual({ duration: 420, deep: null, rem: null, efficiency: null });
  });

  it('counts stages and ignores the duplicate generic ASLEEP sample', () => {
    const r = summariseSleepSamples([
      s('2026-09-22T23:00:00', '2026-09-23T06:00:00', 'ASLEEP'),
      s('2026-09-22T23:00:00', '2026-09-23T03:00:00', 'CORE'),
      s('2026-09-23T03:00:00', '2026-09-23T04:30:00', 'DEEP'),
      s('2026-09-23T04:30:00', '2026-09-23T06:00:00', 'REM'),
    ]);
    expect(r).toEqual({ duration: 420, deep: 90, rem: 90, efficiency: null });
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
