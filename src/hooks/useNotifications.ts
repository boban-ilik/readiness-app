/**
 * useNotifications
 *
 * Manages notification permissions, user preferences (threshold + digest time),
 * and scheduling logic.
 *
 * ── What this covers ─────────────────────────────────────────────────────────
 *
 * 1. Morning digest  — a repeating daily notification at a user-chosen time
 *    (default 08:00). Just "Good morning — tap to see your readiness score."
 *    Rescheduled automatically whenever the time or toggle changes.
 *
 * 2. Low-score alert — when the home screen loads a score below the user's
 *    threshold, it calls `checkAndAlertScore(score)`. If the score is below
 *    threshold AND we haven't already alerted today, we schedule an immediate
 *    local notification (fires 2 seconds later, visible even if the user
 *    backgrounds the app), then record today's date to suppress duplicates.
 *
 * ── Limitations (documented for RevenueCat / push upgrade path) ──────────────
 * Local notifications only fire when the device is on. True "pushed" low-score
 * alerts (e.g., Garmin syncs overnight while the phone is locked) require a
 * server-side push via APNs + a background task. That's a Phase 2 upgrade —
 * swap `scheduleImmediateAlert` for a Supabase Edge Function call.
 *
 * ── AsyncStorage keys ────────────────────────────────────────────────────────
 * @readiness/notif_digest_enabled      'true' | 'false'
 * @readiness/notif_digest_hour         '8'
 * @readiness/notif_digest_minute       '0'
 * @readiness/notif_threshold_enabled   'true' | 'false'
 * @readiness/notif_threshold_value     '65'
 * @readiness/notif_threshold_last_date 'YYYY-MM-DD'   (dedup today's alert)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Expo Go guard ────────────────────────────────────────────────────────────
// expo-notifications requires native code compiled into a custom dev build.
// In Expo Go the ExpoPushTokenManager native module is absent, so every
// Notifications call would throw. We detect this at module load time and skip
// all setup — the hook returns safe no-op defaults instead.
//
// WHY TWO CHECKS:
//   Constants.appOwnership === 'expo' was the old API (deprecated in SDK 45).
//   On Android it now returns null. The modern replacement is
//   Constants.executionEnvironment === 'storeClient' which reliably returns
//   'storeClient' for Expo Go across both platforms in SDK 45+.
//   We keep both for belt-and-suspenders compatibility.

const IS_EXPO_GO =
  Constants.appOwnership === 'expo' ||
  (Constants.executionEnvironment as string) === 'storeClient';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const K = {
  DIGEST_ENABLED:    '@readiness/notif_digest_enabled',
  DIGEST_HOUR:       '@readiness/notif_digest_hour',
  DIGEST_MINUTE:     '@readiness/notif_digest_minute',
  THRESHOLD_ENABLED: '@readiness/notif_threshold_enabled',
  THRESHOLD_VALUE:   '@readiness/notif_threshold_value',
  THRESHOLD_LAST:    '@readiness/notif_threshold_last_date',
  LAST_SCORE:        '@readiness/notif_last_score',
} as const;

// ─── Native setup (custom build only) ────────────────────────────────────────

if (!IS_EXPO_GO) {
  // Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('readiness', {
      name: 'Readiness',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5A623',
    });
  }

  // Show notifications even when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge:  false,
    }),
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  digestEnabled:    boolean;
  digestHour:       number;   // 0–23
  digestMinute:     number;   // 0–59
  thresholdEnabled: boolean;
  thresholdValue:   number;   // 0–100 score
}

interface UseNotificationsReturn {
  prefs:        NotificationPrefs;
  isLoading:    boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermissions: () => Promise<boolean>;
  updatePrefs:  (updates: Partial<NotificationPrefs>) => Promise<void>;
  checkAndAlertScore: (score: number) => Promise<void>;
  /** Save the score and reschedule the morning digest with personalised copy. */
  rescheduleDigestWithScore: (score: number) => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPrefs = {
  digestEnabled:    false,
  digestHour:       8,
  digestMinute:     0,
  thresholdEnabled: false,
  thresholdValue:   60,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadPrefs(): Promise<NotificationPrefs> {
  const [
    digestEnabled,
    digestHour,
    digestMinute,
    thresholdEnabled,
    thresholdValue,
  ] = await AsyncStorage.multiGet([
    K.DIGEST_ENABLED,
    K.DIGEST_HOUR,
    K.DIGEST_MINUTE,
    K.THRESHOLD_ENABLED,
    K.THRESHOLD_VALUE,
  ]);

  return {
    digestEnabled:    (digestEnabled[1]    ?? 'false') === 'true',
    digestHour:       parseInt(digestHour[1]    ?? '8',  10),
    digestMinute:     parseInt(digestMinute[1]  ?? '0',  10),
    thresholdEnabled: (thresholdEnabled[1] ?? 'false') === 'true',
    thresholdValue:   parseInt(thresholdValue[1] ?? '60', 10),
  };
}

async function savePrefs(p: NotificationPrefs): Promise<void> {
  await AsyncStorage.multiSet([
    [K.DIGEST_ENABLED,    p.digestEnabled    ? 'true' : 'false'],
    [K.DIGEST_HOUR,       String(p.digestHour)],
    [K.DIGEST_MINUTE,     String(p.digestMinute)],
    [K.THRESHOLD_ENABLED, p.thresholdEnabled ? 'true' : 'false'],
    [K.THRESHOLD_VALUE,   String(p.thresholdValue)],
  ]);
}

// ─── Smart notification copy ──────────────────────────────────────────────────
// Rules:
//  1. Forward-looking — talk about TODAY, not yesterday
//  2. Curiosity gap   — give enough to intrigue, not enough to satisfy
//  3. Variety         — rotate variants so the brain doesn't filter them out
//  4. Care, not alarm — low scores should feel supportive, not clinical

// Seeded daily rotation: same variant all day, different one tomorrow.
function dailyVariant(count: number): number {
  const day = new Date().getDate();
  return day % count;
}

// ── Morning digest ────────────────────────────────────────────────────────────

const DIGEST_COPY: Record<string, Array<{ title: string; body: string }>> = {
  peak: [
    {
      title: "You're in peak shape today 🟢",
      body:  'HRV and sleep both look strong. Tap to see your score and get a training plan for the day.',
    },
    {
      title: 'Green light for a hard session →',
      body:  'Your recovery is fully loaded. Check your score and see what the coach recommends.',
    },
    {
      title: 'Your body is ready — are you? 💪',
      body:  'Everything is pointing up this morning. Tap to see your readiness score.',
    },
  ],
  good: [
    {
      title: "Solid recovery overnight →",
      body:  "You're in good shape for today. Tap to see your score and what kind of session fits.",
    },
    {
      title: 'Your morning score is waiting →',
      body:  'Recovery looks solid. Check in to see your full breakdown and daily training guide.',
    },
    {
      title: "Looking good this morning ✅",
      body:  'Your body handled yesterday well. Tap to see what today has in store.',
    },
  ],
  moderate: [
    {
      title: 'Mixed signals this morning →',
      body:  'Some things are up, some are down. Tap to see your score before committing to a hard session.',
    },
    {
      title: 'Your readiness score is ready →',
      body:  "Recovery was partial last night — check your score to see what today's capacity looks like.",
    },
    {
      title: 'Worth a quick check this morning →',
      body:  "Your body's sending mixed signals. Tap to see your breakdown and let the coach weigh in.",
    },
  ],
  low: [
    {
      title: 'Your body needs you today 🫶',
      body:  'Recovery is still catching up. Tap to see your score and get a personalised care plan.',
    },
    {
      title: 'Rest day candidate →',
      body:  'Your score suggests a lighter load today. Open the app for your coach\'s recommendation.',
    },
    {
      title: 'Low score morning — coach has thoughts →',
      body:  'Something dragged your readiness down. Tap to see what it was and how to respond.',
    },
  ],
  noData: [
    {
      title: "Good morning — your score is ready →",
      body:  'Tap to see how recovered you are and what kind of day your body is up for.',
    },
    {
      title: 'Morning check-in →',
      body:  'Your daily readiness score is waiting. Takes 2 seconds to see how you\'re doing.',
    },
  ],
};

function buildDigestCopy(lastScore: number | null): { title: string; body: string } {
  if (lastScore == null) {
    const v = DIGEST_COPY.noData;
    return v[dailyVariant(v.length)];
  }
  const tier = lastScore >= 80 ? 'peak'
             : lastScore >= 65 ? 'good'
             : lastScore >= 50 ? 'moderate'
             :                   'low';
  const v = DIGEST_COPY[tier];
  return v[dailyVariant(v.length)];
}

// ── Low-score alert ───────────────────────────────────────────────────────────

const LOW_SCORE_COPY = [
  {
    title: (s: number) => `Your body needs some care today (${s}) 🫶`,
    body:  'Readiness is low. Open the app for your recovery protocol — 3 things that actually help.',
  },
  {
    title: (s: number) => `Low score today (${s}) — coach has a plan →`,
    body:  "Your body's asking for a lighter day. Tap to see what's dragging the score down.",
  },
  {
    title: (s: number) => `Rest day signal (${s}) →`,
    body:  'Your readiness is below your threshold. Tap to see the breakdown and recovery guidance.',
  },
];

/** Cancel all scheduled digest notifications and re-schedule if enabled. */
async function syncDigestNotification(
  p:         NotificationPrefs,
  lastScore: number | null = null,
): Promise<void> {
  // Cancel existing digest (cancel-all is safe here; the threshold alert is
  // immediate and won't sit in the scheduled list more than a second).
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!p.digestEnabled) return;

  const { title, body } = buildDigestCopy(lastScore);

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { type: 'digest' } },
    trigger: {
      hour:    p.digestHour,
      minute:  p.digestMinute,
      repeats: true,
    },
  });
}

