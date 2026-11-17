import { getNutritionRecommendation } from '../nutrition';
import type { HealthData } from '@/types/index';

const components = { recovery: 45, sleep: 79, stress: 73 } as any;
const health = (over: Partial<HealthData>): HealthData =>
  ({ hrv: 44, sleepDuration: 346, deepSleep: 74, ...over } as any);

describe('nutrition rationale wording', () => {
  it('states sleep in hours and minutes, never decimal hours', () => {
    const rec = getNutritionRecommendation(63, components, health({}), 44);
    expect(rec.rationale).toContain('5h 46m of sleep last night.');
    expect(rec.rationale).not.toMatch(/\d\.\d h of sleep/);
  });

  it('says level with the baseline instead of "+0"', () => {
    const rec = getNutritionRecommendation(63, components, health({}), 44);
    expect(rec.rationale).toContain('level with');
    expect(rec.rationale).not.toContain('+0');
  });

  it('keeps a signed delta when HRV is off baseline', () => {
    expect(getNutritionRecommendation(63, components, health({ hrv: 50 }), 44).rationale).toContain('+6 vs');
    expect(getNutritionRecommendation(63, components, health({ hrv: 40 }), 44).rationale).toContain('-4 vs');
  });
});

describe('activity sheet describes the day one way', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { buildBreakdownDetail } = require('../breakdown');
  const sheet = (steps: number, score: number) => {
    const d = buildBreakdownDetail('activity', score, { steps, activeCalories: 280 } as any, 60);
    return [...d.metrics.map((m: any) => `${m.value} ${m.sub}`), d.interpretation, d.advice].join(' | ');
  };

  it('a 5,007-step day is lighter everywhere, never both moderate and low', () => {
    const text = sheet(5007, 38);
    expect(text).toContain('lighter day');
    expect(text).not.toMatch(/moderate day|moderately active|Low movement day|Low activity day|sedentary/);
  });

  it('a day under 5,000 steps is still called low', () => {
    expect(sheet(3200, 20)).toContain('Low movement day');
  });
});
