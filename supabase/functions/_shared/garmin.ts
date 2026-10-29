/**
 * Garmin Health and Activity API summaries, mapped to the rows the app
 * stores. Pure functions, shared with the jest tests; no Deno here.
 *
 * Garmin pushes a JSON object keyed by summary type, each entry carrying the
 * Garmin userId. Timestamps are UTC seconds with a device offset; one-per-day
 * summaries carry calendarDate. Updated records arrive with the same start
 * time and must replace what was stored (Health API 2.0, section 5.1).
 */

/**
 * True only for a token refresh Garmin rejected outright (400 invalid_grant,
 * 401): the refresh token is gone and the connection is revoked. Timeouts,
 * network errors and Garmin 5xx are transient and must be retried, so they
 * return false. garminApi.ts attaches `status` to the error it throws.
 */
export function isRevokedTokenError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const status = (e as Error & { status?: unknown }).status;
  return status === 400 || status === 401;
}

/** The pending connection row garmin-confirm looks up by nonce. */
export interface PendingConnectionRow {
  user_id:            string;
  status:             string;
  confirm_expires_at: string | null;
}

export type ConfirmDecision = 'activate' | 'reject' | 'expired';

/**
 * Whether a confirm may activate a connection: the row must exist, still be
 * pending, belong to the signed-in user and not have expired. 'reject' and
 * 'expired' both end in 403 and the pending row being deleted; they are
 * told apart only for the log.
 */
export function decideGarminConfirm(input: { row: PendingConnectionRow | null; jwtUserId: string; now?: number }): ConfirmDecision {
  const { row, jwtUserId, now = Date.now() } = input;
  if (!row || row.status !== 'pending' || row.user_id !== jwtUserId) return 'reject';
  const expires = row.confirm_expires_at ? Date.parse(row.confirm_expires_at) : NaN;
  if (Number.isNaN(expires) || expires <= now) return 'expired';
  return 'activate';
}

export type SummaryType =
  | 'dailies' | 'sleeps' | 'hrv' | 'stressDetails' | 'userMetrics' | 'hydration'
  | 'activities' | 'deregistrations' | 'userPermissionsChange';

export const SUMMARY_TYPES: SummaryType[] = [
  'dailies', 'sleeps', 'hrv', 'stressDetails', 'userMetrics', 'hydration',
  'activities', 'deregistrations', 'userPermissionsChange',
];

/** Which table each data summary lands in. */
export const TABLE_FOR: Record<Exclude<SummaryType, 'deregistrations' | 'userPermissionsChange'>, string> = {
  dailies:       'garmin_daily',
  sleeps:        'garmin_sleep',
  hrv:           'garmin_hrv',
  stressDetails: 'garmin_stress',
  userMetrics:   'garmin_user_metrics',
  hydration:     'garmin_hydration',
  activities:    'garmin_activities',
};

/** The primary key each table upserts on. */
export const CONFLICT_FOR: Record<keyof typeof TABLE_FOR, string> = {
  dailies:       'user_id,calendar_date',
  sleeps:        'user_id,start_time',
  hrv:           'user_id,calendar_date',
  stressDetails: 'user_id,start_time',
  userMetrics:   'user_id,calendar_date',
  hydration:     'user_id,calendar_date',
  activities:    'user_id,summary_id',
};

type Raw = Record<string, unknown>;

const num  = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int  = (v: unknown): number | null => { const n = num(v); return n === null ? null : Math.round(n); };
const str  = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const ts   = (secs: unknown): string | null => { const n = num(secs); return n === null ? null : new Date(n * 1000).toISOString(); };

/** Garmin's userId on a pushed item. */
export function garminUserId(item: Raw): string | null {
  return str(item.userId);
}

export function mapDaily(userId: string, r: Raw) {
  return {
    user_id:              userId,
    calendar_date:        str(r.calendarDate),
    summary_id:           str(r.summaryId),
    start_time:           ts(r.startTimeInSeconds),
    start_offset_sec:     int(r.startTimeOffsetInSeconds),
    duration_sec:         int(r.durationInSeconds) ?? 0,
    steps:                int(r.steps),
    distance_m:           num(r.distanceInMeters),
    active_kcal:          int(r.activeKilocalories),
    bmr_kcal:             int(r.bmrKilocalories),
    resting_hr:           int(r.restingHeartRateInBeatsPerMinute),
    min_hr:               int(r.minHeartRateInBeatsPerMinute),
    max_hr:               int(r.maxHeartRateInBeatsPerMinute),
    avg_stress:           int(r.averageStressLevel),
    max_stress:           int(r.maxStressLevel),
    stress_sec:           int(r.stressDurationInSeconds),
    rest_stress_sec:      int(r.restStressDurationInSeconds),
    activity_stress_sec:  int(r.activityStressDurationInSeconds),
    stress_qualifier:     str(r.stressQualifier),
    body_battery_charged: int(r.bodyBatteryChargedValue),
    body_battery_drained: int(r.bodyBatteryDrainedValue),
    moderate_sec:         int(r.moderateIntensityDurationInSeconds),
    vigorous_sec:         int(r.vigorousIntensityDurationInSeconds),
    floors_climbed:       int(r.floorsClimbed),
  };
}

