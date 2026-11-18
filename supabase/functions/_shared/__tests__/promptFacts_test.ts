import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { formatSleep, SCORE_SCALE_RULE } from '../promptFacts.ts';

Deno.test('formatSleep: hours and minutes, never decimal hours', () => {
  assertEquals(formatSleep(346), '5h 46m');
  assertEquals(formatSleep(420), '7h 0m');
  assertEquals(formatSleep(59), '0h 59m');
  assertEquals(formatSleep(345.6), '5h 46m');
});

Deno.test('SCORE_SCALE_RULE: says the stress score is inverted', () => {
  assertEquals(SCORE_SCALE_RULE.includes('HIGH stress score means LOW stress'), true);
});
