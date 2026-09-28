import {
  evaluateRecovery, shouldSuggestSickTag, excludeIllnessDays,
  type IllnessEpisode,
} from '../illnessRecovery';
import { getTrainingRecommendation } from '../training';

const ep: IllnessEpisode = { startDate: '2026-09-20', source: 'tag', baseline: { rhr: 52, hrv: 60 } };

describe('evaluateRecovery', () => {
  it('stays recovering while resting HR is still up', () => {
    const rhr = { '2026-09-20': 60, '2026-09-21': 59, '2026-09-22': 56 };
    const hrv = { '2026-09-20': 40, '2026-09-21': 48, '2026-09-22': 58 };
    const r = evaluateRecovery(ep, rhr, hrv, '2026-09-22');
    expect(r.state).toBe('recovering');
    expect(r.day).toBe(3);
    expect(r.signals.find(s => s.key === 'rhr')).toMatchObject({ latest: 56, usual: 52, back: false });
    expect(r.signals.find(s => s.key === 'hrv')).toMatchObject({ latest: 58, back: true });
  });

  it('recovers after two consecutive mornings with every signal back', () => {
    const rhr = { '2026-09-21': 58, '2026-09-22': 54, '2026-09-23': 53, '2026-09-24': 52 };
    const hrv = { '2026-09-21': 45, '2026-09-22': 55, '2026-09-23': 57, '2026-09-24': 61 };
    const r = evaluateRecovery(ep, rhr, hrv, '2026-09-24');
    expect(r.state).toBe('recovered');
    expect(r.recoveredDate).toBe('2026-09-23');
  });

  it('never counts the day the user tagged Sick', () => {
    const rhr = { '2026-09-20': 52, '2026-09-21': 52 };
    const r = evaluateRecovery({ ...ep, baseline: { rhr: 52, hrv: null } }, rhr, {}, '2026-09-21');
    expect(r.backStreak).toBe(1);
    expect(r.state).toBe('recovering');
  });

  it('skips mornings with no data without breaking the streak', () => {
    const rhr = { '2026-09-21': 53, '2026-09-23': 53 };
    const r = evaluateRecovery({ ...ep, baseline: { rhr: 52, hrv: null } }, rhr, {}, '2026-09-23');
    expect(r.state).toBe('recovered');
  });

  it('works with resting heart rate only (Garmin without HRV)', () => {
    const r = evaluateRecovery({ ...ep, baseline: { rhr: 52, hrv: null } }, { '2026-09-21': 60 }, {}, '2026-09-21');
    expect(r.signals.map(s => s.key)).toEqual(['rhr']);
  });

  it('suggests a doctor after 14 days still recovering', () => {
    const r = evaluateRecovery(ep, { '2026-10-05': 60 }, {}, '2026-10-05');
    expect(r.day).toBe(16);
    expect(r.suggestDoctor).toBe(true);
  });
});

describe('shouldSuggestSickTag', () => {
  it('asks after two nights at least 5 bpm above usual', () => {
    expect(shouldSuggestSickTag({ '2026-09-27': 58, '2026-09-28': 59 }, 52, '2026-09-28'))
      .toEqual({ suggest: true, elevation: 6 });
  });
  it('does not ask after one high night', () => {
    expect(shouldSuggestSickTag({ '2026-09-27': 53, '2026-09-28': 60 }, 52, '2026-09-28').suggest).toBe(false);
  });
  it('does not ask with a missing night', () => {
    expect(shouldSuggestSickTag({ '2026-09-28': 60 }, 52, '2026-09-28').suggest).toBe(false);
  });
});

describe('excludeIllnessDays', () => {
  it('removes episode days, including an ongoing episode up to today', () => {
    const byDay = { '2026-09-18': 60, '2026-09-20': 40, '2026-09-22': 45, '2026-09-25': 58 };
    const eps: IllnessEpisode[] = [{ ...ep, recoveredDate: '2026-09-23' }];
    expect(Object.keys(excludeIllnessDays(byDay, eps, '2026-09-28'))).toEqual(['2026-09-18', '2026-09-25']);
    expect(Object.keys(excludeIllnessDays(byDay, [ep], '2026-09-28'))).toEqual(['2026-09-18']);
  });
});

describe('getTrainingRecommendation illness cap', () => {
  const comps = { recovery: 80, sleep: 80, stress: 80 };
  it('holds a high score at Easy Day and says why', () => {
    const r = getTrainingRecommendation(90, comps, { illnessCap: true });
    expect(r.headline).toBe('Easy Day');
    expect(r.rationale).toMatch(/before you were sick/);
  });
  it('leaves lower scores alone', () => {
    expect(getTrainingRecommendation(30, comps, { illnessCap: true }).headline)
      .toBe(getTrainingRecommendation(30, comps).headline);
  });
  it('changes nothing without the cap', () => {
    expect(getTrainingRecommendation(90, comps).headline).toBe('Push Hard Today');
  });
});
