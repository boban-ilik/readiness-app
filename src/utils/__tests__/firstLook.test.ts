import { buildFirstLook, formatSleep, type FirstLookDay } from '../firstLook';

const day = (n: number, over: Partial<FirstLookDay> = {}): FirstLookDay => ({
  date: `2026-10-${String(n).padStart(2, '0')}`,
  score: 60, hrv: 55, rhr: 54, sleepMinutes: 420,
  ...over,
});

// Ten ordinary days, one great night and one rough one, then today (the 13th)
const history: FirstLookDay[] = [
  ...Array.from({ length: 10 }, (_, i) => day(i + 1, { score: 58 + (i % 5), hrv: 52 + (i % 6), rhr: 53 + (i % 3) })),
  day(11, { score: 84, hrv: 68, rhr: 51, sleepMinutes: 460 }),
  day(12, { score: 41, hrv: 40, rhr: 60, sleepMinutes: 310 }),
  day(13, { score: 99 }),  // today: must not count as a past day
];

describe('first look', () => {
  it('needs 7 nights of heart data before today', () => {
    const few = Array.from({ length: 6 }, (_, i) => day(i + 1));
    expect(buildFirstLook(few, '2026-10-13', 60)).toBeNull();
    const noHeart = Array.from({ length: 10 }, (_, i) => day(i + 1, { hrv: null, rhr: null }));
    expect(buildFirstLook(noHeart, '2026-10-13', 60)).toBeNull();
  });

  it('leaves today out of the past days', () => {
    const look = buildFirstLook(history, '2026-10-13', 62)!;
    expect(look.nights).toBe(12);
    expect(look.best!.score).toBe(84);
  });

  it('describes the best and toughest mornings from that night', () => {
    const look = buildFirstLook(history, '2026-10-13', 62)!;
    expect(look.best).toMatchObject({ date: '2026-10-11', notes: expect.arrayContaining(['slept 7 h 40 m', 'HRV +14 ms']) });
    expect(look.toughest).toMatchObject({ date: '2026-10-12', score: 41 });
    expect(look.toughest!.notes).toEqual(['slept 5 h 10 m', 'resting heart rate +6', 'HRV -14 ms']);
  });

  it('skips best and toughest when the days are all alike', () => {
    const flat = Array.from({ length: 10 }, (_, i) => day(i + 1, { score: 60 + (i % 3) }));
    const look = buildFirstLook(flat, '2026-10-13', 60)!;
    expect(look.best).toBeNull();
    expect(look.toughest).toBeNull();
  });

  it('counts short nights and averages sleep', () => {
    const look = buildFirstLook(history, '2026-10-13', 62)!;
    expect(look.sleep).toMatchObject({ nights: 12, shortNights: 1 });
  });

  it("places today's score against the usual range", () => {
    expect(buildFirstLook(history, '2026-10-13', 61)!.today).toEqual({ score: 61, position: 'inside' });
    expect(buildFirstLook(history, '2026-10-13', 30)!.today!.position).toBe('below');
    expect(buildFirstLook(history, '2026-10-13', null)!.today).toBeNull();
  });

  it('formats sleep', () => {
    expect(formatSleep(460)).toBe('7 h 40 m');
    expect(formatSleep(420)).toBe('7 h');
  });
});
