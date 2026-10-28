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

  return {
    duration:   Math.round(asleep),
    deep:       hasStages ? Math.round(deep) : null,
    rem:        hasStages ? Math.round(rem)  : null,
    efficiency: inBed > 0 ? Math.round((asleep / inBed) * 100) : null,
  };
}
