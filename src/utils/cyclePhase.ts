/** Pure cycle-phase rules, kept free of storage so tests and the score engine can import them. */

export type CyclePhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'late_luteal';

/**
 * Phase for a given cycle day (1-based). Shared by today's cycle card and the
 * phase baselines, so both put the same day in the same phase.
 */
export function phaseForDay(dayOfCycle: number, cycleLengthDays: number, periodLengthDays: number): CyclePhase {
  const lateLutealStart = cycleLengthDays - 5;  // last ~6 days = late luteal / PMS window
  if (dayOfCycle <= periodLengthDays) return 'menstrual';
  if (dayOfCycle <= 13)               return 'follicular';
  if (dayOfCycle <= 16)               return 'ovulatory';
  if (dayOfCycle >= lateLutealStart)  return 'late_luteal';
  return 'luteal';
}

/**
 * Union of manually logged period starts and starts read from Apple Health.
 * Two starts within MERGE_WINDOW_DAYS of each other are the same period
 * logged twice (for example by hand and by a cycle app); the earlier one wins.
 */
const MERGE_WINDOW_DAYS = 3;

export function mergePeriodStarts(...lists: string[][]): string[] {
  const toDay = (d: string) => {
    const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, dd) / 86_400_000);
  };
  const all = [...new Set(lists.flat().map(d => d.slice(0, 10)))]
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  const out: string[] = [];
  for (const d of all) {
    const prev = out[out.length - 1];
    if (prev && toDay(d) - toDay(prev) <= MERGE_WINDOW_DAYS) continue;
    out.push(d);
  }
  return out;
}
