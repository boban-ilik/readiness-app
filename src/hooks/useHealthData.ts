import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestHealthKitPermissions,
  fetchTodaysHealthData,
  fetchHRVByDay,
  fetchRHRByDay,
  isHealthKitAvailable,
} from '@services/healthkit';
import { calculateReadiness, explainReadiness, setBaselineSource, type ReadinessResult } from '@utils/readiness';
import { computePhaseBaselines, type PhaseBaselineResult } from '@utils/cycleBaselines';
import { computeCycleState, latestEntry, loadCycleSnapshot } from '@services/cycleTracking';
import { setScoreSnapshot } from '@services/scoreSession';
import { computeRHRBaseline, computeHRVBaseline } from '@utils/index';
import type { HealthData } from '../types';
import { supabase } from '@services/supabase';
import { upsertTodayScore } from '@services/scoreSync';
import { pushScoreToWidget, setWidgetIllnessCap } from '@services/widgetBridge';
import { localDateStr } from '@utils/index';
import { excludeIllnessDays } from '@utils/illnessRecovery';
import { loadIllnessEpisodes, isIllnessCapStored } from '@services/illnessEpisode';
import { getRHRByDay, getHRVByDay, isGarminHRVUnavailable } from '@services/healthSource';
import { healthKitLoadReason } from '@services/healthKitModule';
import { isGarminConnected, fetchGarminDays, refreshGarminConnection } from '@services/garmin';
import { overlayGarminToday } from '@utils/garminSource';

// ─── Types ────────────────────────────────────────────────────────────────────

/** How to invoke load():
 *  'initial'  — first mount, shows full-screen ActivityIndicator
 *  'refresh'  — user-initiated pull-to-refresh, drives RefreshControl spinner
 *  'silent'   — background re-enter, no spinner at all
 */
type LoadMode = 'initial' | 'refresh' | 'silent';

interface UseHealthDataReturn {
  readiness:     ReadinessResult | null;
  isLoading:     boolean;   // full-screen spinner (initial load only)
  isRefreshing:  boolean;   // pull-to-refresh indicator
  error:         string | null;
  refresh:       () => Promise<void>;
  hasPermission: boolean;
  rhrBaseline:   number;
  hrvBaseline:   number;    // personal 30-day HRV baseline (ms); 55 until enough data
  /** Store a manually entered HRV value (ms) for today and re-score.
   *  Pass null to clear a previously saved manual entry. */
  setManualHRV:  (value: number | null) => Promise<void>;
  /** Changes every time a load finishes (initial, pull-to-refresh or silent). */
  loadedAt:      number;
}

// ─── Manual HRV store ─────────────────────────────────────────────────────────
// Per-day AsyncStorage key so yesterday's manual entry doesn't bleed into today.

const MANUAL_HRV_KEY_PREFIX = '@readiness/manual_hrv_'; // + YYYY-MM-DD

