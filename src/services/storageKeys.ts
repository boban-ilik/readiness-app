/**
 * storageKeys
 *
 * Single source of truth for the AsyncStorage keys that hold data about a
 * specific person. The wipe list (USER_SCOPED_KEYS / USER_SCOPED_PREFIXES)
 * is built here so a newly added per-user key cannot be forgotten by the
 * sign-out / account-switch wipe.
 *
 * Rule: when you add a new @readiness/ key that holds anything personal
 * (profile, baselines, cycle, coach, Strava/Garmin, AI caches, notification
 * dedupe state), add it here — never as a bare literal in a service.
 */

/** Tracks which Supabase user the locally stored data belongs to. */
export const DATA_OWNER_KEY = '@readiness/data_owner_id';

// ─── Named profile / onboarding keys ─────────────────────────────────────────
// These are imported by the startup sync, the profile service and the screens.
// Defining them here (rather than in onboarding.tsx) keeps services from
// importing a screen and stops the literals drifting apart.
export const ONBOARDING_KEY     = '@readiness/onboarding_complete';
export const DEVICE_KEY         = '@readiness/device_type';
export const NAME_KEY           = '@readiness/user_name';
export const FREQ_KEY           = '@readiness/training_frequency';
export const JOINED_AT_KEY      = '@readiness/joined_at';
export const PROFILE_AGE_KEY    = '@readiness/profile_age';
export const PROFILE_SEX_KEY    = '@readiness/profile_sex';
export const PROFILE_GOAL_KEY   = '@readiness/profile_goal';
export const PROFILE_HEIGHT_KEY = '@readiness/profile_height_cm';
export const PROFILE_WEIGHT_KEY = '@readiness/profile_weight_kg';
export const PROFILE_PHOTO_KEY  = '@readiness/profile_photo_uri';
export const NOTIF_ENABLED_KEY  = '@readiness/notif_digest_enabled';
export const NOTIF_HOUR_KEY     = '@readiness/notif_digest_hour';
export const NOTIF_MINUTE_KEY   = '@readiness/notif_digest_minute';

/**
 * Every key holding data about a specific person. Anything genuinely global
 * (dev flags, app-level preferences) is deliberately excluded.
 */
export const USER_SCOPED_KEYS = [
  // Onboarding + profile
  '@readiness/onboarding_complete',
  '@readiness/joined_at',
  '@readiness/user_name',
  '@readiness/device_type',
  '@readiness/training_frequency',
  '@readiness/profile_age',
  '@readiness/profile_sex',
  '@readiness/profile_goal',
  '@readiness/profile_height_cm',
  '@readiness/profile_weight_kg',
  '@readiness/profile_photo_uri',

  // Personal baselines
  '@readiness/hrv_baseline',
  '@readiness/rhr_baseline',

  // Cycle tracking — sensitive
  '@readiness/cycle_enabled',
  '@readiness/cycle_entries',
  '@readiness/cycle_length',
  '@readiness/cycle_period_length',

  // Streaks
  '@readiness/best_streak',

  // Strava OAuth — must never cross accounts. The access/refresh tokens live
  // in SecureStore (see services/strava.ts) and are cleared via clearStravaTokens.
  '@readiness/strava_oauth_state',

  // Garmin connection mirror (GARMIN_CONNECTED_KEY in services/garmin.ts):
  // the next account on this phone must not inherit "Garmin connected"
  '@readiness/garmin_connected',

  // Today layout memory (CollapsibleSection, ProBanner)
  '@readiness/today_week_open',
  '@readiness/pro_banner_dismissed_day',

  // Notification preferences and dedupe state
  '@readiness/notif_digest_enabled',
  '@readiness/notif_digest_hour',
  '@readiness/notif_digest_minute',
  '@readiness/notif_threshold_enabled',
  '@readiness/notif_threshold_value',
  '@readiness/notif_threshold_last_date',
  '@readiness/notif_hrv_drop_enabled',
  '@readiness/notif_hrv_drop_last_date',
  '@readiness/notif_rhr_spike_enabled',
  '@readiness/notif_rhr_spike_last_date',
  '@readiness/notif_trend_decline_enabled',
  '@readiness/notif_trend_decline_last_date',
  '@readiness/notif_last_score',
  '@readiness/notif_score_history',
  '@readiness/notif_coach_checkin_enabled',
  '@readiness/notif_coach_checkin_last_date',

  // Coach conversation — contains health details and whatever the user typed
  '@readiness/coach_chat_v1',

  // One-time calibration-week report flag
  '@readiness/calibration_report_seen',
  '@readiness/first_look_seen',
  '@readiness/trial_ending_seen',
  '@readiness/opened_features',

  // Weekly free-briefing allowance — per account, so switching accounts
  // cannot smuggle extra briefings
  '@readiness/free_briefing_last_used',

  // Trend insight cache (30 min TTL) — narrates the previous user's week
  '@readiness/trend_v1',
  '@readiness/phase_baseline_v1',
  '@readiness/coach_memory_v1',
  '@readiness/coach_free_remaining_v1',

  // Back-from-illness episodes and the "feeling unwell?" snooze
  '@readiness/illness_episodes_v1',
  '@readiness/illness_nudge_dismissed',

  // What the 3-day forecast predicted, for a future accuracy record
  '@readiness/forecast_log_v1',

  // Water units and daily target (the Health permission flag is per device)
  '@readiness/water_unit',
  '@readiness/water_target_l',

  // What the user said about unusual readings
  '@readiness/reading_check_v1',
];

/**
 * Keys suffixed with a date, so they need a prefix sweep rather than an exact
 * match. The briefing cache and its feedback both hold personal health detail:
 * the cached briefing quotes the user's HRV, sleep and heart rate directly.
 */
export const USER_SCOPED_PREFIXES = [
  '@readiness/manual_hrv_',
  '@readiness/daily_briefing_v1_',
  '@readiness/briefing_feedback_v1_',
  // Weekly AI report (per ISO week) quotes averages, best/worst days and the
  // narrative; the pattern cache feeds the next user's briefing, coach and
  // forecast; the per-component AI insight quotes HRV/RHR directly.
  '@readiness/weekly_report_v1_',
  '@readiness/patterns_v1_',
  '@readiness/ai_v1_',
];
