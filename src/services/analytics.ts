/**
 * analytics
 *
 * First-party product events, written straight to public.app_events under
 * the signed-in user's own row-level policy. No SDK, no third party, no
 * health values: the point is to know whether people reach day 7, see the
 * paywall, open the briefing, and where they stall. Anything else belongs
 * in the score tables.
 *
 * Fire-and-forget by design. A failed insert must never surface anywhere.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabase';
import { localDateStr } from '@utils/index';

export type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_complete'
  | 'new_today_shown'         // { kind }
  | 'trial_ending_shown'      // { when: 'today' | 'tomorrow' }
  | 'trial_ending_keep_pro'
  | 'first_look_shown'        // { from: 'today' | 'history' }
  | 'onboarding_step'         // { step, name }: one per onboarding screen shown
  | 'score_shown'
  | 'insufficient_data'
  | 'briefing_opened'
  | 'coach_opened'
  | 'paywall_shown'
  | 'purchase_success'
  | 'restore_success'
  | 'calibration_report_shown'
  | 'calibration_keep_pro'
  | 'score_math_opened'
  // Coach (1.0.4). Never the message text, only where it came from.
  | 'coach_message_sent'     // { source: 'typed' | 'chip' | 'briefing' | 'notification', pro }
  | 'coach_answer_rated'     // { rating: 'up' | 'down' }
  | 'coach_followup_tapped'  // { pro }
  | 'coach_memory_saved'     // { count }
  | 'coach_checkin_sent'     // { pattern }
  // Illness events carry no readings or durations (privacy policy: product
  // events hold no health values). hasRhr/hasHrv say only whether the watch
  // records those at all.
  | 'illness_tracking_started' // { source: 'tag' | 'nudge', hasRhr, hasHrv }
  | 'illness_nudge_shown'
  | 'illness_nudge_dismissed'
  | 'illness_recovered'
  | 'illness_ended'            // { recovered }
  | 'water_logged'             // { unit } (no amounts)
  | 'water_undone'
  | 'feedback_opened'
  | 'reading_check_shown'      // no props: which reading and which answer are health details
  | 'reading_check_answered'
  | 'rating_prompted';         // { moment: 'day7' | 'good_day' } (iOS may still not show the sheet)

type Props = Record<string, string | number | boolean | null>;

const DAILY_KEY = '@readiness/analytics_daily';

async function send(event: AnalyticsEvent, props: Props): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('app_events').insert({ user_id: session.user.id, event, props });
  } catch {
    // Never let analytics affect the app.
  }
}

/** Record an event now. */
export function track(event: AnalyticsEvent, props: Props = {}): void {
  void send(event, props);
}

/**
 * Record an event at most once per local day per device. For things that
 * happen on every render pass (app open, score shown) where one row a day
 * is the useful unit.
 */
export function trackDaily(event: AnalyticsEvent, props: Props = {}): void {
  void (async () => {
    const today = localDateStr();
    try {
      const raw  = await AsyncStorage.getItem(DAILY_KEY);
      const seen = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      if (seen[event] === today) return;
      seen[event] = today;
      await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(seen));
    } catch {
      // Storage trouble: fall through and send anyway; a duplicate row is fine.
    }
    await send(event, props);
  })();
}
