jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCoachMemory, loadCoachMemory, removeCoachMemory, clearCoachMemory, MAX_MEMORY_ITEMS } from '../coachMemory';

beforeEach(async () => { await AsyncStorage.clear(); });

describe('coach memory', () => {
  it('adds facts and skips near-duplicates', async () => {
    expect(await addCoachMemory(['Training for a half marathon on 12 October'])).toBe(1);
    expect(await addCoachMemory(['training for a half-marathon on 12 october.', 'Has a sore left knee'])).toBe(1);
    expect((await loadCoachMemory()).map(m => m.text)).toEqual([
      'Training for a half marathon on 12 October',
      'Has a sore left knee',
    ]);
  });

  it('drops the oldest facts beyond the cap', async () => {
    for (let i = 0; i < MAX_MEMORY_ITEMS + 3; i++) await addCoachMemory([`Fact number ${i}`]);
    const items = await loadCoachMemory();
    expect(items).toHaveLength(MAX_MEMORY_ITEMS);
    expect(items[0].text).toBe('Fact number 3');
  });

  it('ignores empty input', async () => {
    expect(await addCoachMemory(['', '   '])).toBe(0);
    expect(await loadCoachMemory()).toEqual([]);
  });

  it('removes one fact and clears all', async () => {
    await addCoachMemory(['A', 'B']);
    expect((await removeCoachMemory('A')).map(m => m.text)).toEqual(['B']);
    await clearCoachMemory();
    expect(await loadCoachMemory()).toEqual([]);
  });
});
