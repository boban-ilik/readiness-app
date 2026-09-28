/**
 * illnessEpisode
 *
 * Local store for "back from illness" tracking (see utils/illnessRecovery.ts).
 * Episodes stay on the device: they hold nothing the user hasn't already
 * tagged, and the baseline code needs them offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRHRByDay, fetchHRVByDay } from '@services/healthkit';
import { computeRHRBaseline, computeHRVBaseline, localDateStr } from '@utils/index';
import {
  excludeIllnessDays, evaluateRecovery, type IllnessEpisode, type RecoveryStatus,
} from '@utils/illnessRecovery';
import { track } from '@services/analytics';

export const ILLNESS_EPISODES_KEY     = '@readiness/illness_episodes_v1';
export const ILLNESS_NUDGE_DISMISSED_KEY = '@readiness/illness_nudge_dismissed';

const KEEP_DAYS          = 90;  // older episodes no longer touch the 30-day baseline
const USUAL_WINDOW_DAYS  = 30;
const USUAL_MIN_DAYS     = 7;   // same minimum as the score's own baselines
const NUDGE_SNOOZE_DAYS  = 7;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

export async function loadIllnessEpisodes(): Promise<IllnessEpisode[]> {
  try {
    const raw = await AsyncStorage.getItem(ILLNESS_EPISODES_KEY);
    return raw ? (JSON.parse(raw) as IllnessEpisode[]) : [];
  } catch {
    return [];
  }
}

async function saveEpisodes(episodes: IllnessEpisode[]): Promise<void> {
  const cutoff = daysAgo(KEEP_DAYS);
  const kept = episodes.filter(e => (e.endedDate ?? e.recoveredDate ?? '9999') >= cutoff);
  await AsyncStorage.setItem(ILLNESS_EPISODES_KEY, JSON.stringify(kept));
}

/** The episode still being shown: not ended by the user or by the "back" card. */
export function activeEpisode(episodes: IllnessEpisode[]): IllnessEpisode | null {
  return episodes.find(e => !e.endedDate) ?? null;
}

/**
 * The user's usual resting HR and HRV before `before` (exclusive), from the
 * last 30 days minus earlier illness, computed the same way as the score's
 * baselines. Null when the watch has recorded fewer than 7 days, so the app
 * never compares against a population default and calls it "your usual".
 */
export async function usualBefore(before: string, episodes: IllnessEpisode[]): Promise<{ rhr: number | null; hrv: number | null }> {
  const [rhrByDay, hrvByDay] = await Promise.all([
    fetchRHRByDay(USUAL_WINDOW_DAYS + 1),
    fetchHRVByDay(USUAL_WINDOW_DAYS + 1),
  ]);
  const pick = (byDay: Record<string, number>) =>
    Object.entries(excludeIllnessDays(byDay, episodes, before))
      .filter(([d]) => d < before)
      .map(([, v]) => v);
  const rhr = pick(rhrByDay);
  const hrv = pick(hrvByDay);
  return {
    rhr: rhr.length >= USUAL_MIN_DAYS ? computeRHRBaseline(rhr) : null,
    hrv: hrv.length >= USUAL_MIN_DAYS ? computeHRVBaseline(hrv) : null,
  };
}

/**
 * Start tracking from today. No-op when an episode is already running, so
 * tagging Sick on several days keeps the first day and its baseline.
 */
export async function startIllnessEpisode(source: IllnessEpisode['source']): Promise<{ episode: IllnessEpisode; created: boolean }> {
  const episodes = await loadIllnessEpisodes();
  const running = activeEpisode(episodes);
  if (running) return { episode: running, created: false };

  const today = localDateStr();
  const baseline = await usualBefore(today, episodes);
  const ep: IllnessEpisode = { startDate: today, source, baseline };
  await saveEpisodes([...episodes, ep]);
  await clearBaselineCaches();
  return { episode: ep, created: true };
}

async function markIllnessRecovered(startDate: string, recoveredDate: string): Promise<void> {
  const episodes = await loadIllnessEpisodes();
  await saveEpisodes(episodes.map(e => (e.startDate === startDate && !e.recoveredDate ? { ...e, recoveredDate } : e)));
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * The running episode checked against HealthKit now, or null when there is
 * none. Records the recovery date the first time every reading is back. Used
 * by Today, the coach and the morning briefing so all three agree.
 */
export async function evaluateActiveIllness(): Promise<{ episode: IllnessEpisode; status: RecoveryStatus } | null> {
  const ep = activeEpisode(await loadIllnessEpisodes());
  if (!ep) return null;

  const today = localDateStr();
  const days  = daysBetween(ep.startDate, today) + 2;
  const empty: Record<string, number> = {};
  const [rhr, hrv] = await Promise.all([
    withTimeout(fetchRHRByDay(days), 8_000, empty),
    withTimeout(fetchHRVByDay(days), 8_000, empty),
  ]);
  const status = evaluateRecovery(ep, rhr, hrv, today);
  if (status.recoveredDate && !ep.recoveredDate) {
    await markIllnessRecovered(ep.startDate, status.recoveredDate);
    track('illness_recovered', { days: daysBetween(ep.startDate, status.recoveredDate) });
  }
  return { episode: { ...ep, recoveredDate: status.recoveredDate ?? undefined }, status };
}

/**
 * Whether training is held at Easy Day, from storage alone (no HealthKit), so
 * the widget's first update after launch is already capped. The hook's full
 * evaluation corrects it if the readings came back since.
 */
export async function isIllnessCapStored(): Promise<boolean> {
  const ep = activeEpisode(await loadIllnessEpisodes());
  return !!ep && !ep.recoveredDate;
}

/** Cheap tag for cache keys: changes when an episode starts, recovers or ends. */
export async function illnessCacheTag(): Promise<string> {
  const ep = activeEpisode(await loadIllnessEpisodes());
  return ep ? `${ep.startDate}:${ep.recoveredDate ?? ''}` : '';
}

/** "I'm better" or dismissing the "you're back" card. */
export async function endIllnessEpisode(startDate: string): Promise<void> {
  const episodes = await loadIllnessEpisodes();
  await saveEpisodes(episodes.map(e => (e.startDate === startDate && !e.endedDate ? { ...e, endedDate: localDateStr() } : e)));
  await clearBaselineCaches();
}

/**
 * Removing the Sick tag on the day it was added undoes the episode: that was
 * a mis-tap, not a recovery.
 */
export async function cancelIllnessEpisodeStartedOn(date: string): Promise<void> {
  const episodes = await loadIllnessEpisodes();
  const next = episodes.filter(e => !(e.startDate === date && !e.endedDate));
  if (next.length !== episodes.length) {
    await saveEpisodes(next);
    await clearBaselineCaches();
  }
}

export async function isIllnessNudgeSnoozed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ILLNESS_NUDGE_DISMISSED_KEY);
    return !!raw && raw > daysAgo(NUDGE_SNOOZE_DAYS);
  } catch {
    return false;
  }
}

export async function snoozeIllnessNudge(): Promise<void> {
  await AsyncStorage.setItem(ILLNESS_NUDGE_DISMISSED_KEY, localDateStr());
}

/** The score's 24h baseline caches, so sick days leave or rejoin them now. */
async function clearBaselineCaches(): Promise<void> {
  await AsyncStorage.multiRemove(['@readiness/rhr_baseline', '@readiness/hrv_baseline']).catch(() => {});
}
