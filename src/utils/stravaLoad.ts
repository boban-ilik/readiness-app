/**
 * Strava Training Load Analytics
 *
 * Computes a 4-week Acute:Chronic load ratio (ATL/CTL) from Strava activities.
 *
 * ── Load metric ───────────────────────────────────────────────────────────────
 * We prefer Strava's `suffer_score` (their normalised Training Load Points)
 * when available. For activities without it we fall back to "effective minutes":
 *   effective_mins = moving_time_mins × sport_intensity_multiplier
 *
 * Sport intensity multipliers mirror the HealthKit workoutLoad.ts logic so the
 * two data sources stay consistent.
 *
 * ── ATL / CTL / ratio ────────────────────────────────────────────────────────
 * ATL (Acute Training Load)   = this week's load (ISO week containing today)
 * CTL (Chronic Training Load) = rolling 4-week average weekly load
 * A:C ratio                   = ATL / CTL — the core overreaching signal:
 *
 *   < 0.70  → Deloading       (significantly below normal)
 *   0.70–0.89 → Easy week     (taper / active recovery)
 *   0.90–1.10 → Maintaining   (steady state)
 *   1.11–1.30 → Building      (productive ramp)
 *   > 1.30  → Overreaching risk (too much, too fast)
 *
 * ── ISO week convention ──────────────────────────────────────────────────────
 * "This week" = the ISO week (Mon–Sun) that contains today.
 * Weeks are keyed as "YYYY-Www" e.g. "2025-W12".
 */

import type { StravaActivity } from '@services/strava';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrendLabel =
  | 'overreaching'  // A:C > 1.30
  | 'building'      // A:C 1.11–1.30
  | 'maintaining'   // A:C 0.90–1.10
  | 'easy_week'     // A:C 0.70–0.89
  | 'deloading';    // A:C < 0.70

export interface WeeklyLoad {
  /** ISO week key, e.g. "2025-W12" */
  weekKey:       string;
  /** Human label: "This week", "Last week", "2w ago", "3w ago" */
  label:         string;
  /** Total load for the week (suffer_score pts or effective minutes) */
  load:          number;
  /** Whether load came from suffer_score (true) or effective minutes (false) */
  usedSufferScore: boolean;
  /** Number of training sessions */
  sessionCount:  number;
  /** Total moving time in minutes */
  movingMinutes: number;
  /** Sport breakdown: sport_type → session count */
  sports:        Record<string, number>;
}

export interface TrainingTrend {
  /** Load for each of the last 4 weeks, oldest first */
  weeks:          WeeklyLoad[];
  /** This week's load (ATL) */
  atl:            number;
  /** 4-week average weekly load (CTL) */
  ctl:            number;
  /** atl / ctl; null when CTL === 0 (no data at all) */
  acRatio:        number | null;
  trend:          TrendLabel;
  /** Human-readable trend label */
  trendDisplay:   string;
  /** Emoji that matches the trend */
  trendEmoji:     string;
  /** Accent color for the trend badge */
  trendColor:     string;
  /** One-line coaching insight */
  insight:        string;
  /** Top 3 sport types by session count across all 4 weeks */
  topSports:      Array<{ sport: string; count: number; pct: number }>;
  /** Total sessions in the 4-week window */
  totalSessions:  number;
  /** Total moving minutes in the 4-week window */
  totalMinutes:   number;
  /** Whether any activities had suffer_score data */
  hasSufferScore: boolean;
}

// ─── Sport intensity multipliers (consistent with workoutLoad.ts) ─────────────

const SPORT_MULTIPLIER: Record<string, number> = {
  // High intensity
  run:          1.1,
  trail_run:    1.2,
  race:         1.3,
  virtualrun:   1.1,
  ride:         1.0,
  virtualride:  1.0,
  mountainbike: 1.15,
  gravel_ride:  1.1,
  swim:         1.0,
  open_water_swim: 1.1,
  rowing:       1.0,
  kayaking:     0.8,
  crossfit:     1.3,
  weight_training: 1.2,
  workout:      1.1,
  hiit:         1.3,
  // Moderate
  hike:         0.8,
  walk:         0.5,
  // Low
  yoga:         0.4,
  pilates:      0.45,
  stretching:   0.3,
  meditation:   0.2,
};

