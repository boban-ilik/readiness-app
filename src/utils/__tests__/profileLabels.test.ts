import { freqLabel, sexLabel, goalLabel, formatJoinedDate } from '../profileLabels';

describe('profile label helpers', () => {
  it('renders each training frequency', () => {
    expect(freqLabel('light')).toContain('2–3 days');
    expect(freqLabel('moderate')).toContain('4–5 days');
    expect(freqLabel('high')).toContain('6+ days');
  });

  it('renders each sex option', () => {
    expect(sexLabel('male')).toBe('Male');
    expect(sexLabel('female')).toBe('Female');
    expect(sexLabel('prefer_not_to_say')).toBe('Prefer not to say');
  });

  it('renders each goal', () => {
    expect(goalLabel('performance')).toContain('Peak performance');
    expect(goalLabel('weight_loss')).toContain('Lose weight');
  });

  it('formats the joined month and year', () => {
    expect(formatJoinedDate('2026-03-09T12:00:00Z')).toBe('March 2026');
  });
});
