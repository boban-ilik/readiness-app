import { recoveryStatus, buildBreakdownDetail } from '../breakdown';

describe('recovery status', () => {
  it('reads a night near the baseline as Typical', () => {
    expect(recoveryStatus(50).label).toBe('Typical');
    expect(recoveryStatus(49).label).toBe('Typical');
    expect(recoveryStatus(43).label).toBe('Typical');
    expect(recoveryStatus(57).label).toBe('Typical');
  });
  it('keeps the other bands outside it', () => {
    expect(recoveryStatus(42).label).toBe('Reduced');
    expect(recoveryStatus(58).label).toBe('Moderate');
    expect(recoveryStatus(70).label).toBe('Good');
    expect(recoveryStatus(20).label).toBe('Low');
  });
  it('the badge and the summary line agree for a normal night', () => {
    const h = { date: '2026-10-26', hrv: 58, restingHeartRate: 52, sleepDuration: 427, deepSleep: 82, remSleep: 98, sleepEfficiency: 88, stressScore: null, daytimeAvgHR: null, steps: null, activeCalories: null, exerciseMinutes: null };
    const d = buildBreakdownDetail('recovery', 49, h, 54, 62);
    expect(d.statusLabel).toBe('Typical');
    const overall = d.metrics.find(m => m.label === 'Overall Recovery Signal')!;
    expect(overall.value).toBe('Typical');
    expect(overall.sub).toContain('close to your usual');
  });
});
