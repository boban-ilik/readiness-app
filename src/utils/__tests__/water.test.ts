import { formatWater, waterProgress, clampTarget, TAP_LITRES, litresToFlOz } from '../water';
import { sanitiseWater, waterLines } from '../../../supabase/functions/_shared/water';

describe('water units', () => {
  it('formats litres to one decimal and drops .0', () => {
    expect(formatWater(1.5, 'l')).toBe('1.5 l');
    expect(formatWater(2, 'l')).toBe('2 l');
    expect(formatWater(0.46, 'l')).toBe('0.5 l');
  });
  it('formats fl oz as whole numbers; a tap is 16 fl oz', () => {
    expect(formatWater(TAP_LITRES.floz, 'floz')).toBe('16 fl oz');
    expect(formatWater(2.5, 'floz')).toBe('85 fl oz');
    expect(Math.round(litresToFlOz(1))).toBe(34);
  });
  it('caps progress between 0 and 1', () => {
    expect(waterProgress(1.25, 2.5)).toBe(0.5);
    expect(waterProgress(4, 2.5)).toBe(1);
    expect(waterProgress(1, 0)).toBe(0);
  });
  it('keeps the target between 0.5 and 6 l', () => {
    expect(clampTarget(0.25)).toBe(0.5);
    expect(clampTarget(9)).toBe(6);
    expect(clampTarget(2.75)).toBe(2.75);
  });
});

describe('water context on the server', () => {
  it('accepts a sane payload and describes it without dashes', () => {
    const w = sanitiseWater({ todayLitres: 1.234, targetLitres: 2.5, localHour: 15 })!;
    expect(w).toEqual({ todayLitres: 1.23, targetLitres: 2.5, localHour: 15 });
    expect(waterLines(w).join(' ')).not.toMatch(/[—–]/);
  });
  it('rejects junk', () => {
    expect(sanitiseWater({ todayLitres: -1, targetLitres: 2.5, localHour: 9 })).toBeNull();
    expect(sanitiseWater({ todayLitres: 1, targetLitres: 50, localHour: 9 })).toBeNull();
    expect(sanitiseWater('lots')).toBeNull();
  });
});

describe('one water target on Today', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getNutritionRecommendation } = require('../nutrition');
  const comps = { recovery: 80, sleep: 80, stress: 80 };
  it('uses the Hydration target instead of the bodyweight estimate', () => {
    const withTarget = getNutritionRecommendation(81, comps, null, 55, 80, '3 l');
    expect(withTarget.hydration).toMatch(/^Target 3 l today/);
    const without = getNutritionRecommendation(81, comps, null, 55, 80);
    expect(without.hydration).toMatch(/^Target \d+(\.\d)? L today/);
  });
});

describe('baseline wording', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { baselinePhrase } = require('../readiness');
  it('never calls the stand-in value yours', () => {
    expect(baselinePhrase('hrv', 55)).toBe('a typical 55 ms');
    expect(baselinePhrase('rhr', 60)).toBe('a typical 60 bpm');
    expect(baselinePhrase('hrv', 62)).toBe('your 62 ms baseline');
    expect(baselinePhrase('rhr', 52)).toBe('your 52 bpm baseline');
  });
});

describe('baseline source flag', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { baselinePhrase, setBaselineSource } = require('../readiness');
  afterEach(() => { setBaselineSource('rhr', undefined); setBaselineSource('hrv', undefined); });

  it('says "your" for a real baseline that happens to equal the stand-in', () => {
    setBaselineSource('rhr', true);
    expect(baselinePhrase('rhr', 60)).toBe('your 60 bpm baseline');
  });
  it('still says typical when the baseline is known to be the stand-in, or unknown', () => {
    setBaselineSource('rhr', false);
    expect(baselinePhrase('rhr', 60)).toBe('a typical 60 bpm');
    setBaselineSource('rhr', undefined);
    expect(baselinePhrase('rhr', 60)).toBe('a typical 60 bpm');
  });
});
