import { computeForecast, forecastBaseline } from '../readinessForecast';
import type { PatternInsight } from '../patternAnalysis';

const pattern = (type: string): PatternInsight => ({ type, severity: 'info', message: '' });

describe('forecastBaseline', () => {
  it('measures the first day from today, not from its own score', () => {
    const forecast = computeForecast(60, [pattern('consecutive_score_decline')], null);

    expect(forecast.map(day => day.score)).toEqual([54, 57, 60]);
    expect(forecast[0].trend).toBe('down');
    expect(forecast[0].score - forecastBaseline(forecast, 0, 60)).toBe(-6);
  });

  it('measures later days from the previous forecast day', () => {
    const forecast = computeForecast(60, [pattern('consecutive_score_decline')], null);

    expect(forecastBaseline(forecast, 1, 60)).toBe(54);
    expect(forecastBaseline(forecast, 2, 60)).toBe(57);
  });

  it('keeps the delta pill on the same side of the trend threshold', () => {
    const forecast = computeForecast(60, [pattern('consecutive_score_decline')], null);

    forecast.forEach((day, i) => {
      const delta = day.score - forecastBaseline(forecast, i, 60);
      const trend = delta >= 3 ? 'up' : delta <= -3 ? 'down' : 'flat';

      expect(day.trend).toBe(trend);
    });
  });
});