function todayDateStr(): string {
  const d = new Date();
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

async function loadManualHRV(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(`${MANUAL_HRV_KEY_PREFIX}${todayDateStr()}`);
    if (!raw) return null;
    const val = parseFloat(raw);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

/** HRV the user typed in over the last `days` days, keyed by local date. */
export async function loadManualHRVByDay(days: number): Promise<Record<string, number>> {
  const dates: string[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(localDateStr(d));
  }
  const out: Record<string, number> = {};
  try {
    const pairs = await AsyncStorage.multiGet(dates.map(d => `${MANUAL_HRV_KEY_PREFIX}${d}`));
    pairs.forEach(([, raw], i) => {
      const v = raw ? parseFloat(raw) : NaN;
      if (!isNaN(v)) out[dates[i]] = v;
    });
  } catch { /* no manual history */ }
  return out;
}

async function saveManualHRV(value: number): Promise<void> {
  await AsyncStorage.setItem(`${MANUAL_HRV_KEY_PREFIX}${todayDateStr()}`, String(value));
}

async function removeManualHRV(): Promise<void> {
  await AsyncStorage.removeItem(`${MANUAL_HRV_KEY_PREFIX}${todayDateStr()}`);
}

// ─── Baseline cache ───────────────────────────────────────────────────────────
// Recalculate the personal RHR baseline at most once every 24 hours.

const BASELINE_CACHE_KEY = '@readiness/rhr_baseline';
const BASELINE_TTL_MS    = 24 * 60 * 60 * 1000; // 24 h

// Same minimum computeRHRBaseline / computeHRVBaseline use before they stop
// returning the stand-in value.
const BASELINE_MIN_DAYS = 7;

interface BaselineCache {
  value:      number;
  computedAt: number; // unix ms
  /** From 7+ days of the user's own data. Absent in caches written before 1.0.5. */
  personal?:  boolean;
}

async function loadCachedBaseline(): Promise<BaselineCache | null> {
  try {
    const raw = await AsyncStorage.getItem(BASELINE_CACHE_KEY);
    if (!raw) return null;
    const cache: BaselineCache = JSON.parse(raw);
    if (Date.now() - cache.computedAt > BASELINE_TTL_MS) return null; // stale
    return cache;
  } catch {
    return null;
  }
}

async function saveBaselineCache(value: number, personal: boolean): Promise<void> {
  const cache: BaselineCache = { value, computedAt: Date.now(), personal };
  await AsyncStorage.setItem(BASELINE_CACHE_KEY, JSON.stringify(cache));
}

export async function getPersonalRHRBaseline(): Promise<number> {
  const cached = await loadCachedBaseline();
  if (cached !== null) {
    setBaselineSource('rhr', cached.personal);
    return cached.value;
  }

  // Days inside a Sick episode stay out, so an illness can't drag "usual" with it
  const episodes = await loadIllnessEpisodes();
  const history  = Object.values(excludeIllnessDays(await getRHRByDay(30), episodes, localDateStr()));
  const baseline = computeRHRBaseline(history);
  console.log('[Readiness] RHR baseline computed:', baseline, 'bpm from', history.length, 'days');

  const personal = history.length >= BASELINE_MIN_DAYS;
  setBaselineSource('rhr', personal);
  await saveBaselineCache(baseline, personal);
  return baseline;
}

// ─── HRV baseline cache ───────────────────────────────────────────────────────
// Same 24-hour TTL as the RHR baseline — HRV data doesn't change mid-day.

const HRV_BASELINE_CACHE_KEY = '@readiness/hrv_baseline';

async function loadCachedHRVBaseline(): Promise<BaselineCache | null> {
  try {
    const raw = await AsyncStorage.getItem(HRV_BASELINE_CACHE_KEY);
    if (!raw) return null;
    const cache: BaselineCache = JSON.parse(raw);
    if (Date.now() - cache.computedAt > BASELINE_TTL_MS) return null; // stale
    return cache;
  } catch {
    return null;
  }
}

async function saveHRVBaselineCache(value: number, personal: boolean): Promise<void> {
  const cache: BaselineCache = { value, computedAt: Date.now(), personal };
  await AsyncStorage.setItem(HRV_BASELINE_CACHE_KEY, JSON.stringify(cache));
}

export async function getPersonalHRVBaseline(): Promise<number> {
  const cached = await loadCachedHRVBaseline();
  if (cached !== null) {
    setBaselineSource('hrv', cached.personal);
    return cached.value;
  }

  // Typed-in HRV counts too: wearables that never write HRV to Apple Health
  // (Garmin, Polar, Whoop, Oura) would otherwise be judged against the
  // population stand-in forever. As in today's score, a typed-in value wins
  // for its day. Days inside a Sick episode stay out.
  // With Garmin connected the HRV history is Garmin's alone (RMSSD): typed-in
  // and Apple values are a different measure and would skew the baseline.
  const garmin = await isGarminConnected();
  const [fromSource, manual, episodes] = await Promise.all([
    getHRVByDay(30, { garminRequired: true }).catch(e => { if (isGarminHRVUnavailable(e)) return null; throw e; }),
    garmin ? Promise.resolve({} as Record<string, number>) : loadManualHRVByDay(30),
    loadIllnessEpisodes(),
  ]);
  if (fromSource === null) {
    // Garmin is connected but its history could not be read. Apple HRV is a
    // different measure, so there is no fallback: the population stand-in
    // serves this load and nothing is cached, so the next load tries again.
    console.warn('[Readiness] HRV baseline: Garmin history unavailable, using the stand-in for this load');
    setBaselineSource('hrv', false);
    return computeHRVBaseline([]);
  }
  const history = Object.values(excludeIllnessDays({ ...fromSource, ...manual }, episodes, localDateStr()));
  const baseline = computeHRVBaseline(history);
  console.log('[Readiness] HRV baseline computed:', baseline, 'ms from', history.length, 'days');

  const personal = history.length >= BASELINE_MIN_DAYS;
  setBaselineSource('hrv', personal);
  await saveHRVBaselineCache(baseline, personal);
  return baseline;
}

// ─── Cycle-phase baselines ────────────────────────────────────────────────────
// Only for users with cycle tracking on. Reads ~4 cycles of nightly HRV and
// resting HR and compares today with the same phase of earlier cycles (see
// utils/cycleBaselines.ts). Cached for the calendar day: the phase changes at
// most once a day and the history it reads doesn't change within one.

const PHASE_BASELINE_CACHE_KEY = '@readiness/phase_baseline_v1';
const PHASE_HISTORY_DAYS = 120;

async function getPhaseBaselines(hrvAllMonth: number, rhrAllMonth: number): Promise<PhaseBaselineResult | null> {
  const snap = await loadCycleSnapshot();
  const last = snap ? latestEntry(snap.starts) : null;
  if (!snap || !last) return null;

  const today = localDateStr();
  const todayPhase = computeCycleState(last, snap.settings).phase;
  const cacheTag = `${today}|${snap.starts.join(',')}|${snap.settings.periodLengthDays}|${hrvAllMonth}|${rhrAllMonth}`;
  try {
    const raw = await AsyncStorage.getItem(PHASE_BASELINE_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { tag: string; result: PhaseBaselineResult };
      if (cached.tag === cacheTag) return cached.result;
    }
  } catch { /* recompute */ }

  const [hrvByDay, rhrByDay] = await Promise.all([
    withTimeout(fetchHRVByDay(PHASE_HISTORY_DAYS), 8_000, {} as Record<string, number>),
    withTimeout(fetchRHRByDay(PHASE_HISTORY_DAYS), 8_000, {} as Record<string, number>),
  ]);
  const result = computePhaseBaselines({
    hrvByDay, rhrByDay,
    periodStarts:     snap.starts,
    todayPhase,
    periodLengthDays: snap.settings.periodLengthDays,
    hrvBaseline:      hrvAllMonth,
    rhrBaseline:      rhrAllMonth,
  });
  AsyncStorage.setItem(PHASE_BASELINE_CACHE_KEY, JSON.stringify({ tag: cacheTag, result })).catch(() => {});
  return result;
}

// ─── Mock data (Expo Go / web dev) ────────────────────────────────────────────

const MOCK_HEALTH_DATA: HealthData = {
  date: localDateStr(),
  hrv: 58,
  restingHeartRate: 52,
  sleepDuration: 427,
  deepSleep: 82,
  remSleep: 98,
  sleepEfficiency: 88,
  stressScore: null,
  daytimeAvgHR: 67,   // ~15 bpm above a 52 bpm RHR — mild elevation for demo
  // Activity context (yesterday) — display-only, does not feed readiness score
  steps:           8432,  // a reasonably active day
  activeCalories:  387,
  exerciseMinutes: 34,
};

const MOCK_RHR_BASELINE = 54;
const MOCK_HRV_BASELINE = 62; // slightly above the mock HRV of 58 — normal healthy state
const FORCE_MOCK_HEALTHKIT_ON_IOS26 =
  (process.env.EXPO_PUBLIC_FORCE_MOCK_HEALTHKIT_ON_IOS26 ?? 'false').toLowerCase() === 'true';

// ─── Throttle ─────────────────────────────────────────────────────────────────
// Silent AppState refreshes are suppressed if data was fetched within this window.
const MIN_SILENT_REFETCH_MS = 5 * 60 * 1000; // 5 minutes

// ─── Timeout race helper ──────────────────────────────────────────────────────
// HealthKit callbacks can silently hang (permission edge-cases, simulator quirks,
// background-app-refresh disabled, etc.). Wrap any async HealthKit call so we
// always get a fallback value rather than leaving isLoading=true forever.
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      const id = setTimeout(() => {
        console.warn(`[Readiness] HealthKit query timed out after ${ms}ms — using fallback:`, fallback);
        resolve(fallback);
      }, ms);
      // If the real promise wins, clear the timeout to avoid a dangling timer
      promise.then(() => clearTimeout(id)).catch(() => clearTimeout(id));
    }),
  ]);
}

