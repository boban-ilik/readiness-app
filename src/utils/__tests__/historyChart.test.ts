import { buildPoints, type MetricConfig } from '../historyChart';
import type { DayHistory } from '@hooks/useHistoryData';

function day(date: string, score: number | null): DayHistory {
  return {
    date,
    dayLabel: 'Mon',
    score,
    components: null,
    rhr: null,
    hrv: null,
    sleepMinutes: null,
    sleepEfficiency: null,
  };
}

const cfg: MetricConfig = {
  label: 'READINESS',
  unit: 'pts',
  color: '#F5A623',
  getValue: d => d.score,
  gridLines: [25, 50, 75],
  yMin: 0,
  yMax: 100,
  format: v => String(v),
};

describe('buildPoints', () => {
  it('returns no points for no data', () => {
    expect(buildPoints([], 100, 50, 10, '2026-03-09', cfg, 5)).toEqual([]);
  });

  it('centres a single point and flags today', () => {
    const [p] = buildPoints([day('2026-03-09', 50)], 100, 50, 10, '2026-03-09', cfg, 5);
    expect(p.x).toBe(55); // padX + plotWidth / 2
    expect(p.isToday).toBe(true);
  });

  it('spaces multiple points evenly across the plot', () => {
    const pts = buildPoints([day('a', 0), day('b', 100)], 100, 50, 10, 'b', cfg, 5);
    expect(pts.map(p => p.x)).toEqual([5, 105]);
  });

  it('maps a value to y and clamps out-of-range values', () => {
    const pts = buildPoints([day('a', 50), day('b', 150)], 100, 100, 0, 'a', cfg, 0);
    expect(pts[0].y).toBe(50);
    expect(pts[1].y).toBe(0);   // clamped to yMax
    expect(pts[1].score).toBe(150); // raw value preserved for the label
  });

  it('leaves a missing value without a y', () => {
    const [p] = buildPoints([day('a', null)], 100, 100, 0, 'a', cfg, 0);
    expect(p.y).toBeNull();
    expect(p.score).toBeNull();
  });
});
