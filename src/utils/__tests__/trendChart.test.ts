import { buildTrendChart, stripBarHeight } from '../trendChart';

const box = { width: 320, height: 200, padLeft: 30, padRight: 10, padTop: 10, padBottom: 20 };
const past = [
  { date: '2026-09-30', score: 80 }, { date: '2026-10-01', score: 81 }, { date: '2026-10-02', score: 59 },
  { date: '2026-10-04', score: 75 }, { date: '2026-10-06', score: 79 },   // 3 and 5 Oct missing
];
const forecast = [
  { score: 82, range: [77, 87] as [number, number] },
  { score: 82, range: [73, 91] as [number, number] },
  { score: 80, range: [67, 93] as [number, number] },
];

describe('buildTrendChart', () => {
  const c = buildTrendChart(past, forecast, '2026-10-06', box)!;

  it('spans from the first day to three days ahead', () => {
    expect(c.past[0].x).toBe(30);
    expect(c.future[2].x).toBe(310);
    expect(c.future.map(f => f.date)).toEqual(['2026-10-07', '2026-10-08', '2026-10-09']);
  });

  it('places days by date, so a missed day leaves a gap', () => {
    const step = c.past[1].x - c.past[0].x;
    expect(c.past[3].x - c.past[2].x).toBeCloseTo(step * 2);
  });

  it('starts the projection the day after today', () => {
    expect(c.todayX).toBeCloseTo(c.past[4].x);
    expect(c.future[0].x).toBeGreaterThan(c.todayX);
  });

  it('keeps every point and range inside the plot and puts higher scores higher', () => {
    for (const p of [...c.past, ...c.future]) {
      expect(p.y).toBeGreaterThanOrEqual(10);
      expect(p.y).toBeLessThanOrEqual(180);
    }
    for (const f of c.future) expect(f.yHigh).toBeLessThan(f.yLow);
    expect(c.past[1].y).toBeLessThan(c.past[2].y);   // 81 above 59
  });

  it('uses round guide lines that contain the data', () => {
    expect(c.yMin).toBe(50);
    expect(c.yMax).toBe(100);
    expect(c.ticks.map(t => t.value)).toEqual([50, 70, 90]);
  });

  it('draws the past alone when there is no forecast, and nothing without data', () => {
    expect(buildTrendChart(past, [], '2026-10-06', box)!.future).toEqual([]);
    expect(buildTrendChart([], forecast, '2026-10-06', box)).toBeNull();
  });
});

describe('stripBarHeight', () => {
  it('does not draw a 59 as nothing next to an 82', () => {
    expect(stripBarHeight(59, 44)).toBeGreaterThan(15);
    expect(stripBarHeight(82, 44)).toBeGreaterThan(stripBarHeight(59, 44));
  });
  it('never goes below the minimum sliver', () => {
    expect(stripBarHeight(10, 44)).toBe(4);
  });
});
