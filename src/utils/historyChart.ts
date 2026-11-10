/**
 * historyChart — the pure geometry behind the History trend chart.
 *
 * Kept out of the screen so the point/scale math is unit-testable.
 */

import type { DayHistory } from '@/types/index';

export interface MetricConfig {
  label:     string;
  unit:      string;
  color:     string;
  getValue:  (d: DayHistory) => number | null;
  gridLines: number[];
  yMin:      number;
  yMax:      number;
  format:    (v: number) => string;
}

export interface ChartPt {
  x:        number;
  y:        number | null;
  score:    number | null;
  dayLabel: string;
  isToday:  boolean;
}

export function buildPoints(
  data:        DayHistory[],
  plotWidth:   number,
  plotHeight:  number,
  padTop:      number,
  todayStr:    string,
  cfg:         MetricConfig,
  padX:        number,
): ChartPt[] {
  const n = data.length;
  const range = cfg.yMax - cfg.yMin;
  return data.map((d, i) => {
    const raw = cfg.getValue(d);
    const clamped = raw !== null ? Math.max(cfg.yMin, Math.min(cfg.yMax, raw)) : null;
    return {
      x:        padX + (n <= 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth),
      y:        clamped !== null ? padTop + (1 - (clamped - cfg.yMin) / range) * plotHeight : null,
      score:    raw,
      dayLabel: d.dayLabel,
      isToday:  d.date === todayStr,
    };
  });
}