/** Schedule a one-shot low-score notification firing in 2 seconds. */
async function scheduleImmediateAlert(score: number, _threshold: number): Promise<void> {
  const variant = LOW_SCORE_COPY[dailyVariant(LOW_SCORE_COPY.length)];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: variant.title(score),
      body:  variant.body,
      data:  { type: 'threshold', score },
    },
    trigger: { seconds: 2, repeats: false },
  });
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [prefs, setPrefs]         = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);

  // Prevent double-alerting within one session
  const alertedThisSession = useRef(false);

  // Load prefs on mount. In Expo Go, skip the Notifications.getPermissionsAsync()
  // call entirely — the native module isn't available.
  useEffect(() => {
    (async () => {
      if (IS_EXPO_GO) {
        const loaded = await loadPrefs();
        setPrefs(loaded);
        setIsLoading(false);
        return;
      }
      const [loaded, { status }] = await Promise.all([
        loadPrefs(),
        Notifications.getPermissionsAsync(),
      ]);
      setPrefs(loaded);
      setPermissionStatus(status);
      setIsLoading(false);
    })();
  }, []);

  // ── Request permissions ──────────────────────────────────────────────────

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (IS_EXPO_GO) return false; // no-op in Expo Go
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  // ── Update prefs ──────────────────────────────────────────────────────────

  const updatePrefs = useCallback(async (updates: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    await savePrefs(next);

    if (IS_EXPO_GO) return; // skip scheduling in Expo Go

    // If digest settings changed, re-sync the scheduled notification,
    // preserving the last-known score for personalised copy.
    if (
      'digestEnabled' in updates ||
      'digestHour'    in updates ||
      'digestMinute'  in updates
    ) {
      if (permissionStatus === 'granted') {
        const raw       = await AsyncStorage.getItem(K.LAST_SCORE);
        const lastScore = raw != null ? parseInt(raw, 10) : null;
        await syncDigestNotification(next, lastScore);
      }
    }
  }, [prefs, permissionStatus]);

  // ── Score alert check ─────────────────────────────────────────────────────

  const checkAndAlertScore = useCallback(async (score: number) => {
    if (IS_EXPO_GO)                        return; // native module absent
    if (!prefs.thresholdEnabled)           return;
    if (score >= prefs.thresholdValue)     return;
    if (permissionStatus !== 'granted')    return;
    if (alertedThisSession.current)        return;

    // Dedup: only one alert per calendar day
    const lastAlerted = await AsyncStorage.getItem(K.THRESHOLD_LAST);
    if (lastAlerted === todayStr())        return;

    alertedThisSession.current = true;
    await AsyncStorage.setItem(K.THRESHOLD_LAST, todayStr());
    await scheduleImmediateAlert(score, prefs.thresholdValue);
  }, [prefs, permissionStatus]);

  // ── Reschedule digest with today's score ─────────────────────────────────
  // Call this from the home screen whenever a score loads. It caches the score
  // and reschedules the morning notification with personalised copy so that
  // tomorrow's 8am notification says "Yesterday you scored X".

  const rescheduleDigestWithScore = useCallback(async (score: number) => {
    if (IS_EXPO_GO)                     return; // native module absent
    if (!prefs.digestEnabled)           return;
    if (permissionStatus !== 'granted') return;

    // Persist the score for use when syncing later
    await AsyncStorage.setItem(K.LAST_SCORE, String(Math.round(score)));
    await syncDigestNotification(prefs, Math.round(score));
  }, [prefs, permissionStatus]);

  return {
    prefs,
    isLoading,
    permissionStatus,
    requestPermissions,
    updatePrefs,
    checkAndAlertScore,
    rescheduleDigestWithScore,
  };
}
