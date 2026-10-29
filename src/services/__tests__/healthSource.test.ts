import { getHRVByDay, getRHRByDay, isGarminHRVUnavailable } from '../healthSource';
import { isGarminConnected, fetchGarminDays } from '../garmin';
import { fetchHRVByDay, fetchRHRByDay } from '../healthkit';

jest.mock('@services/healthkit', () => ({
  fetchHRVByDay:         jest.fn(),
  fetchRHRByDay:         jest.fn(),
  fetchSleepByDay:       jest.fn(),
  fetchYesterdayWorkouts: jest.fn(),
}));
jest.mock('@services/garmin', () => ({
  isGarminConnected:   jest.fn(),
  fetchGarminDays:     jest.fn(),
  fetchGarminWorkouts: jest.fn(),
}));

const apple = { '2026-10-28': 61 };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  (isGarminConnected as jest.Mock).mockResolvedValue(true);
  (fetchGarminDays as jest.Mock).mockRejectedValue(new Error('[Garmin] garmin_hrv read failed: boom'));
  (fetchHRVByDay as jest.Mock).mockResolvedValue(apple);
  (fetchRHRByDay as jest.Mock).mockResolvedValue(apple);
});

describe('healthSource with Garmin connected and its read failing (1.2.1)', () => {
  it('throws for the baseline instead of handing it Apple HRV, a different measure', async () => {
    const err = await getHRVByDay(30, { garminRequired: true }).catch(e => e);
    expect(isGarminHRVUnavailable(err)).toBe(true);
    expect(fetchHRVByDay).not.toHaveBeenCalled();
  });

  it('still falls back to Apple HRV for callers that only display', async () => {
    await expect(getHRVByDay(30)).resolves.toEqual(apple);
  });

  it('falls back to Apple resting heart rate, the same measure on both', async () => {
    await expect(getRHRByDay(30)).resolves.toEqual(apple);
  });

  it('does not tag other errors as Garmin unavailable', () => {
    expect(isGarminHRVUnavailable(new Error('x'))).toBe(false);
    expect(isGarminHRVUnavailable('x')).toBe(false);
  });
});
