import { trainingHeadline, trainingCallLine, baselineNote } from '../../../supabase/functions/_shared/coaching';
import { waterLines, WATER_RULE } from '../../../supabase/functions/_shared/water';
import { getTrainingRecommendation } from '../training';

const comps = { recovery: 70, sleep: 70, stress: 70 };

describe('server training call matches the app', () => {
  it('gives the same headline as Today for every score', () => {
    for (let score = 0; score <= 100; score++) {
      expect(trainingHeadline(score, false).headline).toBe(getTrainingRecommendation(score, comps).headline);
      expect(trainingHeadline(score, true).headline).toBe(getTrainingRecommendation(score, comps, { illnessCap: true }).headline);
    }
  });
  it('tells the model what Today shows', () => {
    expect(trainingCallLine(82, false)).toMatch(/"Strong Workout Day"/);
    expect(trainingCallLine(82, true)).toMatch(/"Easy Day"/);
  });
});

describe('baseline wording for the model', () => {
  it('does not call the stand-in a personal baseline', () => {
    expect(baselineNote('hrv', 55)).toMatch(/typical 55 ms/);
    expect(baselineNote('hrv', 55)).toMatch(/do not call it their baseline/);
    expect(baselineNote('rhr', 52)).toBe('personal baseline: 52 bpm');
  });
});

describe('water for the model', () => {
  it('says nothing logged is not the same as nothing drunk', () => {
    const text = waterLines({ todayLitres: 0, targetLitres: 3, localHour: 12 }).join(' ');
    expect(text).toMatch(/nothing logged yet/);
    expect(text).toMatch(/not that the user has had nothing to drink/);
    expect(WATER_RULE).toMatch(/never call the user dehydrated or under-hydrated/);
  });
});
