/**
 * Geometry for the readiness trend chart (pure): the last 7 days as a solid
 * line, the 3-day forecast as a dashed line with its likely range shaded.
 *
 * Points are placed by date, not by index, so a missed day shows as a gap in
 * time instead of being squeezed out. The forecast always starts tomorrow.
 */

export interface TrendPoint { date: string; score: number }
export interface ForecastPoint { score: number; range: [number, number] }

export interface ChartBox {
  width: number; height: number;
  padLeft: number; padRight: number; padTop: number; padBottom: number;
}

export interface PlottedPoint { x: number; y: number; date: string; score: number }
export interface PlottedForecast extends PlottedPoint { yLow: number; yHigh: number; low: number; high: number }

export interface TrendChart {
  past:     PlottedPoint[];
  future:   PlottedForecast[];
  /** Horizontal guide lines */
  ticks:    Array<{ value: number; y: number }>;
  /** x of today, the boundary between measured and projected */
  todayX:   number;
  yMin:     number;
  yMax:     number;
}

function dayNum(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function dateFromNum(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

/** Round the value range out to tens so the guide lines land on round numbers. */
function niceRange(values: number[]): [number, number] {
  const lo = Math.max(0,   Math.floor((Math.min(...values) - 5) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...values) + 5) / 10) * 10);
  return hi - lo >= 20 ? [lo, hi] : [Math.max(0, hi - 20), hi];
}

export function buildTrendChart(
  past: TrendPoint[],
  forecast: ForecastPoint[],
  today: string,
  box: ChartBox,
): TrendChart | null {
  if (past.length === 0) return null;

  const first   = dayNum(past[0].date);
  const todayN  = dayNum(today);
  const last    = todayN + forecast.length;
  const span    = Math.max(1, last - first);
  const innerW  = box.width - box.padLeft - box.padRight;
  const innerH  = box.height - box.padTop - box.padBottom;

  const all = [...past.map(p => p.score), ...forecast.flatMap(f => [f.score, f.range[0], f.range[1]])];
  const [yMin, yMax] = niceRange(all);

  const x = (n: number) => box.padLeft + ((n - first) / span) * innerW;
  const y = (v: number) => box.padTop + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const ticks: TrendChart['ticks'] = [];
  const step = yMax - yMin > 40 ? 20 : 10;
  for (let v = yMin; v <= yMax; v += step) ticks.push({ value: v, y: y(v) });

  return {
    past: past.map(p => ({ x: x(dayNum(p.date)), y: y(p.score), date: p.date, score: p.score })),
    future: forecast.map((f, i) => ({
      x: x(todayN + i + 1), y: y(f.score), date: dateFromNum(todayN + i + 1), score: f.score,
      yLow: y(f.range[0]), yHigh: y(f.range[1]), low: f.range[0], high: f.range[1],
    })),
    ticks,
    todayX: x(todayN),
    yMin,
    yMax,
  };
}

/** Bar height for the 7-day strip, on a fixed 30 to 100 scale so a low day isn't drawn as nothing. */
export function stripBarHeight(score: number, maxHeight: number, minHeight = 4): number {
  const share = (Math.min(100, Math.max(30, score)) - 30) / 70;
  return Math.max(minHeight, share * maxHeight);
}
