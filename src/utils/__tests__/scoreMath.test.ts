import { buildScoreMath, n1 } from '../scoreMath';
import { explainReadiness } from '../readiness';
import type { HealthData } from '@/types/index';

const base: HealthData = {
  date: '2026-09-23', hrv: 61, restingHeartRate: 52,
  sleepDuration: 480, deepSleep: 96, remSleep: 120, sleepEfficiency: null,
  stressScore: null, daytimeAvgHR: null, steps: null, activeCalories: null, exerciseMinutes: null,
};

function build(data: HealthData, hrvB = 58, rhrB = 54, extra: Partial<Parameters<typeof buildScoreMath>[0]> = {}) {
  return buildScoreMath({
    explanation: explainReadiness(data, hrvB, rhrB),
    hrvBaseline: hrvB, rhrBaseline: rhrB, hrvBaselineAllMonth: hrvB, rhrBaselineAllMonth: rhrB,
    cycle: null, uncorrectedScore: null, ...extra,
  });
}

describe('buildScoreMath', () => {
  it('ends the total line on the real score', () => {
    const e = explainReadiness(base, 58, 54);
    const total = build(base).find(s => s.key === 'total')!;
    expect(total.result).toBe(e.score);
    expect(total.lines[1]).toContain(`rounded to ${e.score}.`);
  });

  it('explains a missing stage honestly', () => {
    const sleep = build({ ...base, deepSleep: null, remSleep: null }).find(s => s.key === 'sleep')!;
    expect(sleep.result).toBe(100);
    expect(sleep.lines.join(' ')).toContain("didn't record deep sleep, REM, time in bed");
  });

  it('uses the neutral wording when a component has no data', () => {
    const s = build({ ...base, hrv: null, restingHeartRate: null, sleepDuration: null });
    expect(s.find(x => x.key === 'recovery')!.lines[0]).toContain('neutral 50');
    expect(s.find(x => x.key === 'sleep')!.lines[0]).toContain('neutral 50');
  });

  it('describes the cycle correction and the uncorrected score', () => {
    const s = build(base, 50, 57, {
      hrvBaselineAllMonth: 58, rhrBaselineAllMonth: 54, uncorrectedScore: 71,
      cycle: { status: 'active', phase: 'luteal', completedCycles: 3, hrvSamples: 11, rhrSamples: 12, hrv: 50, rhr: 57 },
    });
    const text = s.find(x => x.key === 'cycle')!.lines.join(' ');
    expect(text).toContain('luteal nights from earlier cycles: 50 ms from 11 nights, instead of 58 ms');
    expect(text).toContain('score would be 71');
  });

  it('never uses an em dash', () => {
    const all = build(base).concat(build({ ...base, hrv: null, daytimeAvgHR: 70 })).flatMap(s => [s.title, ...s.lines]).join('\n');
    expect(all).not.toMatch(/—/);
  });

  it('formats one decimal', () => {
    expect(n1(31.46)).toBe('31.5');
    expect(n1(9)).toBe('9');
  });
});
