/**
 * Water: read today's intake from Apple Health, save taps to it, and keep the
 * user's unit and target.
 *
 * Water is asked for only when the user first taps the water button, the same
 * way menstrual flow is asked for only when cycle tracking is switched on:
 * calling initHealthKit again prompts only for types still undetermined.
 */

import { healthKitModule } from '@services/healthKitModule';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TARGET_LITRES, clampTarget, type WaterUnit } from '@utils/water';

// Loaded once in healthKitModule; null on Android, web and Expo Go.
const AppleHealthKit: any = healthKitModule();

export const WATER_UNIT_KEY   = '@readiness/water_unit';
export const WATER_TARGET_KEY = '@readiness/water_target_l';
const WATER_ASKED_KEY         = '@readiness/water_permission_asked';

export function isWaterAvailable(): boolean {
  return AppleHealthKit !== null;
}

/** Read + write access to Water. Resolves false if HealthKit errors. */
export async function requestWaterPermission(): Promise<boolean> {
  if (!AppleHealthKit) return false;
  return new Promise((resolve) => {
    try {
      AppleHealthKit.initHealthKit(
        { permissions: { read: ['Water'], write: ['Water'] } },
        (error: string) => {
          AsyncStorage.setItem(WATER_ASKED_KEY, '1').catch(() => {});
          resolve(!error);
        },
      );
    } catch {
      resolve(false);
    }
  });
}

export async function hasAskedWaterPermission(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(WATER_ASKED_KEY)) === '1'; } catch { return false; }
}

/** Litres of water logged today (since local midnight) by any app. 0 on failure or no access. */
export async function fetchTodayWaterLitres(): Promise<number> {
  if (!AppleHealthKit) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return new Promise((resolve) => {
    try {
      AppleHealthKit.getWaterSamples(
        { startDate: start.toISOString(), endDate: new Date().toISOString() },
        (err: string, results: Array<{ value: number }>) => {
          if (err || !Array.isArray(results)) return resolve(0);
          resolve(results.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0));
        },
      );
    } catch {
      resolve(0);
    }
  });
}

/** Save one drink to Apple Health. Rejects when HealthKit refuses (usually no write access). */
export async function saveWaterLitres(litres: number, at: Date = new Date()): Promise<void> {
  if (!AppleHealthKit) throw new Error('Apple Health is not available');
  return new Promise((resolve, reject) => {
    AppleHealthKit.saveWater({ value: litres, date: at.toISOString() }, (err: string) => {
      if (err) reject(new Error(String(err)));
      else resolve();
    });
  });
}

export async function loadWaterPrefs(): Promise<{ unit: WaterUnit; targetLitres: number }> {
  try {
    const [u, t] = await Promise.all([AsyncStorage.getItem(WATER_UNIT_KEY), AsyncStorage.getItem(WATER_TARGET_KEY)]);
    const target = t ? parseFloat(t) : NaN;
    return {
      unit:         u === 'floz' ? 'floz' : 'l',
      targetLitres: Number.isFinite(target) ? clampTarget(target) : DEFAULT_TARGET_LITRES,
    };
  } catch {
    return { unit: 'l', targetLitres: DEFAULT_TARGET_LITRES };
  }
}

export async function saveWaterUnit(unit: WaterUnit): Promise<void> {
  await AsyncStorage.setItem(WATER_UNIT_KEY, unit);
}

export async function saveWaterTarget(litres: number): Promise<void> {
  await AsyncStorage.setItem(WATER_TARGET_KEY, String(clampTarget(litres)));
}

/** What the coach and briefing are told. Null until water has been asked for. */
export async function waterContext(): Promise<{ todayLitres: number; targetLitres: number; localHour: number } | null> {
  if (!AppleHealthKit || !(await hasAskedWaterPermission())) return null;
  const [todayLitres, prefs] = await Promise.all([fetchTodayWaterLitres(), loadWaterPrefs()]);
  return {
    todayLitres:  Math.round(todayLitres * 100) / 100,
    targetLitres: prefs.targetLitres,
    localHour:    new Date().getHours(),
  };
}
