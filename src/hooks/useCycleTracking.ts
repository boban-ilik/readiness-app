/**
 * useCycleTracking
 *
 * Manages menstrual cycle settings and period log entries.
 * Only relevant for users who have set biological sex = female and enabled tracking.
 *
 * Returns:
 *   settings     — { enabled, cycleLengthDays, periodLengthDays }
 *   entries      — period starts logged here plus read from Apple Health, merged
 *   cycleState   — current phase, day of cycle, days until next period
 *   isLoading    — true while AsyncStorage is being read
 *   logToday     — log today as a period start
 *   updateSettings — persist a partial settings update
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_CYCLE_SETTINGS,
  CYCLE_ENABLED_KEY,
  CYCLE_LENGTH_KEY,
  CYCLE_PERIOD_KEY,
  CYCLE_ENTRIES_KEY,
  computeCycleState,
  latestEntry,
  logPeriodStart,
  parseEntries,
  invalidateHealthPeriodStarts,
  loadCycleSnapshot,
  type CycleSettings,
  type CycleState,
} from '@services/cycleTracking';
import { mergePeriodStarts } from '@utils/cyclePhase';
import { requestMenstrualPermission } from '@services/menstrualImport';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CycleTrackingReturn {
  settings:       CycleSettings;
  /** Every known period start: logged here plus read from Apple Health, merged */
  entries:        string[];
  /** How many of `entries` came only from Apple Health */
  fromHealth:     number;
  /** Current cycle state, or null when no period has been logged yet. */
  cycleState:     CycleState | null;
  isLoading:      boolean;
  /** Log today as a period start date. */
  logToday:       () => Promise<void>;
  /** Persist partial settings changes and re-derive cycle state. */
  updateSettings: (updates: Partial<CycleSettings>) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCycleTracking(): CycleTrackingReturn {
  const [settings,  setSettings]  = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);
  const [entries,   setEntries]   = useState<string[]>([]);   // logged in this app
  const [healthStarts, setHealthStarts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load from storage ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [enabled, cycleLen, periodLen, rawEntries] = await AsyncStorage.multiGet([
        CYCLE_ENABLED_KEY,
        CYCLE_LENGTH_KEY,
        CYCLE_PERIOD_KEY,
        CYCLE_ENTRIES_KEY,
      ]);

      setSettings({
        enabled:          (enabled[1]   ?? 'false') === 'true',
        cycleLengthDays:  parseInt(cycleLen[1]  ?? '28', 10),
        periodLengthDays: parseInt(periodLen[1] ?? '5',  10),
      });
      setEntries(parseEntries(rawEntries[1]));
      setIsLoading(false);
    })();
  }, []);

  // ── Apple Health period starts (only while tracking is on) ─────────────────
  const loadHealthStarts = useCallback(async () => {
    const snap = await loadCycleSnapshot();
    if (!snap) { setHealthStarts([]); return; }
    // The snapshot is already manual + Health merged; merging it again with
    // `entries` below is harmless and lets a period logged in the app show
    // immediately without another Health read.
    setHealthStarts(snap.starts);
  }, []);

  useEffect(() => {
    if (!isLoading && settings.enabled) loadHealthStarts();
  }, [isLoading, settings.enabled, loadHealthStarts]);

  const allStarts  = mergePeriodStarts(entries, healthStarts);
  const manualSet  = new Set(mergePeriodStarts(entries));
  const fromHealth = allStarts.filter(d => !manualSet.has(d)).length;

  // ── Derived cycle state ────────────────────────────────────────────────────
  const latest     = latestEntry(allStarts);
  const cycleState = latest ? computeCycleState(latest, settings) : null;

  // ── Log today ──────────────────────────────────────────────────────────────
  const logToday = useCallback(async () => {
    const updated = logPeriodStart(entries);
    setEntries(updated);
    await AsyncStorage.setItem(CYCLE_ENTRIES_KEY, JSON.stringify(updated));
  }, [entries]);

  // ── Update settings ────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates: Partial<CycleSettings>) => {
    const next = { ...settings, ...updates };
    const turningOn = next.enabled && !settings.enabled;
    setSettings(next);
    await AsyncStorage.multiSet([
      [CYCLE_ENABLED_KEY, next.enabled          ? 'true' : 'false'],
      [CYCLE_LENGTH_KEY,  String(next.cycleLengthDays)],
      [CYCLE_PERIOD_KEY,  String(next.periodLengthDays)],
    ]);
    if (turningOn) {
      // Ask for Apple Health cycle access at the moment the user opts in,
      // not at launch, so nobody who doesn't track a cycle sees the prompt.
      await requestMenstrualPermission();
      invalidateHealthPeriodStarts();
      await loadHealthStarts();
    }
  }, [settings, loadHealthStarts]);

  return { settings, entries: allStarts, fromHealth, cycleState, isLoading, logToday, updateSettings };
}
