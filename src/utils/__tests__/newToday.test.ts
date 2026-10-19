import { pickNewToday, type NewTodayInput } from '../newToday';

const base: NewTodayInput = {
  todayScore: 64,
  unusual:    null,
  forecast:   null,
  pastScores: [55, 60, 62, 58, 70, 66, 59, 61],
  opened:     { coach: true, trend: true },
  trendShown: true,
};

describe('new today', () => {
  it('leads with an unusual reading', () => {
    const r = pickNewToday({ ...base, unusual: { metric: 'hrv', direction: 'high' }, forecast: { score: 60, low: 55, high: 66 } });
    expect(r).toEqual({ kind: 'unusual', text: "Your HRV is above your usual range today. There's a question about it below." });
  });

  it("checks yesterday's forecast against today", () => {
    expect(pickNewToday({ ...base, forecast: { score: 61, low: 56, high: 67 } })!.text)
      .toBe("Yesterday we forecast 61 for today. You're at 64, inside the range we gave.");
    expect(pickNewToday({ ...base, forecast: { score: 52, low: 47, high: 58 } })!.text).toContain('higher than we expected');
    expect(pickNewToday({ ...base, forecast: { score: 75, low: 70, high: 80 } })!.text).toContain('lower than we expected');
  });

  it('names a personal best only with a week of mornings behind it', () => {
    expect(pickNewToday({ ...base, todayScore: 74 })).toEqual({ kind: 'personal_best', text: '74 is your best morning in the last 30 days.' });
    expect(pickNewToday({ ...base, todayScore: 74, pastScores: [60, 62] })).toBeNull();
  });

  it('suggests an unopened feature, coach first', () => {
    expect(pickNewToday({ ...base, opened: { coach: false, trend: false } })!.kind).toBe('try_coach');
    expect(pickNewToday({ ...base, opened: { coach: true, trend: false } })!.kind).toBe('try_trend');
    expect(pickNewToday({ ...base, opened: { coach: true, trend: false }, trendShown: false })).toBeNull();
  });

  it('says nothing when nothing happened', () => {
    expect(pickNewToday(base)).toBeNull();
    expect(pickNewToday({ ...base, todayScore: 0, opened: { coach: false, trend: false } })).toBeNull();
  });
});
