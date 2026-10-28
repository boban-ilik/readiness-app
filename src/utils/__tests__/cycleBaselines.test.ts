import { computePhaseBaselines, labelDaysByPhase } from '../cycleBaselines';

// Three starts 28 days apart → two complete 28-day cycles.
const starts = ['2026-06-01', '2026-06-29', '2026-07-27'];

function fill(from: string, days: number, value: number, into: Record<string, number>) {
  const [y, m, d] = from.split('-').map(Number);
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    into[dt.toISOString().slice(0, 10)] = value;
  }
}

describe('labelDaysByPhase', () => {
  it('labels only days inside complete cycles', () => {
    const { phaseByDay, completedCycles } = labelDaysByPhase(starts, 5);
    expect(completedCycles).toBe(2);
    expect(Object.keys(phaseByDay)).toHaveLength(56);
  });

  it('skips implausible gaps (a missed log)', () => {
    const { completedCycles } = labelDaysByPhase(['2026-03-01', '2026-06-01', '2026-06-29'], 5);
    expect(completedCycles).toBe(1);
  });
});

describe('computePhaseBaselines', () => {
  // Luteal days 17–22 of each 28-day cycle get HRV 48 / RHR 58; everything else 60 / 52.
  const hrv: Record<string, number> = {};
  const rhr: Record<string, number> = {};
  fill('2026-06-01', 56, 60, hrv); fill('2026-06-01', 56, 52, rhr);
  fill('2026-06-17', 6, 48, hrv);  fill('2026-06-17', 6, 58, rhr);
  fill('2026-07-15', 6, 48, hrv);  fill('2026-07-15', 6, 58, rhr);

  const base = { hrvByDay: hrv, rhrByDay: rhr, periodStarts: starts, periodLengthDays: 5, hrvBaseline: 60, rhrBaseline: 52 };

  it('uses the same-phase baseline once two cycles are logged', () => {
    const r = computePhaseBaselines({ ...base, todayPhase: 'luteal' });
    expect(r).toMatchObject({ status: 'active', completedCycles: 2, hrvSamples: 12, rhrSamples: 12, hrv: 48, rhr: 58 });
  });

  it('keeps collecting with only one complete cycle', () => {
    const r = computePhaseBaselines({ ...base, periodStarts: starts.slice(0, 2), todayPhase: 'luteal' });
    expect(r.status).toBe('collecting');
    expect(r.hrv).toBeNull();
    expect(r.rhr).toBeNull();
  });

  it('bounds the correction', () => {
    const low: Record<string, number> = { ...hrv };
    fill('2026-06-17', 6, 20, low); fill('2026-07-15', 6, 20, low);
    const r = computePhaseBaselines({ ...base, hrvByDay: low, todayPhase: 'luteal' });
    expect(r.hrv).toBe(45); // 60 × 0.75
  });

  it('returns collecting when today\'s phase is unknown', () => {
    expect(computePhaseBaselines({ ...base, todayPhase: null }).status).toBe('collecting');
  });
});

import { mergePeriodStarts } from '../cyclePhase';

describe('mergePeriodStarts', () => {
  it('unions, sorts and collapses the same period logged twice', () => {
    expect(mergePeriodStarts(['2026-07-28', '2026-06-01'], ['2026-07-27', '2026-06-29']))
      .toEqual(['2026-06-01', '2026-06-29', '2026-07-27']);
  });
  it('ignores malformed entries', () => {
    expect(mergePeriodStarts(['garbage', '2026-06-01T00:00:00Z'])).toEqual(['2026-06-01']);
  });
});
