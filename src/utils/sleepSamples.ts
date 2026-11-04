/**
 * Sleep-stage summarising shared by today's score and History.
 *
 * A watch that records no stages (only "asleep") reports deep and REM as
 * null, not 0, and efficiency is null when nothing wrote "in bed" time. The
 * sleep score renormalises its weights over the parts that were measured, so
 * an unstaged 7-hour night scores on duration alone (100) instead of being
 * marked down for stages the device never measured. Before 1.0.3 these came
 * back as 0 / 0 / 85 and such a night capped at 58.
 */

export interface SleepSampleLike {
  startDate: string;
  endDate:   string;
  value:     string;
}

export interface SleepSummary {
  duration:   number;         // total asleep minutes
  deep:       number | null;  // null when the device records no stages
  rem:        number | null;  // null when the device records no stages
  efficiency: number | null;  // null when no in-bed time was recorded
  /** Earliest start and latest end of the session's samples (ISO), used to
   *  keep HRV readings to the time actually asleep. */
  start?:     string;
  end?:       string;
}

const SESSION_GAP_MS = 4 * 60 * 60 * 1000; // a gap over 4 h starts a new session
/** Sessions ending at or after this local hour are naps, not the night's sleep. */
export const NAP_END_HOUR = 14;

/**
 * Split sleep samples into sessions: sorted by start, a new session begins
 * after a gap of more than 4 hours. A night's stage samples stay together
 * even when some of them end before midnight.
 */
export function splitSleepSessions<T extends SleepSampleLike>(samples: T[]): T[][] {
  const sorted = [...samples].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const sessions: T[][] = [];
  let current: T[] = [];
  let currentEnd = 0;
  for (const s of sorted) {
    const start = new Date(s.startDate).getTime();
    const end   = new Date(s.endDate).getTime();
    if (current.length > 0 && start - currentEnd > SESSION_GAP_MS) {
      sessions.push(current);
      current = [];
      currentEnd = 0;
    }
    current.push(s);
    currentEnd = Math.max(currentEnd, end);
  }
  if (current.length > 0) sessions.push(current);
  return sessions;
}

function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * One sleep summary per wake-up date (local), from whole sessions. Sessions
 * that end at or after 14:00 are naps and skipped. If two sessions end on the
 * same date, the longer one is the night.
 *
 * Before 1.0.4 History grouped individual samples by their own end date and
 * dropped every sample ending after 14:00, which split a night at midnight
 * and lost the stages recorded before it.
 */
export function sleepByDay(samples: SleepSampleLike[], minAsleepMinutes = 60): Record<string, SleepSummary> {
  const out: Record<string, SleepSummary> = {};
  for (const session of splitSleepSessions(samples)) {
    const summary = summariseSleepSamples(session, minAsleepMinutes);
    if (!summary?.end) continue;
    const end = new Date(summary.end);
    if (end.getHours() >= NAP_END_HOUR) continue;
    const key = localDay(end);
    if (!out[key] || summary.duration > out[key].duration) out[key] = summary;
  }
  return out;
}

/**
 * Last night's sleep for the local date of `now`, by the same rule History
 * uses (sleepByDay): the session that ended today before 14:00, the longer
 * one if two did. Null when no session ended today, so the score treats
 * sleep as not measured instead of reusing an older night.
 *
 * Before 1.2.1 Today took the last session in its 48-hour window, so an
 * afternoon nap replaced the night and a night that never synced fell back
 * to the one before it.
 */
export function todaysSleep(samples: SleepSampleLike[], now: Date, minAsleepMinutes = 60): SleepSummary | null {
  return sleepByDay(samples, minAsleepMinutes)[localDay(now)] ?? null;
}

const STAGE_VALUES = ['CORE', 'DEEP', 'REM', 'ASLEEP_CORE', 'ASLEEP_DEEP', 'ASLEEP_REM'];

export function summariseSleepSamples(
  samples: SleepSampleLike[],
  minAsleepMinutes = 1,
): SleepSummary | null {
  // Garmin writes a generic ASLEEP sample and CORE/DEEP/REM for the same
  // period; count the generic one only when no stages exist.
  const hasStages = samples.some(s => STAGE_VALUES.includes(s.value));

  let asleep = 0, deep = 0, rem = 0, inBed = 0;
  for (const s of samples) {
    const mins = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
    switch (s.value) {
      case 'INBED':
        inBed += mins; break;
      case 'ASLEEP':
      case 'ASLEEP_UNSPECIFIED':
        if (!hasStages) asleep += mins;
        break;
      case 'ASLEEP_CORE':
      case 'CORE':
        asleep += mins; break;
      case 'ASLEEP_DEEP':
      case 'DEEP':
        deep += mins; asleep += mins; break;
      case 'ASLEEP_REM':
      case 'REM':
        rem += mins; asleep += mins; break;
      // AWAKE during the night is intentionally ignored
    }
  }

  if (asleep < minAsleepMinutes || asleep === 0) return null;

  // Session bounds from the samples that describe sleep itself (not AWAKE).
  const asleepish = samples.filter(x => x.value !== 'AWAKE' && x.value !== 'ASLEEP_AWAKE');
  const starts = asleepish.map(x => new Date(x.startDate).getTime()).filter(Number.isFinite);
  const ends   = asleepish.map(x => new Date(x.endDate).getTime()).filter(Number.isFinite);

  return {
    duration:   Math.round(asleep),
    deep:       hasStages ? Math.round(deep) : null,
    rem:        hasStages ? Math.round(rem)  : null,
    efficiency: inBed > 0 ? Math.round((asleep / inBed) * 100) : null,
    ...(starts.length && ends.length
      ? { start: new Date(Math.min(...starts)).toISOString(), end: new Date(Math.max(...ends)).toISOString() }
      : {}),
  };
}