function getSportMultiplier(sportType: string): number {
  const key = sportType.toLowerCase().replace(/\s+/g, '_');
  return SPORT_MULTIPLIER[key] ?? 0.9;  // default: assume moderate effort
}

// ─── Load calculation ─────────────────────────────────────────────────────────

/**
 * Compute a single numeric load value for one activity.
 * Prefer suffer_score; fall back to effective minutes.
 */
function activityLoad(a: StravaActivity): { load: number; usedSufferScore: boolean } {
  if (a.suffer_score != null && a.suffer_score > 0) {
    return { load: a.suffer_score, usedSufferScore: true };
  }
  const movingMins = (a.moving_time ?? a.elapsed_time ?? 0) / 60;
  const mult       = getSportMultiplier(a.sport_type);
  return { load: Math.round(movingMins * mult), usedSufferScore: false };
}

// ─── ISO week helpers ─────────────────────────────────────────────────────────

/** Returns "YYYY-Www" for the Monday-anchored ISO week containing `date`. */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Move to nearest Thursday (ISO 8601 anchor day)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum   = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Returns the ISO week keys for today and the previous 3 weeks, newest first. */
function lastFourWeekKeys(): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let w = 0; w < 4; w++) {
    const d = new Date(today);
    d.setDate(d.getDate() - w * 7);
    keys.push(isoWeekKey(d));
  }
  return keys;
}

function weekLabel(offsetFromNow: number): string {
  if (offsetFromNow === 0) return 'This week';
  if (offsetFromNow === 1) return 'Last week';
  return `${offsetFromNow}w ago`;
}

// ─── Sport display name ───────────────────────────────────────────────────────

const SPORT_DISPLAY: Record<string, string> = {
  run: 'Running', trail_run: 'Trail Run', virtualrun: 'Running',
  ride: 'Cycling', virtualride: 'Cycling', mountainbike: 'MTB',
  gravel_ride: 'Gravel', ebikeride: 'E-Bike',
  swim: 'Swimming', open_water_swim: 'OW Swim',
  rowing: 'Rowing', kayaking: 'Kayaking',
  crossfit: 'CrossFit', weight_training: 'Weights',
  workout: 'Workout', hiit: 'HIIT',
  hike: 'Hiking', walk: 'Walking',
  yoga: 'Yoga', pilates: 'Pilates',
  tennis: 'Tennis', soccer: 'Soccer',
  basketball: 'Basketball', golf: 'Golf',
  skiing: 'Skiing', snowboard: 'Snowboard',
};

