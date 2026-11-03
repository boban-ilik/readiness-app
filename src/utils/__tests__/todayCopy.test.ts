import { NO_DATA_COPY, buildRecoveryDetail, buildStressDetail, buildActivityDetail, buildSleepDetail } from '../todayCopy';
import type { HealthData } from '@/types/index';

function hd(overrides: Partial<HealthData> = {}): HealthData {
  return {
    date: '2026-11-03',
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

describe('buildRecoveryDetail', () => {
  it('returns undefined without health data', () => {
    expect(buildRecoveryDetail(null, 60)).toBeUndefined();
  });

  it('says HRV was not recorded when missing', () => {
    expect(buildRecoveryDetail(hd(), 60)).toContain('HRV not recorded');
  });

  it('labels a manually entered HRV', () => {
    expect(buildRecoveryDetail(hd({ hrv: 48, hrvSource: 'manual' }), 60)).toContain('HRV 48ms (manual)');
  });
});

describe('buildStressDetail', () => {
  it('prefers the device stress score', () => {
    expect(buildStressDetail(hd({ stressScore: 30 }), 60, 55)).toContain('Stress index 30/100 · Moderate');
  });

  it('falls back to the HRV proxy', () => {
    expect(buildStressDetail(hd({ hrv: 60 }), 60, 50)).toContain('Low stress');
  });

  it('falls back to daytime HR elevation', () => {
    expect(buildStressDetail(hd({ daytimeAvgHR: 80 }), 60, 55)).toContain('Daytime HR 80bpm');
  });

  it('says to sync when there is no signal at all', () => {
    expect(buildStressDetail(hd(), 60, 55)).toContain('Sync your device');
  });
});

describe('buildSleepDetail', () => {
  it('is explicit when no night was recorded', () => {
    expect(buildSleepDetail(hd())).toBe('No sleep recorded · counted as a neutral 50');
  });

  it('formats duration, stages and efficiency', () => {
    const out = buildSleepDetail(hd({ sleepDuration: 420, deepSleep: 90, remSleep: 100, sleepEfficiency: 90 }));
    expect(out).toContain('7h 0m');
    expect(out).toContain('Deep 1h 30m');
    expect(out).toContain('REM 100m');
    expect(out).toContain('90% eff');
  });
});

describe('buildActivityDetail', () => {
  it('shows yesterday plus today so far', () => {
    const out = buildActivityDetail(
      hd({ steps: 8000, exerciseMinutes: 30, activeCalories: 400 }),
      { steps: 2000, exerciseMinutes: 10, activeCalories: 100 },
    );
    expect(out).toContain('8,000 steps');
    expect(out).toContain('Today so far · 2,000 steps');
  });
});

describe('NO_DATA_COPY', () => {
  it('has copy for every reason plus the checking state', () => {
    for (const key of ['checking', 'missed_night', 'no_wearable', 'no_health_access'] as const) {
      expect(NO_DATA_COPY[key].eyebrow.length).toBeGreaterThan(0);
      expect(NO_DATA_COPY[key].body.length).toBeGreaterThan(0);
    }
  });
});
