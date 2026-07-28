import { calculateReadiness } from '@utils/readiness';
import type { HealthData } from '@/types/index';

function makeHealthData(overrides: Partial<HealthData> = {}): HealthData {
  return {
    date: '2026-07-27',
    hrv: null,
    restingHeartRate: null,
    sleepDuration: null,
    deepSleep: null,
    remSleep: null,
    sleepEfficiency: null,
    stressScore: null,
    daytimeAvgHR: null,
    steps: null,
    activeCalories: null,
    exerciseMinutes: null,
    ...overrides,
  };
}

describe('calculateReadiness', () => {
  it('returns a neutral 50 when no data is available', () => {
    const result = calculateReadiness(makeHealthData());
    expect(result.score).toBe(50);
    expect(result.components).toEqual({ recovery: 50, sleep: 50, stress: 50 });
  });

  it('scores at-baseline metrics with optimal sleep near the top of the range', () => {
    // HRV and RHR exactly at baseline → recovery 50; perfect sleep → sleep ~95
    const result = calculateReadiness(
      makeHealthData({
        hrv: 55,
        restingHeartRate: 60,
        sleepDuration: 480,
        deepSleep: 96,   // 20% — optimal
        remSleep: 120,   // 25% — optimal
        sleepEfficiency: 95,
      })
    );
    expect(result.components.recovery).toBe(50);
    expect(result.components.sleep).toBeGreaterThan(85);
    expect(result.score).toBeGreaterThan(60);
    expect(result.score).toBeLessThan(80);
  });

  it('produces a high score for excellent recovery and sleep', () => {
    const result = calculateReadiness(
      makeHealthData({
        hrv: 90,               // well above baseline
        restingHeartRate: 50,  // well below baseline
        sleepDuration: 500,
        deepSleep: 110,
        remSleep: 130,
        sleepEfficiency: 95,
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it('produces a low score for poor recovery and short sleep', () => {
    const result = calculateReadiness(
      makeHealthData({
        hrv: 25,               // far below baseline
        restingHeartRate: 75,  // elevated
        sleepDuration: 240,    // 4h
        deepSleep: 20,
        remSleep: 30,
        sleepEfficiency: 60,
      })
    );
    expect(result.score).toBeLessThan(40);
  });

  it('always returns a score within 0–100, rounded to an integer', () => {
    const extremes = [
      makeHealthData({ hrv: 200, restingHeartRate: 30, sleepDuration: 900, sleepEfficiency: 100 }),
      makeHealthData({ hrv: 1, restingHeartRate: 120, sleepDuration: 30, sleepEfficiency: 10 }),
    ];
    for (const data of extremes) {
      const { score } = calculateReadiness(data);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    }
  });

  it('uses personal baselines when provided', () => {
    // HRV 40 is poor vs the population default (55), but at-baseline for this user
    const data = makeHealthData({ hrv: 40, restingHeartRate: 65, sleepDuration: 480 });
    const withDefaults = calculateReadiness(data);
    const withPersonal = calculateReadiness(data, 40, 65);
    expect(withPersonal.components.recovery).toBe(50);
    expect(withPersonal.score).toBeGreaterThan(withDefaults.score);
  });

  it('higher HRV never lowers the score (monotonicity)', () => {
    let previous = -1;
    for (const hrv of [30, 45, 55, 70, 90]) {
      const { score } = calculateReadiness(
        makeHealthData({ hrv, restingHeartRate: 60, sleepDuration: 480 })
      );
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });

  it('longer sleep never lowers the score (monotonicity)', () => {
    let previous = -1;
    for (const sleepDuration of [240, 330, 420, 480, 540]) {
      const { score } = calculateReadiness(
        makeHealthData({ hrv: 55, restingHeartRate: 60, sleepDuration })
      );
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });

  describe('sleep component weighting', () => {
    // Duration 480 → 100, deep 20% → 80, REM 25% → 80, efficiency 85% → 80.
    // Weighted 50/20/20/10 gives 90; a flat average of the same four
    // sub-scores would give 85, so this pins the weighting itself.
    it('weights duration at 50% rather than averaging the sub-scores', () => {
      const { components } = calculateReadiness(
        makeHealthData({
          sleepDuration: 480,
          deepSleep: 96,
          remSleep: 120,
          sleepEfficiency: 85,
        })
      );
      expect(components.sleep).toBe(90);
    });

    it('renormalises the weights when only duration is available', () => {
      const full = calculateReadiness(makeHealthData({ sleepDuration: 480 }));
      expect(full.components.sleep).toBe(100);

      const half = calculateReadiness(makeHealthData({ sleepDuration: 240 }));
      expect(half.components.sleep).toBe(50);
    });

    it('lets poor duration outweigh excellent sleep stages', () => {
      // 4h sleep (duration 50) with perfect stage percentages and efficiency.
      const { components } = calculateReadiness(
        makeHealthData({
          sleepDuration: 240,
          deepSleep: 48,      // 20% — on target
          remSleep: 60,       // 25% — on target
          sleepEfficiency: 85,
        })
      );
      // Weighted: 50*0.5 + 80*0.2 + 80*0.2 + 80*0.1 = 65
      expect(components.sleep).toBe(65);
    });
  });

  describe('stress component tiers', () => {
    it('tier 1: inverts the Garmin stress score', () => {
      const calm = calculateReadiness(makeHealthData({ stressScore: 10 }));
      const stressed = calculateReadiness(makeHealthData({ stressScore: 90 }));
      expect(calm.components.stress).toBe(90);
      expect(stressed.components.stress).toBe(10);
    });

    it('tier 2: falls back to HRV when no Garmin stress score', () => {
      const result = calculateReadiness(makeHealthData({ hrv: 55 }));
      expect(result.components.stress).toBe(50); // at baseline → neutral
    });

    it('tier 3: falls back to daytime HR elevation when no HRV', () => {
      const calm = calculateReadiness(
        makeHealthData({ daytimeAvgHR: 61 }), undefined, 60
      );
      const elevated = calculateReadiness(
        makeHealthData({ daytimeAvgHR: 80 }), undefined, 60
      );
      expect(calm.components.stress).toBeGreaterThan(elevated.components.stress);
      // Tier 3 is clamped to 20–90
      expect(elevated.components.stress).toBeGreaterThanOrEqual(20);
      expect(calm.components.stress).toBeLessThanOrEqual(90);
    });
  });

  describe('data quality assessment', () => {
    it('is high confidence with HRV and sleep', () => {
      const result = calculateReadiness(
        makeHealthData({ hrv: 55, sleepDuration: 480 })
      );
      expect(result.dataQuality.confidence).toBe('high');
      expect(result.dataQuality.warningMessage).toBeNull();
    });

    it('is medium confidence with only partial signals', () => {
      const sleepOnly = calculateReadiness(makeHealthData({ sleepDuration: 480 }));
      expect(sleepOnly.dataQuality.confidence).toBe('medium');
      expect(sleepOnly.dataQuality.warningMessage).toContain('no heart rate data');

      const hrOnly = calculateReadiness(makeHealthData({ hrv: 55, restingHeartRate: 60 }));
      expect(hrOnly.dataQuality.confidence).toBe('medium');
      expect(hrOnly.dataQuality.warningMessage).toContain('sleep');
    });

    it('is low confidence with no signals, listing everything missing', () => {
      const result = calculateReadiness(makeHealthData());
      expect(result.dataQuality.confidence).toBe('low');
      expect(result.dataQuality.missingSignals).toEqual([
        'HRV',
        'resting heart rate',
        'sleep',
      ]);
      expect(result.dataQuality.warningMessage).toContain('estimated');
    });
  });
});
