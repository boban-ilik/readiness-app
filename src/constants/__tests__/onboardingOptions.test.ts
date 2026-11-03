import { DEVICES, DEVICE_NOTE, FREQ_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS } from '../onboarding';

describe('onboarding option tables', () => {
  it('has a DEVICES entry for every device type', () => {
    expect(DEVICES.map(d => d.key).sort()).toEqual(['apple_watch', 'both', 'garmin', 'none', 'other']);
  });

  it('only carries notes for device types that exist', () => {
    const keys = new Set(DEVICES.map(d => d.key));
    for (const k of Object.keys(DEVICE_NOTE)) {
      expect(keys.has(k as never)).toBe(true);
    }
  });

  it('has one frequency option per training-frequency value', () => {
    expect(FREQ_OPTIONS.map(o => o.key)).toEqual(['light', 'moderate', 'high']);
  });

  it('has one goal option per training-goal value', () => {
    expect(GOAL_OPTIONS.map(o => o.key)).toEqual(['performance', 'recovery', 'weight_loss', 'general_health']);
  });

  it('has one sex option per value', () => {
    expect(SEX_OPTIONS.map(o => o.key)).toEqual(['female', 'male', 'prefer_not_to_say']);
  });
});
