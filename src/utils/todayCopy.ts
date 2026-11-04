/**
 * todayCopy — the wording under the Today screen's score ring.
 *
 * Greeting, the "last night" label, and the one-line detail under each
 * breakdown card live here rather than inside the 1,300-line screen, so the
 * copy can be unit-tested and the screen stays a view.
 */

import { isStandInBaseline, STRESS_ELEVATION_LOW, STRESS_ELEVATION_HIGH } from '@utils/readiness';
import type { HealthData } from '@/types/index';
import type { NoDataReason } from '@utils/noData';
import type { TodayActivity } from '@services/healthkit';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// What to tell the user depends on why Health returned nothing. Until the
// check finishes (reason null) the card keeps the original sync advice.
export const NO_DATA_COPY: Record<NoDataReason | 'checking', { eyebrow: string; body: string }> = {
  checking: {
    eyebrow: 'WAITING FOR YOUR FIRST SYNC',
    body:    'Wear your watch overnight and sync sleep or heart-rate data. Your readiness score and training recommendation will appear as soon as we have a usable signal.',
  },
  missed_night: {
    eyebrow: 'NO DATA FROM LAST NIGHT',
    body:    "Readiness has your earlier nights but nothing from last night yet. Open your watch's app so it syncs to Apple Health, then check again.",
  },
  no_wearable: {
    eyebrow: 'NO WATCH DATA IN APPLE HEALTH',
    body:    'Readiness can read Apple Health, but there is no heart-rate or sleep data from a watch in the last 30 days. Wear an Apple Watch overnight, or if you use another watch or ring, turn on Apple Health sharing in its app.',
  },
  no_health_access: {
    eyebrow: "READINESS CAN'T SEE APPLE HEALTH",
    body:    'Readiness found no Apple Health data at all, which usually means access is turned off. Open Settings > Health > Data Access & Devices > Readiness and set each item to Full Access, then check again.',
  },
};

// Returns a short "Last night · Mon, Mar 9" prefix for overnight metrics.
export function lastNightLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `Last night · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

// Build a human-readable detail line for the Recovery card.
export function buildRecoveryDetail(h: HealthData | null, baseline: number): string | undefined {
  if (!h) return undefined;
  const parts: string[] = [];
  // Always show HRV slot — dash makes the gap visible on the card itself
  if (h.hrv !== null) {
    const manualTag = h.hrvSource === 'manual' ? ' (manual)' : h.hrvSource === 'garmin' ? ' (Garmin)' : '';
    parts.push(`HRV ${h.hrv}ms${manualTag}`);
  } else {
    parts.push('HRV not recorded');
  }
  if (h.restingHeartRate !== null) {
    const delta = h.restingHeartRate - baseline;
    const sign  = delta > 0 ? '+' : '';
    parts.push(`RHR ${h.restingHeartRate}bpm (${sign}${delta} vs ${isStandInBaseline('rhr', baseline) ? `a typical ${baseline}` : `your ${baseline} avg`})`);
  }
  return `${lastNightLabel()} · ${parts.join(' · ')}`;
}

// Build a human-readable detail line for the Stress card.
// Prefers Garmin stress score; falls back to HRV proxy (same as the scoring algorithm).
export function buildStressDetail(h: HealthData | null, rhrBaseline: number, hrvBaseline: number): string | undefined {
  if (!h) return undefined;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const prefix = `Today · ${today}`;
  // Tier 1: Garmin stress score
  if (h.stressScore != null) {
    const label = h.stressScore <= 25 ? 'Low'
                : h.stressScore <= 50 ? 'Moderate'
                : h.stressScore <= 75 ? 'High'
                :                       'Very high';
    return `${prefix} · Stress index ${h.stressScore}/100 · ${label}`;
  }
  // Tier 2: HRV overnight proxy
  if (h.hrv != null) {
    const delta = Math.round(h.hrv - hrvBaseline);
    const sign  = delta >= 0 ? '+' : '';
    const trend = delta >= 5  ? 'Low stress'
                : delta >= -5 ? 'Typical'
                :               'Elevated stress';
    return `${prefix} · HRV ${h.hrv}ms (${sign}${delta} vs ${isStandInBaseline('hrv', hrvBaseline) ? `a typical ${hrvBaseline}ms` : `your ${hrvBaseline}ms baseline`}) · ${trend}`;
  }
  // Tier 3: Daytime HR elevation proxy (works for Garmin users without HRV sync)
  if (h.daytimeAvgHR != null) {
    const elevation = h.daytimeAvgHR - rhrBaseline;
    const sign      = elevation >= 0 ? '+' : '';
    const trend     = elevation <= STRESS_ELEVATION_LOW  ? 'Low stress'
                    : elevation <= STRESS_ELEVATION_HIGH ? 'Typical'
                    :                                      'Elevated';
    return `${prefix} · Daytime HR ${h.daytimeAvgHR}bpm (${sign}${elevation} vs ${rhrBaseline}bpm rest) · ${trend}`;
  }
  return `${prefix} · Sync your device to see stress data`;
}

// Build a human-readable detail line for the Activity card.
// Shows yesterday's completed numbers + today's in-progress totals side by side.
export function buildActivityDetail(h: HealthData | null, today: TodayActivity | null): string | undefined {
  if (!h) return undefined;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayLabel = yesterday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Yesterday row
  const yParts: string[] = [];
  if (h.steps != null)           yParts.push(`${h.steps.toLocaleString()} steps`);
  if (h.exerciseMinutes != null) yParts.push(`${h.exerciseMinutes}min`);
  if (h.activeCalories != null)  yParts.push(`${h.activeCalories} kcal`);
  const yLine = yParts.length > 0 ? yParts.join(' · ') : 'no data';

  // Today row — only show fields that have a value
  const tParts: string[] = [];
  if (today?.steps != null)           tParts.push(`${today.steps.toLocaleString()} steps`);
  if (today?.exerciseMinutes != null) tParts.push(`${today.exerciseMinutes}min`);
  if (today?.activeCalories != null)  tParts.push(`${today.activeCalories} kcal`);
  const tLine = tParts.length > 0 ? `Today so far · ${tParts.join(' · ')}` : null;

  return tLine
    ? `${dayLabel} · ${yLine}\n${tLine}`
    : `${dayLabel} · ${yLine}`;
}

// Build a human-readable detail line for the Sleep card.
export function buildSleepDetail(h: HealthData | null): string | undefined {
  if (!h) return undefined;
  // Without a recorded night the Sleep score is a neutral 50, not a
  // measurement; say so on the card instead of showing a bare 50.
  if (!h.sleepDuration) return 'No sleep recorded · counted as a neutral 50';
  const totalH = Math.floor(h.sleepDuration / 60);
  const totalM = h.sleepDuration % 60;
  const parts = [`${totalH}h ${totalM}m`];
  if (h.deepSleep)      parts.push(`Deep ${Math.floor(h.deepSleep / 60)}h ${h.deepSleep % 60}m`);
  if (h.remSleep)       parts.push(`REM ${h.remSleep}m`);
  if (h.sleepEfficiency) parts.push(`${h.sleepEfficiency}% eff`);
  return `${lastNightLabel()} · ${parts.join(' · ')}`;
}
