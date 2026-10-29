import AsyncStorage from '@react-native-async-storage/async-storage';
import { canUseFreeBriefing, markFreeBriefingUsed, chargesFreeBriefing } from '../freeBriefing';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => { await AsyncStorage.clear(); });

describe('free weekly briefing is charged only on delivery (1.2.1)', () => {
  it('charges a free user for a briefing written now', () => {
    expect(chargesFreeBriefing({ isPro: false, fresh: true })).toBe(true);
  });

  it("does not charge for today's cached briefing or for a Pro user", () => {
    expect(chargesFreeBriefing({ isPro: false, fresh: false })).toBe(false);
    expect(chargesFreeBriefing({ isPro: true, fresh: true })).toBe(false);
  });

  it('keeps the free briefing available until it is marked used', async () => {
    expect(await canUseFreeBriefing()).toBe(true);
    await markFreeBriefingUsed();
    expect(await canUseFreeBriefing()).toBe(false);
  });
});