export function mapSleep(userId: string, r: Raw) {
  const overall = (r.overallSleepScore ?? {}) as Raw;
  return {
    user_id:          userId,
    start_time:       ts(r.startTimeInSeconds),
    calendar_date:    str(r.calendarDate),
    summary_id:       str(r.summaryId),
    start_offset_sec: int(r.startTimeOffsetInSeconds),
    duration_sec:     int(r.durationInSeconds) ?? 0,
    deep_sec:         int(r.deepSleepDurationInSeconds),
    light_sec:        int(r.lightSleepDurationInSeconds),
    rem_sec:          int(r.remSleepInSeconds),
    awake_sec:        int(r.awakeDurationInSeconds),
    unmeasurable_sec: int(r.unmeasurableSleepInSeconds),
    nap_sec:          int(r.totalNapDurationInSeconds),
    validation:       str(r.validation),
    sleep_score:      int(overall.value),
    sleep_quality:    str(overall.qualifierKey),
  };
}

export function mapHrv(userId: string, r: Raw) {
  return {
    user_id:              userId,
    calendar_date:        str(r.calendarDate),
    summary_id:           str(r.summaryId),
    start_time:           ts(r.startTimeInSeconds),
    start_offset_sec:     int(r.startTimeOffsetInSeconds),
    duration_sec:         int(r.durationInSeconds),
    last_night_avg:       int(r.lastNightAvg),
    last_night_5min_high: int(r.lastNight5MinHigh),
    values_5min:          (r.hrvValues && typeof r.hrvValues === 'object') ? r.hrvValues : null,
  };
}

export function mapStress(userId: string, r: Raw) {
  return {
    user_id:             userId,
    start_time:          ts(r.startTimeInSeconds),
    calendar_date:       str(r.calendarDate),
    summary_id:          str(r.summaryId),
    start_offset_sec:    int(r.startTimeOffsetInSeconds),
    duration_sec:        int(r.durationInSeconds),
    stress_values:       (r.timeOffsetStressLevelValues && typeof r.timeOffsetStressLevelValues === 'object') ? r.timeOffsetStressLevelValues : null,
    body_battery_values: (r.timeOffsetBodyBatteryValues && typeof r.timeOffsetBodyBatteryValues === 'object') ? r.timeOffsetBodyBatteryValues : null,
  };
}

export function mapUserMetrics(userId: string, r: Raw) {
  return {
    user_id:         userId,
    calendar_date:   str(r.calendarDate),
    summary_id:      str(r.summaryId),
    vo2_max:         num(r.vo2Max),
    vo2_max_cycling: num(r.vo2MaxCycling),
    fitness_age:     int(r.fitnessAge),
    enhanced:        bool(r.enhanced),
  };
}

export function mapHydration(userId: string, r: Raw) {
  return {
    user_id:       userId,
    calendar_date: str(r.calendarDate),
    summary_id:    str(r.summaryId),
    fluid_ml:      int(r.fluidIntakeInML),
  };
}

export function mapActivity(userId: string, r: Raw) {
  return {
    user_id:           userId,
    summary_id:        str(r.summaryId),
    activity_id:       r.activityId == null ? null : String(r.activityId),
    activity_type:     str(r.activityType),
    activity_name:     str(r.activityName),
    start_time:        ts(r.startTimeInSeconds),
    start_offset_sec:  int(r.startTimeOffsetInSeconds),
    duration_sec:      int(r.durationInSeconds),
    avg_hr:            int(r.averageHeartRateInBeatsPerMinute),
    max_hr:            int(r.maxHeartRateInBeatsPerMinute),
    distance_m:        num(r.distanceInMeters),
    active_kcal:       int(r.activeKilocalories),
    steps:             int(r.steps),
    device_name:       str(r.deviceName),
    manual:            bool(r.manual),
    parent_summary_id: str(r.parentSummaryId),
  };
}

export type MappedRow = Record<string, unknown>;

/** Map one pushed item of a data summary type. Null when it lacks its key fields. */
export function mapSummary(type: keyof typeof TABLE_FOR, userId: string, item: Raw): MappedRow | null {
  const row: MappedRow =
    type === 'dailies'       ? mapDaily(userId, item)
  : type === 'sleeps'        ? mapSleep(userId, item)
  : type === 'hrv'           ? mapHrv(userId, item)
  : type === 'stressDetails' ? mapStress(userId, item)
  : type === 'userMetrics'   ? mapUserMetrics(userId, item)
  : type === 'hydration'     ? mapHydration(userId, item)
  :                            mapActivity(userId, item);
  for (const key of CONFLICT_FOR[type].split(',')) if (row[key] == null) return null;
  return row;
}

/**
 * One row per conflict key, so a single upsert never touches a row twice.
 * Garmin can push several versions of the same day in one body; the one
 * covering more time wins, and on a tie the later one.
 */
export function dedupeByConflict(type: keyof typeof TABLE_FOR, rows: MappedRow[]): MappedRow[] {
  const keys = CONFLICT_FOR[type].split(',');
  const byKey = new Map<string, MappedRow>();
  for (const row of rows) {
    const k = keys.map(c => String(row[c])).join('|');
    const prev = byKey.get(k);
    if (!prev || Number(row.duration_sec ?? 0) >= Number(prev.duration_sec ?? 0)) byKey.set(k, row);
  }
  return [...byKey.values()];
}

/**
 * The items of a push body for one summary type. Garmin sends
 * { "<type>": [ ... ] }; anything else is ignored.
 */
export function itemsOf(body: unknown, type: SummaryType): Raw[] {
  if (!body || typeof body !== 'object') return [];
  const list = (body as Raw)[type];
  return Array.isArray(list) ? list.filter((x): x is Raw => !!x && typeof x === 'object') : [];
}