const HEALTH_DENIED_MESSAGE = 'Health access denied. Go to Settings → Privacy & Security → Health → Readiness to grant access.';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHealthData(): UseHealthDataReturn {
  const [readiness,     setReadiness]     = useState<ReadinessResult | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [rhrBaseline,   setRhrBaseline]   = useState(60);
  const [hrvBaseline,   setHrvBaseline]   = useState(55);

  // Tracks when HealthKit was last queried — used to throttle AppState refreshes.
  const lastFetchAt = useRef<number>(0);
  const [loadedAt, setLoadedAt] = useState(0);

  // Lets a load that gave up waiting on the Health Access sheet run again
  // once iOS answers, without the callback depending on itself.
  const loadRef = useRef<((mode?: LoadMode) => Promise<void>) | null>(null);

  const load = useCallback(async (mode: LoadMode = 'initial') => {
    console.log(`[Readiness] load() called — mode: ${mode}, iOS: ${Platform.OS === 'ios'}, hk: ${isHealthKitAvailable()}`);
    if (mode === 'initial')  setIsLoading(true);
    if (mode === 'refresh')  setIsRefreshing(true);
    // 'silent' — no spinner state changes at all
    setError(null);

    try {
      let healthData: HealthData | null = null;
      // Mock readings (Expo Go, web, or the iOS 26 kill switch) are for the
      // screen only: never saved as a history row or shown on the widget.
      let isDemoData = false;
      let baseline = 60;

      let hrvBase = 55;

      // iOS 26 was previously forced onto mock data because early beta builds
      // caused HealthKit native callback instability. Keep a kill switch so we
      // can force the old behavior if needed, but allow production/TestFlight
      // builds to exercise real HealthKit again.
      const iosVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
      const isIOS26Plus = Platform.OS === 'ios' && iosVersion >= 26;

      if (isIOS26Plus && FORCE_MOCK_HEALTHKIT_ON_IOS26) {
        console.warn('[Readiness] iOS 26 mock-mode enabled via env — using mock data');
        setHasPermission(true);
        healthData = MOCK_HEALTH_DATA;
        isDemoData = true;
        baseline   = MOCK_RHR_BASELINE;
        hrvBase    = MOCK_HRV_BASELINE;
      } else if (Platform.OS === 'ios' && isHealthKitAvailable()) {
        // Extra try/catch guards against native NSExceptions that bypass JS catch.
        try {
          console.log('[Readiness] Requesting HealthKit permissions…');
          // On a fresh install iOS shows the Health Access sheet here and only
          // calls back once it closes. Reading that sheet can take longer than
          // the timeout, so a timeout means "no answer yet", not "denied".
          const request = requestHealthKitPermissions();
          const granted = await withTimeout<boolean | null>(request, 10_000, null);
          console.log('[Readiness] HealthKit permissions result:', granted);
          setHasPermission(granted === true);

          if (granted) {
            // Unknown until each baseline loads: if one times out and the
            // stand-in is used, it must not be worded as the user's own.
            setBaselineSource('rhr', undefined);
            setBaselineSource('hrv', undefined);
            // The Garmin flag is a local mirror of the connection on Supabase
            // and can go stale (a disconnect on another phone, a reinstall).
            // Refresh it once per load before anything reads it; a slow or
            // failed read keeps the cached flag and never holds up the score.
            await withTimeout(refreshGarminConnection().catch(() => null), 3_000, null);
            [healthData, baseline, hrvBase] = await Promise.all([
              withTimeout(fetchTodaysHealthData(),    12_000, null),
              withTimeout(getPersonalRHRBaseline(),    8_000, 60),
              withTimeout(getPersonalHRVBaseline(),    8_000, 55),
            ]);
          } else if (granted === false) {
            setError(HEALTH_DENIED_MESSAGE);
          } else {
            request.then(ok => { if (ok) loadRef.current?.('silent'); else setError(HEALTH_DENIED_MESSAGE); });
          }
        } catch (hkErr: any) {
          console.warn('[Readiness] HealthKit block threw unexpectedly:', hkErr?.message ?? hkErr);
          // healthData stays null, baselines stay at defaults — score will be 50
        }
      } else if (Platform.OS === 'ios' && !__DEV__) {
        // A store or TestFlight build without a working Apple Health module.
        // Showing demo numbers here is what hid the SDK 58 breakage, so say so.
        throw new Error(`Apple Health could not be loaded (${healthKitLoadReason()}). Please update the app or contact support.`);
      } else {
        // Expo Go / web: use mock data
        setHasPermission(true);
        healthData = MOCK_HEALTH_DATA;
        isDemoData = true;
        baseline   = MOCK_RHR_BASELINE;
        hrvBase    = MOCK_HRV_BASELINE;
      }

      // Cycle-phase correction: with two or more logged cycles, today is
      // compared with the same phase of earlier cycles rather than the whole
      // month. Never blocks the score; any failure falls back to all-month.
      const cycle = Platform.OS === 'ios' && isHealthKitAvailable()
        ? await withTimeout(getPhaseBaselines(hrvBase, baseline).catch(() => null), 10_000, null)
        : null;
      const scoringHrvBase = cycle?.hrv ?? hrvBase;
      const scoringRhrBase = cycle?.rhr ?? baseline;

      setRhrBaseline(scoringRhrBase);
      setHrvBaseline(scoringHrvBase);

      // ── Garmin overlay ──────────────────────────────────────────────────
      // Garmin wins for what it has: HRV (otherwise typed in by hand for
      // Garmin users), resting heart rate, sleep and stress. Steps and the
      // rest stay with Apple Health. Also builds today's data from Garmin
      // alone when Apple Health gave nothing.
      if (!isDemoData && await isGarminConnected()) {
        const garminDays = await withTimeout(fetchGarminDays(2).catch(() => null), 8_000, null);
        if (garminDays) healthData = overlayGarminToday(healthData, garminDays, localDateStr());
      }

      if (healthData) {
        // ── Manual HRV overlay ──────────────────────────────────────────────
        // A value the user typed in for today wins over whatever HealthKit
        // has: they entered it on purpose, usually because the automatic one
        // is missing or wrong (a Garmin or Polar reading that never reaches
        // Apple Health). The entry is keyed by date, so it never carries over.
        let mergedData = healthData;
        const manualHrv = await loadManualHRV();
        if (manualHrv !== null) {
          mergedData = { ...healthData, hrv: manualHrv, hrvSource: 'manual' };
          console.log('[Readiness] Using manual HRV:', manualHrv, 'ms', healthData.hrv !== null ? `(over HealthKit ${healthData.hrv} ms)` : '');
        }

        const result = calculateReadiness(mergedData, scoringHrvBase, scoringRhrBase);
        const corrected = scoringHrvBase !== hrvBase || scoringRhrBase !== baseline;
        console.log(`[Readiness] ${mode} fetch | RHR baseline: ${scoringRhrBase} bpm | HRV baseline: ${scoringHrvBase} ms${corrected ? ` (phase-adjusted from ${hrvBase}/${baseline})` : ''} | score → ${result.score}`);
        setReadiness(result);
        setScoreSnapshot({
          readiness:           result,
          explanation:         explainReadiness(mergedData, scoringHrvBase, scoringRhrBase),
          hrvBaseline:         scoringHrvBase,
          rhrBaseline:         scoringRhrBase,
          hrvBaselineAllMonth: hrvBase,
          rhrBaselineAllMonth: baseline,
          cycle,
          uncorrectedScore:    corrected ? calculateReadiness(mergedData, hrvBase, baseline).score : null,
          computedAt:          Date.now(),
        });

        // ── Fire-and-forget Supabase sync ──────────────────────────────────
        // Save today's score so history and weekly-report can read it.
        // Non-blocking — any failure is swallowed; HealthKit remains the
        // source of truth and the app works fine without a network.
        supabase.auth.getUser()
          .then(({ data }) => {
            // A score computed with no overnight signal at all is the
            // population default, not a measurement. The home screen no
            // longer shows it, so it must not become a history row either.
            if (data.user && !result.dataQuality.isInsufficient && !isDemoData) {
              upsertTodayScore(result, data.user.id).catch(err =>
                console.warn('[Readiness] Supabase sync failed (non-fatal):', err.message),
              );
            }
          })
          .catch(err =>
            // IMPORTANT: must catch here — an unhandled rejection on iOS
            // production builds propagates to reportFatalException → abort()
            console.warn('[Readiness] getUser failed (non-fatal):', err?.message ?? err),
          );

        // ── Fire-and-forget widget update ──────────────────────────────────
        // Push the new score to the iOS App Group so the home screen widget
        // reflects the latest result without a network round-trip.
        // The illness cap is read first so the widget never shows an uncapped
        // training call for the seconds before the Today hook catches up.
        if (!isDemoData) isIllnessCapStored()
          .catch(() => false)
          .then(cap => {
            setWidgetIllnessCap(cap);
            pushScoreToWidget(result);
          })
          .catch(e => console.warn('[Readiness] pushScoreToWidget failed (non-fatal):', e));
      }
    } catch (err: any) {
      // Silent background refreshes swallow errors — don't disrupt the UI
      // for a transient HealthKit hiccup when the user isn't watching.
      if (mode !== 'silent') {
        setError(err.message ?? 'Failed to load health data.');
      } else {
        console.log('[Readiness] Silent refresh error (suppressed):', err.message);
      }
    } finally {
      console.log(`[Readiness] load() finally — clearing isLoading/isRefreshing (mode: ${mode})`);
      setIsLoading(false);
      setIsRefreshing(false);
      lastFetchAt.current = Date.now();
      setLoadedAt(lastFetchAt.current);
    }
  }, []);

  // ── Nuclear fallback — guarantee isLoading never stays true forever ─────────
  // On iOS 26 beta, HealthKit callbacks and/or setTimeout can silently stall.
  // This hard wall ensures the app UI always appears within 20 seconds.
  //
  // Depends on isLoading so the timer is torn down the moment loading finishes.
  // Previously it ran once on mount and always fired at 20s, logging a fallback
  // warning even on healthy launches that had rendered long before.
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      console.warn('[Readiness] ☢️  Nuclear fallback — forcing isLoading=false after 20s');
      setIsLoading(false);
    }, 20_000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    load('initial');
  }, [load]);

  // ── Manual HRV setter ────────────────────────────────────────────────────────
  // Stores (or clears) a manually entered HRV for today, then re-runs the score.
  const setManualHRV = useCallback(async (value: number | null) => {
    if (value === null) {
      await removeManualHRV();
    } else {
      await saveManualHRV(Math.round(value));
    }
    await load('silent');
  }, [load]);

  // ── AppState listener — re-fetch silently when app returns to foreground ────
  // Throttled to MIN_SILENT_REFETCH_MS so rapid background/foreground cycles
  // don't hammer HealthKit (each call is a native bridge round-trip).
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const age = Date.now() - lastFetchAt.current;
        if (age >= MIN_SILENT_REFETCH_MS) {
          console.log(`[Readiness] App foregrounded after ${Math.round(age / 60000)}m — silent refresh`);
          load('silent');
        } else {
          console.log(`[Readiness] App foregrounded — skipping refresh (last fetch ${Math.round(age / 1000)}s ago)`);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [load]);

  useEffect(() => { loadRef.current = load; }, [load]);

  return {
    readiness,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load('refresh'),
    hasPermission,
    rhrBaseline,
    hrvBaseline,
    setManualHRV,
    loadedAt,
  };
}
