/**
 * Back from illness: pure rules (no storage, no HealthKit).
 *
 * Levi et al., The Lancet Digital Health, 2026-02-06 (4,795 people): after
 * COVID-19, influenza and strep, smartwatch-measured heart rate and HRV
 * returned to baseline days after symptoms did (about 7 extra days after mild
 * COVID, 2.5 after mild flu), while steps went straight back to normal. People
 * resume activity before their body has recovered. This module tracks the
 * body's return, against the user's own pre-illness numbers.
 *
 * Every threshold is the app's convention, shown to the user, and matches the
 * bands the breakdown copy already calls "typical": resting HR within 2 bpm of
 * usual, HRV within 5 ms of usual.
 */

export const RHR_BACK_MARGIN_BPM   = 2;   // RHR <= usual + 2 counts as back
export const HRV_BACK_MARGIN_MS    = 5;   // HRV >= usual - 5 counts as back
export const BACK_DAYS_REQUIRED    = 2;   // consecutive mornings with every signal back
export const DOCTOR_AFTER_DAYS     = 14;  // suggest a clinician if still not back
export const NUDGE_RHR_ELEVATION   = 5;   // bpm above usual that prompts "feeling unwell?"
export const NUDGE_NIGHTS_REQUIRED = 2;   // consecutive nights at that elevation

export interface IllnessEpisode {
  /** Local date the user tagged Sick (YYYY-MM-DD) */
  startDate: string;
  source:    'tag' | 'nudge';
  /** The user's usual values when they tagged Sick, so the illness itself can't move the target */
  baseline:  { rhr: number | null; hrv: number | null };
  /** Set when every signal has been back for BACK_DAYS_REQUIRED mornings */
  recoveredDate?: string;
  /** Set when the user ended tracking themselves ("I'm better") */
  endedDate?: string;
}

export interface SignalStatus {
  key:      'rhr' | 'hrv';
  label:    string;
  /** Latest value in the episode, or null when the watch recorded none */
  latest:   number | null;
  usual:    number;
  back:     boolean;
}

export interface RecoveryStatus {
  state:        'recovering' | 'recovered';
  /** 1 on the day the user tagged Sick */
  day:          number;
  signals:      SignalStatus[];
  /** Consecutive most recent mornings with every recorded signal back */
  backStreak:   number;
  recoveredDate: string | null;
  suggestDoctor: boolean;
}

function dayNum(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function dateFromNum(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

function rhrBack(v: number, usual: number): boolean { return v <= usual + RHR_BACK_MARGIN_BPM; }
function hrvBack(v: number, usual: number): boolean { return v >= usual - HRV_BACK_MARGIN_MS; }

/**
 * Where the user is in their recovery. A morning counts as "back" when every
 * signal recorded that morning is inside its band and at least one signal was
 * recorded. Mornings with no data neither count nor break the streak. The day
 * of tagging never counts: recovery starts the day after.
 */
export function evaluateRecovery(
  ep: IllnessEpisode,
  rhrByDay: Record<string, number>,
  hrvByDay: Record<string, number>,
  today: string,
): RecoveryStatus {
  const start = dayNum(ep.startDate);
  const end   = dayNum(today);
  const usual = ep.baseline;

  let streak = 0;
  let recoveredDate: string | null = ep.recoveredDate ?? null;
  let latestRhr: number | null = null;
  let latestHrv: number | null = null;

  for (let n = start; n <= end; n++) {
    const date = dateFromNum(n);
    const rhr = rhrByDay[date];
    const hrv = hrvByDay[date];
    if (typeof rhr === 'number') latestRhr = rhr;
    if (typeof hrv === 'number') latestHrv = hrv;
    if (n === start) continue;

    const checks: boolean[] = [];
    if (typeof rhr === 'number' && usual.rhr != null) checks.push(rhrBack(rhr, usual.rhr));
    if (typeof hrv === 'number' && usual.hrv != null) checks.push(hrvBack(hrv, usual.hrv));
    if (checks.length === 0) continue;            // no data that morning

    if (checks.every(Boolean)) {
      streak++;
      if (!recoveredDate && streak >= BACK_DAYS_REQUIRED) recoveredDate = date;
    } else {
      streak = 0;
    }
  }

  const signals: SignalStatus[] = [];
  if (usual.rhr != null) {
    signals.push({ key: 'rhr', label: 'Resting heart rate', latest: latestRhr, usual: usual.rhr,
                   back: latestRhr != null && rhrBack(latestRhr, usual.rhr) });
  }
  if (usual.hrv != null) {
    signals.push({ key: 'hrv', label: 'HRV', latest: latestHrv, usual: usual.hrv,
                   back: latestHrv != null && hrvBack(latestHrv, usual.hrv) });
  }

  const day = end - start + 1;
  const state = recoveredDate ? 'recovered' : 'recovering';
  return {
    state,
    day,
    signals,
    backStreak: streak,
    recoveredDate,
    suggestDoctor: state === 'recovering' && day > DOCTOR_AFTER_DAYS,
  };
}

/**
 * "Feeling unwell?" prompt: resting HR at least NUDGE_RHR_ELEVATION above the
 * user's usual on each of the last NUDGE_NIGHTS_REQUIRED nights (ending
 * today). Travel, alcohol and hard training can do the same, so the prompt only
 * ever asks; it never says the user is ill.
 */
export function shouldSuggestSickTag(
  rhrByDay: Record<string, number>,
  usualRhr: number,
  today: string,
): { suggest: boolean; elevation: number | null } {
  if (!(usualRhr > 0)) return { suggest: false, elevation: null };
  const end = dayNum(today);
  let minElevation = Infinity;
  for (let i = 0; i < NUDGE_NIGHTS_REQUIRED; i++) {
    const v = rhrByDay[dateFromNum(end - i)];
    if (typeof v !== 'number') return { suggest: false, elevation: null };
    minElevation = Math.min(minElevation, v - usualRhr);
  }
  return { suggest: minElevation >= NUDGE_RHR_ELEVATION, elevation: Math.round(minElevation) };
}

/**
 * Drop days that fall inside an illness episode, so being sick never drags the
 * user's normal baseline down (or up, for resting HR). Ongoing episodes run to
 * `today`.
 */
export function excludeIllnessDays<T>(
  byDay: Record<string, T>,
  episodes: IllnessEpisode[],
  today: string,
): Record<string, T> {
  if (episodes.length === 0) return byDay;
  const ranges = episodes.map(e => [
    dayNum(e.startDate),
    dayNum(e.recoveredDate ?? e.endedDate ?? today),
  ] as const);
  const out: Record<string, T> = {};
  for (const [date, v] of Object.entries(byDay)) {
    const n = dayNum(date);
    if (!ranges.some(([a, b]) => n >= a && n <= b)) out[date] = v;
  }
  return out;
}