function sportDisplay(sportType: string): string {
  const key = sportType.toLowerCase().replace(/\s+/g, '_');
  return SPORT_DISPLAY[key] ?? sportType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Trend classification ─────────────────────────────────────────────────────

interface TrendMeta { label: TrendLabel; display: string; emoji: string; color: string; insight: string }

function classifyTrend(acRatio: number | null, atl: number): TrendMeta {
  if (acRatio === null || atl === 0) {
    return {
      label:   'deloading',
      display: 'No activity',
      emoji:   '😴',
      color:   '#9BA3B8',
      insight: 'No training sessions recorded this week. This could be an intentional rest week.',
    };
  }

  if (acRatio > 1.30) return {
    label:   'overreaching',
    display: 'Overreaching risk',
    emoji:   '⚠️',
    color:   '#EF4444',
    insight: `This week's load is ${Math.round(acRatio * 100 - 100)}% above your 4-week average. High spike loads increase injury risk — consider scaling back for 1–2 days.`,
  };

  if (acRatio >= 1.11) return {
    label:   'building',
    display: 'Building',
    emoji:   '📈',
    color:   '#F59E0B',
    insight: `You're training ${Math.round((acRatio - 1) * 100)}% above your recent average — a productive ramp. Keep recovery sleep consistent to absorb the load.`,
  };

  if (acRatio >= 0.90) return {
    label:   'maintaining',
    display: 'Maintaining',
    emoji:   '✅',
    color:   '#22C55E',
    insight: 'Load is consistent with your 4-week average — a great place to be for sustained fitness gains.',
  };

  if (acRatio >= 0.70) return {
    label:   'easy_week',
    display: 'Easy week',
    emoji:   '🌿',
    color:   '#60A5FA',
    insight: `Load is ${Math.round((1 - acRatio) * 100)}% below your average — a natural taper or recovery week. Good for absorbing previous training.`,
  };

  return {
    label:   'deloading',
    display: 'Deloading',
    emoji:   '🧘',
    color:   '#A78BFA',
    insight: `Significantly below your average load. If intentional, your body will thank you. If not, watch for motivation or fatigue signals.`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute the full 4-week training trend from a list of Strava activities.
 * Pass activities fetched for the last 28+ days.
 */
export function computeTrainingTrend(activities: StravaActivity[]): TrainingTrend {
  const weekKeys    = lastFourWeekKeys();   // [thisWeek, lastWeek, 2wAgo, 3wAgo]
  const keySet      = new Set(weekKeys);

  // ── Bucket activities into weeks ──────────────────────────────────────────
  const buckets: Record<string, {
    load: number; usedSufferScore: boolean;
    sessions: number; movingMins: number;
    sports: Record<string, number>;
  }> = {};

  for (const key of weekKeys) {
    buckets[key] = { load: 0, usedSufferScore: false, sessions: 0, movingMins: 0, sports: {} };
  }

  let hasSufferScore = false;

  for (const act of activities) {
    const actDate = new Date(act.start_date_local);
    const key     = isoWeekKey(actDate);
    if (!keySet.has(key)) continue;       // outside our 4-week window

    const { load, usedSufferScore } = activityLoad(act);
    const b = buckets[key];

    b.load        += load;
    b.sessions    += 1;
    b.movingMins  += Math.round((act.moving_time ?? act.elapsed_time ?? 0) / 60);

    if (usedSufferScore) {
      b.usedSufferScore = true;
      hasSufferScore    = true;
    }

    const sport = sportDisplay(act.sport_type);
    b.sports[sport] = (b.sports[sport] ?? 0) + 1;
  }

  // ── Build WeeklyLoad array (oldest → newest) ──────────────────────────────
  const weeks: WeeklyLoad[] = weekKeys
    .map((key, idx) => ({
      weekKey:         key,
      label:           weekLabel(idx),
      load:            buckets[key].load,
      usedSufferScore: buckets[key].usedSufferScore,
      sessionCount:    buckets[key].sessions,
      movingMinutes:   buckets[key].movingMins,
      sports:          buckets[key].sports,
    }))
    .reverse();   // display order: 3w ago → this week

  // ── ATL / CTL ─────────────────────────────────────────────────────────────
  const atl = weeks[weeks.length - 1].load;  // this week (last in array)
  const ctl = weeks.reduce((s, w) => s + w.load, 0) / 4;  // 4-week average

  const acRatio = ctl > 0 ? Math.round((atl / ctl) * 100) / 100 : null;

  // ── Trend classification ──────────────────────────────────────────────────
  const trendMeta = classifyTrend(acRatio, atl);

  // ── Aggregate sport breakdown across all 4 weeks ──────────────────────────
  const allSports: Record<string, number> = {};
  let totalSessions  = 0;
  let totalMinutes   = 0;

  for (const w of weeks) {
    for (const [sport, count] of Object.entries(w.sports)) {
      allSports[sport] = (allSports[sport] ?? 0) + count;
    }
    totalSessions += w.sessionCount;
    totalMinutes  += w.movingMinutes;
  }

  const topSports = Object.entries(allSports)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sport, count]) => ({
      sport,
      count,
      pct: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
    }));

  return {
    weeks,
    atl,
    ctl:          Math.round(ctl),
    acRatio,
    trend:        trendMeta.label,
    trendDisplay: trendMeta.display,
    trendEmoji:   trendMeta.emoji,
    trendColor:   trendMeta.color,
    insight:      trendMeta.insight,
    topSports,
    totalSessions,
    totalMinutes,
    hasSufferScore,
  };
}
