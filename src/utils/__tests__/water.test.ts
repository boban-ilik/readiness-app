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
