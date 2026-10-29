import { fetchGarminDays } from '../garmin';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Each table answers with what the test put in `responses`; the chain is
// the one fetchGarminDays uses: from(table).select(...).gte(...).
const responses: Record<string, { data: unknown[] | null; error: { message: string } | null }> = {};
jest.mock('@services/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ gte: () => Promise.resolve(responses[table] ?? { data: [], error: null }) }),
    }),
  },
}));

beforeEach(() => { for (const k of Object.keys(responses)) delete responses[k]; });

describe('fetchGarminDays (1.2.1)', () => {
  it('rejects, naming the table, when any read fails instead of returning empty days', async () => {
    responses.garmin_daily = { data: [{ calendar_date: '2026-10-28', resting_hr: 50, steps: 100, active_kcal: 1, avg_stress: 20, moderate_sec: 0, vigorous_sec: 0 }], error: null };
    responses.garmin_hrv   = { data: null, error: { message: 'boom' } };
    await expect(fetchGarminDays(2)).rejects.toThrow('garmin_hrv read failed: boom');
  });

  it('maps the rows when every read succeeds', async () => {
    responses.garmin_hrv = { data: [{ calendar_date: '2026-10-28', last_night_avg: 44 }], error: null };
    const days = await fetchGarminDays(2);
    expect(days.hrv['2026-10-28']).toBe(44);
    expect(days.rhr).toEqual({});
  });
});
