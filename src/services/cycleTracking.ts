/**
 * Cycle Tracking Service
 *
 * Menstrual cycle phase intelligence — helps women understand why their HRV,
 * RHR, and readiness scores fluctuate across the cycle, and what to expect
 * from their body in each phase.
 *
 * ── Science basis ─────────────────────────────────────────────────────────────
 * The four cycle phases produce measurable hormonal shifts that directly affect
 * the metrics this app tracks:
 *
 *   Menstrual (days 1–N)   Prostaglandins → fatigue, cramping, HRV may dip
 *   Follicular (days N+1–13) Estrogen rising → best recovery window, HRV often peaks
 *   Ovulatory (days 14–16)  LH surge → strength peak, highest pain tolerance
 *   Luteal (days 17–end)   Progesterone → RHR +2–3 bpm, HRV slightly lower, normal
 *   Late luteal (last 6d)  PMS window — sleep disruption, mood shifts common
 *
 * ── Privacy ───────────────────────────────────────────────────────────────────
 * All cycle data is stored exclusively in AsyncStorage (on-device only).
 * Nothing is synced to any server. Data is cleared when the user signs out
 * or uninstalls the app.
 *
 * ── Storage ───────────────────────────────────────────────────────────────────
 *   @readiness/cycle_enabled           'true' | 'false'
 *   @readiness/cycle_length            '28'
 *   @readiness/cycle_period_length     '5'
 *   @readiness/cycle_entries           JSON: string[]  (ISO date strings of period starts)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CyclePhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'late_luteal';

export interface CycleSettings {
  enabled:          boolean;
  cycleLengthDays:  number;   // 21–40, default 28
  periodLengthDays: number;   // 2–8, default 5
}

export interface CycleState {
  phase:            CyclePhase;
  dayOfCycle:       number;
  /** Estimated days until next period (0 = today or overdue) */
  daysUntilNext:    number;
  /** Estimated date of next period start */
  nextPeriodDate:   Date;
  /** 0.0–1.0 progress through current cycle */
  cycleProgress:    number;
}

export interface PhaseInfo {
  name:          string;
  emoji:         string;
  color:         string;
  colorDim:      string;   // same color at ~15% opacity for backgrounds
  /** One-line readiness context surfaced on the home screen */
  readinessNote: string;
  /** What to expect from HRV/RHR/sleep this phase */
  metricsNote:   string;
  /** Concise training advice for this phase */
  trainingAdvice: string;
  /** Brief description of what's happening hormonally */
  phaseDesc:     string;
}

// ─── AsyncStorage keys ────────────────────────────────────────────────────────

export const CYCLE_ENABLED_KEY      = '@readiness/cycle_enabled';
export const CYCLE_LENGTH_KEY       = '@readiness/cycle_length';
export const CYCLE_PERIOD_KEY       = '@readiness/cycle_period_length';
export const CYCLE_ENTRIES_KEY      = '@readiness/cycle_entries';

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  enabled:          false,
  cycleLengthDays:  28,
  periodLengthDays: 5,
};

// ─── Phase metadata ───────────────────────────────────────────────────────────

