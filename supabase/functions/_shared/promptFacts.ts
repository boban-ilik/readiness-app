/**
 * Facts every AI function states the same way, so the model cannot misread
 * the numbers it is given.
 */

/**
 * Sleep as "5h 46m". Sent as decimal hours ("5.8 hours") the model read the
 * fraction as minutes and wrote "five hours fifty-eight minutes" for a night
 * of 5h 46m.
 */
export function formatSleep(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

/**
 * How to read the scores. Without it the weekly report called a stress score
 * of 74 a "spike to 74% stress": the stress score is inverted (high = calm).
 */
export const SCORE_SCALE_RULE =
  'Every score (overall, recovery, sleep, stress) runs from 0 to 100 and higher is always better. ' +
  'The stress score is inverted: a HIGH stress score means LOW stress (calm), and a LOW stress score means high stress. ' +
  'Never describe a high stress score as a spike, as elevated stress or as a stressful day. ' +
  'The stress index, when given, runs the other way: a higher index means more stress. ' +
  'Scores are points out of 100, not percentages: never write them with a % sign.';
