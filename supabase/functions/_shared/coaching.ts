/**
 * Facts the coach and the briefing must stay consistent with (1.0.5).
 *
 * Found on device: the briefing told the user to do a "conversational-pace
 * session" while Today's own card said "Strong Workout Day", and the coach
 * called the 55 ms stand-in "your baseline" while the app calls it typical.
 */

// Mirrors TIERS in src/utils/training.ts. A unit test keeps the two in step.
const TRAINING_TIERS: Array<{ min: number; headline: string; feel: string }> = [
  { min: 86, headline: 'Push Hard Today',       feel: 'very hard efforts, 60 to 90 min' },
  { min: 71, headline: 'Strong Workout Day',    feel: 'comfortably hard, 60 to 75 min' },
  { min: 56, headline: 'Steady Training Day',   feel: 'steady, somewhat hard, 50 to 70 min' },
  { min: 41, headline: 'Easy Day',              feel: 'easy, conversational, 40 to 60 min' },
  { min: 26, headline: 'Light Movement Only',   feel: 'very easy movement, 20 to 35 min' },
  { min: 0,  headline: 'Rest Today',            feel: 'rest' },
];
const EASY_DAY_MAX_SCORE = 55;

export function trainingHeadline(score: number, recoveringFromIllness: boolean): { headline: string; feel: string } {
  const s = recoveringFromIllness ? Math.min(score, EASY_DAY_MAX_SCORE) : score;
  return TRAINING_TIERS.find(t => s >= t.min) ?? TRAINING_TIERS[TRAINING_TIERS.length - 1];
}

/** The line that tells the model what the app itself recommends today. */
export function trainingCallLine(score: number, recoveringFromIllness: boolean): string {
  const t = trainingHeadline(score, recoveringFromIllness);
  return `The app's own training recommendation, shown on the user's Today screen: "${t.headline}" (${t.feel}).`;
}

export const TRAINING_RULE =
  'Your training advice must agree with the app\'s own training recommendation given in the context. If the data makes you want to advise less than it does, say so openly and give the reason, rather than quietly suggesting something easier.';

const STAND_IN = { hrv: 55, rhr: 60 };

/** "personal baseline: 62 ms" or a note that the number is only a typical stand-in. */
export function baselineNote(kind: 'hrv' | 'rhr', value: number): string {
  const unit = kind === 'hrv' ? 'ms' : 'bpm';
  return value === STAND_IN[kind]
    ? `compared with a typical ${value} ${unit}, a stand-in until the user has 7 days of data: do not call it their baseline`
    : `personal baseline: ${value} ${unit}`;
}