const PHASE_INFO: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    name:          'Menstrual',
    emoji:         '🌑',
    color:         '#F87171',
    colorDim:      'rgba(248,113,113,0.15)',
    readinessNote: 'Menstrual phase — some fatigue is normal. Your score may read slightly lower, and that\'s expected.',
    metricsNote:   'HRV can dip and RHR may be slightly elevated during menstruation. Both are temporary and return to baseline after your period.',
    trainingAdvice: 'Listen to your body. Light movement, swimming, or yoga often feel best. If symptoms are mild, easy cardio is fine.',
    phaseDesc:     'Estrogen and progesterone are at their lowest. Your body is resetting — rest is productive.',
  },
  follicular: {
    name:          'Follicular',
    emoji:         '🌱',
    color:         '#34D399',
    colorDim:      'rgba(52,211,153,0.15)',
    readinessNote: 'Follicular phase — estrogen is rising. This is often your best energy and recovery window.',
    metricsNote:   'HRV tends to be higher and RHR lower in the follicular phase. Your scores may trend upward naturally.',
    trainingAdvice: 'Great time to build intensity. Your body handles stress and recovers well now. Good window for strength work and hard sessions.',
    phaseDesc:     'Estrogen is rising, energy lifts, and your body is highly responsive to training.',
  },
  ovulatory: {
    name:          'Ovulatory',
    emoji:         '✨',
    color:         '#FBBF24',
    colorDim:      'rgba(251,191,36,0.15)',
    readinessNote: 'Ovulatory phase — this is your peak performance window. Strength and endurance are at their best.',
    metricsNote:   'HRV is typically at its highest point in the cycle. Your body is primed for output.',
    trainingAdvice: 'Optimal window for PR attempts, hard intervals, or competition. High pain tolerance and coordination peak here.',
    phaseDesc:     'LH surge drives ovulation. Strength, coordination, and pain tolerance peak for a brief window.',
  },
  luteal: {
    name:          'Luteal',
    emoji:         '🌕',
    color:         '#A78BFA',
    colorDim:      'rgba(167,139,250,0.15)',
    readinessNote: 'Luteal phase — slightly lower HRV and elevated RHR are completely normal now. Don\'t be alarmed by a lower score.',
    metricsNote:   'Progesterone raises body temperature slightly, which elevates RHR by 2–3 bpm and reduces HRV. This is normal hormonal physiology, not a sign of poor health.',
    trainingAdvice: 'Moderate training works well. Maintain your routine but avoid pushing for personal records — save those for the follicular phase.',
    phaseDesc:     'Progesterone is dominant, slightly raising resting heart rate and body temperature.',
  },
  late_luteal: {
    name:          'Late Luteal',
    emoji:         '🌖',
    color:         '#C084FC',
    colorDim:      'rgba(192,132,252,0.15)',
    readinessNote: 'Late luteal phase — PMS symptoms may affect sleep and energy. Your score may dip; this is expected and temporary.',
    metricsNote:   'Sleep disruption is most common now. If your HRV is low and sleep score is down, hormonal shifts are likely contributing.',
    trainingAdvice: 'Prioritise recovery — light cardio, mobility, yoga. Save harder sessions for after your period. Extra sleep pays off here.',
    phaseDesc:     'Progesterone peaks then drops. PMS symptoms peak here before the cycle resets.',
  },
};

export function getPhaseInfo(phase: CyclePhase): PhaseInfo {
  return PHASE_INFO[phase];
}

// ─── Phase calculation ────────────────────────────────────────────────────────

/**
 * Calculate current cycle state from the most recent period start date.
 * Returns null if no period start date is known.
 */
export function computeCycleState(
  lastPeriodStart: string,    // ISO date string
  settings: CycleSettings,
): CycleState {
  const start  = new Date(lastPeriodStart);
  const today  = new Date();

  // Strip time — work with calendar days only
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const daysSinceStart = Math.floor((todayDay - startDay) / 86_400_000);

  // Wrap: cycle day 1 = period start day
  const dayOfCycle = (daysSinceStart % settings.cycleLengthDays) + 1;

  // Days until next period
  const daysUntilNext = settings.cycleLengthDays - dayOfCycle;
  const nextPeriodDate = new Date(today);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNext);

  const cycleProgress = dayOfCycle / settings.cycleLengthDays;

  // Phase boundaries
  const { periodLengthDays, cycleLengthDays } = settings;
  const lateLutealStart = cycleLengthDays - 5;  // last ~6 days = late luteal / PMS window

  let phase: CyclePhase;
  if (dayOfCycle <= periodLengthDays) {
    phase = 'menstrual';
  } else if (dayOfCycle <= 13) {
    phase = 'follicular';
  } else if (dayOfCycle <= 16) {
    phase = 'ovulatory';
  } else if (dayOfCycle >= lateLutealStart) {
    phase = 'late_luteal';
  } else {
    phase = 'luteal';
  }

  return { phase, dayOfCycle, daysUntilNext, nextPeriodDate, cycleProgress };
}

// ─── Entry helpers ────────────────────────────────────────────────────────────

/** Parse the JSON-serialised entries array from AsyncStorage. */
export function parseEntries(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

/** Returns the most recent period start date, or null. */
export function latestEntry(entries: string[]): string | null {
  if (entries.length === 0) return null;
  return [...entries].sort().at(-1) ?? null;
}

/** Add today as a new period start. Returns updated entries array. */
export function logPeriodStart(entries: string[]): string[] {
  const today = new Date().toISOString().split('T')[0];
  const filtered = entries.filter(e => e !== today);
  return [...filtered, today].sort();
}

/**
 * Short display label for the next period estimate.
 * e.g. "in 3 days", "tomorrow", "today", "1 day overdue"
 */
export function nextPeriodLabel(daysUntilNext: number): string {
  if (daysUntilNext < 0)  return `${Math.abs(daysUntilNext)}d overdue`;
  if (daysUntilNext === 0) return 'Due today';
  if (daysUntilNext === 1) return 'Tomorrow';
  if (daysUntilNext <= 7)  return `In ${daysUntilNext} days`;
  if (daysUntilNext <= 14) return `In ${Math.round(daysUntilNext / 7)} week`;
  return `In ${daysUntilNext} days`;
}
