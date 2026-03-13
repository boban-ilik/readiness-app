import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestHealthKitPermissions,
  fetchTodaysHealthData,
  fetchRHRHistory,
  fetchHRVHistory,
  isHealthKitAvailable,
} from '@services/healthkit';
import { calculateReadiness, type ReadinessResult } from '@utils/readiness';
import { computeRHRBaseline, computeHRVBaseline } from '@utils/index';
import type { HealthData } from '@types/index';
import { supabase } from '@services/supabase';
import { upsertTodayScore } from '@services/scoreSync';
import { pushScoreToWidget } from '@services/widgetBridge';

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

interface BaselineCache {
  value:      number;
  computedAt: number; // unix ms
}

async function loadCachedBaseline(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(BASELINE_CACHE_KEY);
    if (!raw) return null;
    const cache: BaselineCache = JSON.parse(raw);
    if (Date.now() - cache.computedAt > BASELINE_TTL_MS) return null; // stale
    return cache.value;
  } catch {
    return null;
  }
}

async function saveBaselineCache(value: number): Promise<void> {
  const cache: BaselineCache = { value, computedAt: Date.now() };
  await AsyncStorage.setItem(BASELINE_CACHE_KEY, JSON.stringify(cache));
}

export async function getPersonalRHRBaseline(): Promise<number> {
  const cached = await loadCachedBaseline();
  if (cached !== null) return cached;

  const history  = await fetchRHRHistory(30);
  const baseline = computeRHRBaseline(history);
  console.log('[Readiness] RHR baseline computed:', baseline, 'bpm from', history.length, 'days');

  await saveBaselineCache(baseline);
  return baseline;
}

// ─── HRV baseline cache ───────────────────────────────────────────────────────
// Same 24-hour TTL as the RHR baseline — HRV data doesn't change mid-day.

const HRV_BASELINE_CACHE_KEY = '@readiness/hrv_baseline';

async function loadCachedHRVBaseline(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(HRV_BASELINE_CACHE_KEY);
    if (!raw) return null;
    const cache: BaselineCache = JSON.parse(raw);
    if (Date.now() - cache.computedAt > BASELINE_TTL_MS) return null; // stale
    return cache.value;
  } catch {
    return null;
  }
}

async function saveHRVBaselineCache(value: number): Promise<void> {
  const cache: BaselineCache = { value, computedAt: Date.now() };
  await AsyncStorage.setItem(HRV_BASELINE_CACHE_KEY, JSON.stringify(cache));
}

export async function getPersonalHRVBaseline(): Promise<number> {
  const cached = await loadCachedHRVBaseline();
  if (cached !== null) return cached;

  const history  = await fetchHRVHistory(30);
  const baseline = computeHRVBaseline(history);
  console.log('[Readiness] HRV baseline computed:', baseline, 'ms from', history.length, 'days');

  await saveHRVBaselineCache(baseline);
  return baseline;
}

// ─── Mock data (Expo Go / web dev) ────────────────────────────────────────────

const MOCK_HEALTH_DATA: HealthData = {
  date: new Date().toISOString().split('T')[0],
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

// ─── Throttle ─────────────────────────────────────────────────────────────────
// Silent AppState refreshes are suppressed if data was fetched within this window.
const MIN_SILENT_REFETCH_MS = 5 * 60 * 1000; // 5 minutes

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

  const load = useCallback(async (mode: LoadMode = 'initial') => {
    if (mode === 'initial')  setIsLoading(true);
    if (mode === 'refresh')  setIsRefreshing(true);
    // 'silent' — no spinner state changes at all
    setError(null);

    try {
      let healthData: HealthData | null = null;
      let baseline = 60;

      let hrvBase = 55;

      if (Platform.OS === 'ios' && isHealthKitAvailable()) {
        const granted = await requestHealthKitPermissions();
        setHasPermission(granted);

        if (granted) {
          [healthData, baseline, hrvBase] = await Promise.all([
            fetchTodaysHealthData(),
            getPersonalRHRBaseline(),
            getPersonalHRVBaseline(),
          ]);
        } else {
          setError('Health access denied. Go to Settings → Privacy & Security → Health → Readiness to grant access.');
        }
      } else {
        // Expo Go / web — use mock data
        setHasPermission(true);
        healthData = MOCK_HEALTH_DATA;
        baseline   = MOCK_RHR_BASELINE;
        hrvBase    = MOCK_HRV_BASELINE;
      }

      setRhrBaseline(baseline);
      setHrvBaseline(hrvBase);

      if (healthData) {
        // ── Manual HRV overlay ──────────────────────────────────────────────
        // When HealthKit didn't return HRV (non-Apple Watch devices), check
        // whether the user entered it manually for today.
        let mergedData = healthData;
        if (healthData.hrv === null) {
          const manualHrv = await loadManualHRV();
          if (manualHrv !== null) {
            mergedData = { ...healthData, hrv: manualHrv, hrvSource: 'manual' };
            console.log('[Readiness] Using manual HRV:', manualHrv, 'ms');
          }
        }

        const result = calculateReadiness(mergedData, hrvBase, baseline);
        console.log(`[Readiness] ${mode} fetch | RHR baseline: ${baseline} bpm | HRV baseline: ${hrvBase} ms | score → ${result.score}`);
        setReadiness(result);

        // ── Fire-and-forget Supabase sync ──────────────────────────────────
        // Save today's score so history and weekly-report can read it.
        // Non-blocking — any failure is swallowed; HealthKit remains the
        // source of truth and the app works fine without a network.
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            upsertTodayScore(result, data.user.id).catch(err =>
              console.warn('[Readiness] Supabase sync failed (non-fatal):', err.message),
            );
          }
        });

        // ── Fire-and-forget widget update ──────────────────────────────────
        // Push the new score to the iOS App Group so the home screen widget
        // reflects the latest result without a network round-trip.
        pushScoreToWidget(result);
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
      setIsLoading(false);
      setIsRefreshing(false);
      lastFetchAt.current = Date.now();
    }
  }, []);

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
  };
}
