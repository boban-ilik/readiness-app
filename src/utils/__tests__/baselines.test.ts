import { computeMedian, computeRHRBaseline, computeHRVBaseline } from '@utils/index';

describe('computeMedian', () => {
  it('returns 0 for an empty array', () => {
    expect(computeMedian([])).toBe(0);
  });

  it('returns the single value', () => {
    expect(computeMedian([42])).toBe(42);
  });

  it('returns the middle value for an odd count', () => {
    expect(computeMedian([1, 2, 3])).toBe(2);
  });

  it('averages the two middle values for an even count, rounded', () => {
    expect(computeMedian([1, 2, 3, 4])).toBe(3); // round((2 + 3) / 2)
  });

  it('sorts before taking the median', () => {
    expect(computeMedian([10, 1, 3])).toBe(3);
  });
});

describe('computeRHRBaseline', () => {
  it('falls back to the population default with fewer than 7 samples', () => {
    expect(computeRHRBaseline([60, 62, 64, 66, 68, 70])).toBe(60);
  });

  it('honours a custom population default', () => {
    expect(computeRHRBaseline([60], 64)).toBe(64);
  });

  it('honours a custom minimum sample count', () => {
    expect(computeRHRBaseline([60, 61, 62], 60, 3)).toBe(61); // median of all 3
  });

  it('trims the top 20% (high-effort / sick spikes) before the median', () => {
    // 8 samples -> keep ceil(8 * 0.8) = 7 lowest; the 200 spike is dropped.
    expect(computeRHRBaseline([55, 55, 55, 55, 55, 55, 55, 200])).toBe(55);
  });

  it('returns the median of the lower 80%', () => {
    // sorted [50,52,54,56,58,60,100] -> keep 6 -> median of [50..60] = 55
    expect(computeRHRBaseline([50, 52, 54, 56, 58, 60, 100])).toBe(55);
  });

  it('does not mutate the input array', () => {
    const samples = [60, 55, 65, 50, 70, 58, 62];
    const copy = [...samples];
    computeRHRBaseline(samples);
    expect(samples).toEqual(copy);
  });
});

describe('computeHRVBaseline', () => {
  it('falls back to the population default with fewer than 7 samples', () => {
    expect(computeHRVBaseline([50, 52, 54, 56, 58, 60])).toBe(55);
  });

  it('honours a custom population default', () => {
    expect(computeHRVBaseline([50], 60)).toBe(60);
  });

  it('trims the bottom 20% (sick / alcohol / overtraining lows) before the median', () => {
    // 8 samples -> skip floor(8 * 0.2) = 1 lowest; the 20 is dropped.
    expect(computeHRVBaseline([20, 60, 60, 60, 60, 60, 60, 60])).toBe(60);
  });

  it('returns the median of the upper 80%', () => {
    // sorted [40,50,55,60,65,70,75] -> skip 1 -> median of [50..75] = 63
    expect(computeHRVBaseline([40, 50, 55, 60, 65, 70, 75])).toBe(63);
  });

  it('does not mutate the input array', () => {
    const samples = [60, 55, 65, 50, 70, 58, 62];
    const copy = [...samples];
    computeHRVBaseline(samples);
    expect(samples).toEqual(copy);
  });
});
