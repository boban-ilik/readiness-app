/**
 * breakdown.ts
 *
 * Builds a rich BreakdownDetail object for each readiness component
 * (Recovery, Sleep, Stress) from raw HealthData and scores.
 *
 * Used by BreakdownModal to display contextual metrics, interpretation,
 * and a same-day recommendation.
 *
 * PHASE 2: Replace interpretation + advice strings with a Claude API call
 * that receives the structured data and returns personalised narrative.
 */

import type { HealthData } from '../types/index';
import { colors } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricRow {
  label:  string;
  value:  string;
  sub?:   string;
  status: 'good' | 'ok' | 'poor' | 'neutral';
}

export interface BreakdownDetail {
  icon:            string;
  label:           string;
  weight:          string;      // "45%", "40%", "15%", "Context · not scored"
  dateContext?:    string;      // e.g. "Yesterday · Monday, Mar 9" — shown in modal header
  score:           number;
  statusLabel:     string;      // "Optimal", "Good", "Moderate", "Reduced", "Low"
  statusColor:     string;
  metrics:         MetricRow[];
  interpretation:  string;
  advice:          string;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** "Last night · Mon, Mar 9" — used by overnight metrics (Recovery, Sleep). */
function lastNightContext(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `Last night · ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

/** "Today · Tue, Mar 10" — used by real-time metrics (Stress). */
function todayContext(): string {
  const d = new Date();
  return `Today · ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

function scoreStatus(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Optimal',  color: colors.score.optimal  };
  if (score >= 65) return { label: 'Good',     color: colors.score.good     };
  if (score >= 50) return { label: 'Moderate', color: colors.score.fair     };
  if (score >= 35) return { label: 'Reduced',  color: colors.score.poor     };
  return                   { label: 'Low',     color: colors.score.critical };
}

function fmtDur(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Recovery ─────────────────────────────────────────────────────────────────

function buildRecovery(
  score:       number,
  h:           HealthData | null,
  rhrBaseline: number,
  hrvBaseline: number,
): BreakdownDetail {
  const { label: statusLabel, color: statusColor } = scoreStatus(score);
  const metrics: MetricRow[] = [];

  const rhr   = h?.restingHeartRate ?? null;
  const hrv   = h?.hrv ?? null;
  const sleep = h?.sleepDuration ?? null;

  // ── Metric 1: RHR vs personal baseline ─────────────────────────────────────
  if (rhr != null) {
    const delta = rhr - rhrBaseline;
    const sign  = delta > 0 ? '+' : '';
    const sub   = delta <= -3
      ? `${Math.abs(delta)} bpm below your norm — heart is working less at rest, a strong recovery sign`
      : delta <= 2
      ? `Within 2 bpm of your ${rhrBaseline} bpm baseline — normal overnight recovery`
      : `${sign}${delta} bpm above your ${rhrBaseline} bpm baseline — heart is still working to clear yesterday's load`;
    metrics.push({
      label:  'Resting Heart Rate',
      value:  `${rhr} bpm`,
      sub,
      status: delta <= -2 ? 'good' : delta <= 3 ? 'ok' : 'poor',
    });
  }

  // ── Metric 2: HRV vs personal baseline ─────────────────────────────────────
  const isManualHrv = h?.hrvSource === 'manual';
  if (hrv != null) {
    const delta = Math.round(hrv - hrvBaseline);
    const sign  = delta >= 0 ? '+' : '';
    const contextSuffix = isManualHrv
      ? ' · Manually entered — tap "Update heart rate variability" below to change'
      : '';
    const sub = delta >= 5
      ? `${sign}${delta} ms above your ${hrvBaseline} ms baseline — nervous system is flexible and recovered${contextSuffix}`
      : delta >= -5
      ? `Within 5 ms of your ${hrvBaseline} ms baseline — typical autonomic state${contextSuffix}`
      : `${delta} ms below your ${hrvBaseline} ms baseline — nervous system is under load, a sign of fatigue or stress${contextSuffix}`;
    metrics.push({
      label:  isManualHrv ? 'Heart Rate Variability (manual)' : 'Heart Rate Variability',
      value:  `${hrv} ms`,
      sub,
      status: delta >= 3 ? 'good' : delta >= -5 ? 'ok' : 'poor',
    });
  } else {
    // HRV not available — show explicitly so the user understands why Recovery
    // is scored from RHR only (rather than the more sensitive HRV+RHR blend).
    metrics.push({
      label:  'Heart Rate Variability',
      value:  '—',
      sub:    'Not available from your device. Apple Watch measures heart rate variability automatically overnight; most other wearables don\'t sync it to Apple Health. Tap "Enter heart rate variability" below to add it yourself.',
      status: 'neutral',
    });
  }

  // ── Metric 3: Sleep's effect on recovery ────────────────────────────────────
  // Sleep is the single biggest driver of overnight recovery — worth surfacing here
  if (sleep != null) {
    const hrs      = Math.floor(sleep / 60);
    const mins     = sleep % 60;
    const totalStr = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    const shortfall = 480 - sleep; // vs 8h target
    const sub       = shortfall <= 0
      ? `At or above the 8h target — sleep fully supported overnight recovery`
      : shortfall <= 60
      ? `About ${Math.round(shortfall / 60 * 10) / 10}h short of 8h — mild sleep debt can blunt recovery by 10–15%`
      : `${Math.floor(shortfall / 60)}h+ below the 8h target — significant sleep debt suppresses heart rate variability and raises resting heart rate`;
    metrics.push({
      label:  'Last Night\'s Sleep',
      value:  totalStr,
      sub,
      status: shortfall <= 0 ? 'good' : shortfall <= 60 ? 'ok' : 'poor',
    });
  }

  // ── Metric 4: Combined recovery signal ──────────────────────────────────────
  // A synthesised "what does this all add up to" data point
  if (rhr != null || hrv != null) {
    const signalCount  = (rhr != null ? 1 : 0) + (hrv != null ? 1 : 0);
    const goodSignals  = (rhr != null && (rhr - rhrBaseline) <= 2 ? 1 : 0)
                       + (hrv != null && (hrv - 55) >= -5 ? 1 : 0);
    const sub = signalCount === 2
      ? goodSignals === 2
        ? 'Both heart rate variability and resting heart rate are pointing in a positive direction'
        : goodSignals === 1
        ? 'Mixed signals — one metric is positive, one is under pressure'
        : 'Both heart rate variability and resting heart rate indicate your body is still under recovery load'
      : 'Based on one recovery signal — connect both devices for a fuller picture';
    metrics.push({
      label:  'Overall Recovery Signal',
      value:  statusLabel,
      sub,
      status: score >= 65 ? 'good' : score >= 45 ? 'ok' : 'poor',
    });
  }

  if (metrics.length === 0) {
    metrics.push({
      label:  'No recovery data available',
      value:  '—',
      sub:    'Connect an Apple Watch or Garmin via Apple Health to unlock personalised recovery tracking',
      status: 'neutral',
    });
  }

  // ── Interpretation ──────────────────────────────────────────────────────────
  const parts: string[] = [];

  // Lead with what the score means
  if (score >= 80) {
    parts.push(`Your recovery score of ${Math.round(score)} is excellent — your cardiovascular and nervous systems have bounced back well from recent effort.`);
  } else if (score >= 65) {
    parts.push(`Your recovery score of ${Math.round(score)} is solid. Most of the strain from recent training has cleared, though there's still a little residual load.`);
  } else if (score >= 50) {
    parts.push(`Your recovery score of ${Math.round(score)} sits in the moderate range — your body has partially recovered but hasn't fully cleared the load from recent days.`);
  } else if (score >= 35) {
    parts.push(`Your recovery score of ${Math.round(score)} is below your norm. Your cardiovascular system is still managing meaningful strain from recent effort, illness, or poor sleep.`);
  } else {
    parts.push(`Your recovery score of ${Math.round(score)} is low. Your body is signalling that it needs real rest — not just a lighter day, but genuine recovery.`);
  }

  // Add RHR context in plain body terms
  if (rhr != null) {
    const delta = rhr - rhrBaseline;
    if (delta <= -3) {
      parts.push(`Your resting heart rate (${rhr} bpm) is ${Math.abs(delta)} beats below your personal average. A lower-than-usual resting heart rate means your heart is pumping efficiently — a reliable sign that recovery is complete.`);
    } else if (delta <= 2) {
      parts.push(`Your resting heart rate (${rhr} bpm) is right in line with your ${rhrBaseline} bpm average, which suggests your cardiovascular system isn't under extra pressure today.`);
    } else {
      parts.push(`Your resting heart rate (${rhr} bpm) is ${delta} beats above your ${rhrBaseline} bpm average. An elevated resting heart rate means your heart is working harder even at rest — a sign it's still processing yesterday's effort, a poor night's sleep, or early-stage illness.`);
    }
  }

  // Add HRV context in plain body terms
  if (hrv != null) {
    const d = hrv - hrvBaseline;
    const manualNote = isManualHrv
      ? ` (This reading was entered manually — values from apps like HRV4Training, Elite HRV, or a Polar chest strap are reliable sources.)`
      : '';
    if (d >= 5) {
      parts.push(`Your heart rate variability of ${hrv} ms is ${Math.round(d)} ms above your ${hrvBaseline} ms personal baseline. This means your nervous system is in a flexible, recovered state — ideal for a demanding workout or a high-pressure day.${manualNote}`);
    } else if (d >= -5) {
      parts.push(`Your heart rate variability of ${hrv} ms is within 5 ms of your ${hrvBaseline} ms personal baseline. Your nervous system is operating in its typical range — neither particularly rested nor under significant strain.${manualNote}`);
    } else {
      parts.push(`Your heart rate variability of ${hrv} ms is ${Math.abs(Math.round(d))} ms below your ${hrvBaseline} ms personal baseline. A dip below your own norm is a meaningful recovery signal — it typically reflects accumulated fatigue, a hard training block, illness, alcohol, or a rough night's sleep.${manualNote}`);
    }
  } else if (rhr != null) {
    // HRV missing but RHR present — be transparent that the score is partial
    parts.push(`Heart rate variability isn't available from your device, so your Recovery score is based on resting heart rate only. Resting heart rate is a reliable signal — but heart rate variability captures finer changes in your nervous system that resting heart rate can miss. Apple Watch measures it automatically overnight; if you use another wearable, check whether it syncs to Apple Health. You can also log it manually using the button in the Metrics section above.`);
  }

  // Cross-reference sleep if it's dragging recovery down
  if (sleep != null) {
    const shortfall = 480 - sleep;
    if (shortfall >= 90) {
      parts.push(`Last night's sleep (${fmtDur(sleep)}) is likely a key factor in today's recovery score — sleep is when your body restores heart rate variability and repairs muscle tissue. Prioritising sleep tonight will have the biggest impact on tomorrow's score.`);
    }
  }

  if (parts.length === 0) {
    parts.push('Connect an Apple Watch or Garmin to Apple Health to unlock personalised recovery analysis showing how your heart rate and nervous system recovered overnight.');
  }

  // ── Advice ──────────────────────────────────────────────────────────────────
  const advice = score >= 80
    ? `You're fully loaded and ready to go hard. This is the ideal day for demanding training — intervals, heavy lifts, a long run at race pace, or back-to-back sessions. Your body can absorb high loads right now.`
    : score >= 65
    ? `You're well recovered with a little residual fatigue. A challenging but controlled workout works well today — push hard but leave 1–2 reps in reserve on your lifts and avoid sprinting to exhaustion. Quality over maximum effort.`
    : score >= 50
    ? `Mixed recovery signals. A moderate workout is fine — a 30–40 min steady-paced run, a moderate strength session, or a long bike ride at comfortable effort. Skip anything that requires maximum intensity or grinding through real fatigue.`
    : score >= 35
    ? `Your body hasn't cleared its load yet. Easy, low-impact movement is your best option — a 20–30 min walk, gentle yoga, light stretching, or an easy swim. These promote blood flow and recovery without adding new strain.`
    : `Significant recovery deficit detected. Rest is genuinely the highest-performance choice today. If you must move, keep it to a short walk or light stretching. A nap and an early bedtime will do more for next week's training than any workout will.`;

  return {
    icon: '💓', label: 'Recovery', weight: '45%',
    dateContext: lastNightContext(),
    score, statusLabel, statusColor,
    metrics, interpretation: parts.join(' '), advice,
  };
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

function buildSleep(score: number, h: HealthData | null): BreakdownDetail {
  const { label: statusLabel, color: statusColor } = scoreStatus(score);
  const metrics: MetricRow[] = [];

  const sleepDuration   = h?.sleepDuration   ?? null;
  const deepSleep       = h?.deepSleep       ?? null;
  const remSleep        = h?.remSleep        ?? null;
  const sleepEfficiency = h?.sleepEfficiency ?? null;

  // ── Metric 1: Total Sleep ────────────────────────────────────────────────────
  if (sleepDuration != null) {
    const diff      = sleepDuration - 480;
    const shortfall = 480 - sleepDuration;
    const sub       = shortfall <= 0
      ? `At or above the 8h target — enough time for your body to complete multiple full sleep cycles`
      : shortfall <= 60
      ? `${fmtDur(shortfall)} short of the 8h target — most sleep stages will be present but slightly compressed`
      : shortfall <= 120
      ? `${fmtDur(shortfall)} below target — deep and REM stages are cut short first, reducing physical and mental recovery`
      : `${fmtDur(shortfall)} below target — significant restriction that markedly impairs performance, mood, and immunity`;
    metrics.push({
      label:  'Total Sleep',
      value:  fmtDur(sleepDuration),
      sub,
      status: diff >= 0 ? 'good' : diff >= -60 ? 'ok' : 'poor',
    });
  }

  // ── Metric 2: Deep Sleep ─────────────────────────────────────────────────────
  // Deep sleep = physical repair — muscle, bone, immune function, growth hormone
  if (deepSleep != null && sleepDuration != null && sleepDuration > 0) {
    const pct = Math.round((deepSleep / sleepDuration) * 100);
    const sub = pct >= 20
      ? `${pct}% — this is where your body repairs muscle, builds bone, and strengthens your immune system`
      : pct >= 14
      ? `${pct}% — slightly below the ≥20% target; physical repair is happening but at a reduced rate`
      : `${pct}% — well below target; muscle recovery and immune function are compromised tonight`;
    metrics.push({
      label:  'Deep Sleep',
      value:  fmtDur(deepSleep),
      sub,
      status: pct >= 18 ? 'good' : pct >= 12 ? 'ok' : 'poor',
    });
  }

  // ── Metric 3: REM Sleep ──────────────────────────────────────────────────────
  // REM = brain maintenance — memory consolidation, emotional regulation, creativity
  if (remSleep != null && sleepDuration != null && sleepDuration > 0) {
    const pct = Math.round((remSleep / sleepDuration) * 100);
    const sub = pct >= 22
      ? `${pct}% — strong REM supports memory consolidation, emotional regulation, and creativity`
      : pct >= 15
      ? `${pct}% — near the ≥25% target; learning and mood processing are largely intact`
      : `${pct}% — low REM impairs next-day focus, emotional resilience, and skill retention`;
    metrics.push({
      label:  'REM Sleep',
      value:  fmtDur(remSleep),
      sub,
      status: pct >= 22 ? 'good' : pct >= 15 ? 'ok' : 'poor',
    });
  }

  // ── Metric 4: Sleep Efficiency ───────────────────────────────────────────────
  if (sleepEfficiency != null) {
    const sub = sleepEfficiency >= 85
      ? `${sleepEfficiency}% — you were asleep for most of your time in bed; good sleep continuity`
      : sleepEfficiency >= 75
      ? `${sleepEfficiency}% — mild fragmentation; some waking and restlessness during the night`
      : `${sleepEfficiency}% — significant time spent awake in bed, which fragments deep and REM cycles`;
    metrics.push({
      label:  'Sleep Efficiency',
      value:  `${sleepEfficiency}%`,
      sub,
      status: sleepEfficiency >= 85 ? 'good' : sleepEfficiency >= 75 ? 'ok' : 'poor',
    });
  }

  // ── Metric 5: Sleep Quality Signal ──────────────────────────────────────────
  // Synthesised "what does this all add up to" data point
  const hasStages = deepSleep != null && remSleep != null
                  && sleepDuration != null && sleepDuration > 0;
  if (hasStages) {
    const deepPct    = Math.round((deepSleep! / sleepDuration!) * 100);
    const remPct     = Math.round((remSleep!  / sleepDuration!) * 100);
    const goodStages = (deepPct >= 18 ? 1 : 0) + (remPct >= 22 ? 1 : 0);
    const sub        = goodStages === 2
      ? 'Deep and REM stages are both well-represented — high-quality sleep architecture'
      : goodStages === 1
      ? 'One of deep or REM sleep is below target — partial sleep quality compromise'
      : 'Both deep and REM stages are below target — sleep quality is reduced regardless of total duration';
    metrics.push({
      label:  'Sleep Quality Signal',
      value:  goodStages === 2 ? 'Strong' : goodStages === 1 ? 'Mixed' : 'Weak',
      sub,
      status: goodStages === 2 ? 'good' : goodStages === 1 ? 'ok' : 'poor',
    });
  }

  if (metrics.length === 0) {
    metrics.push({
      label:  'No sleep data available',
      value:  '—',
      sub:    'Connect an Apple Watch or Garmin via Apple Health to unlock full sleep stage tracking',
      status: 'neutral',
    });
  }

  // ── Interpretation ──────────────────────────────────────────────────────────
  const parts: string[] = [];

  // Lead with what the score means
  if (score >= 80) {
    parts.push(`Your sleep score of ${Math.round(score)} is excellent — last night gave your body and brain everything they need to perform and recover well today.`);
  } else if (score >= 65) {
    parts.push(`Your sleep score of ${Math.round(score)} is solid. Last night was a good night's sleep, though there's a little room at the margin — you'll feel capable but not at your absolute peak.`);
  } else if (score >= 50) {
    parts.push(`Your sleep score of ${Math.round(score)} is moderate. Last night's sleep was functional but incomplete — you'll likely feel the effects in focus, mood, or energy at some point today.`);
  } else if (score >= 35) {
    parts.push(`Your sleep score of ${Math.round(score)} indicates a poor night's sleep. Significant gaps in duration or sleep quality mean your body didn't get the recovery it needed — expect reduced physical and cognitive performance today.`);
  } else {
    parts.push(`Your sleep score of ${Math.round(score)} is critically low. Last night's sleep was severely disrupted or cut short — your performance, mood, and decision-making will all be meaningfully impaired.`);
  }

  // Total duration context in plain body terms
  if (sleepDuration != null) {
    const hrs       = (sleepDuration / 60).toFixed(1);
    const shortfall = 480 - sleepDuration;
    if (shortfall <= 0) {
      parts.push(`You got ${hrs} hours — at or above the 8-hour target. Total duration is strong, which gives your body the time to cycle through deep and REM sleep multiple times overnight.`);
    } else if (shortfall <= 60) {
      parts.push(`At ${hrs} hours, you're about ${fmtDur(shortfall)} short of the 8-hour target. This mild deficit is manageable — most of your critical sleep stages will still have occurred, just slightly compressed.`);
    } else {
      parts.push(`At ${hrs} hours, you're ${fmtDur(shortfall)} short of the 8-hour target. Sleep duration is the foundation everything else builds on — when it's cut short, the body prioritises the early cycles and sacrifices the later ones (deep sleep and REM) first. This is why one short night hits harder than it looks.`);
    }
  }

  // Deep sleep context — explain what it actually does
  if (deepSleep != null && sleepDuration != null && sleepDuration > 0) {
    const pct = Math.round((deepSleep / sleepDuration) * 100);
    if (pct >= 20) {
      parts.push(`Deep sleep was strong at ${pct}% (${fmtDur(deepSleep)}). This is the stage where your body releases growth hormone, repairs muscle tissue, consolidates long-term memory, and rebuilds immune defences — everything that makes tomorrow's training feel possible.`);
    } else if (pct >= 14) {
      parts.push(`Deep sleep came in at ${pct}% (${fmtDur(deepSleep)}), slightly below the ≥20% target. Physical repair and immune function are happening, just at a reduced rate — you may notice slightly slower muscle soreness recovery than usual.`);
    } else {
      parts.push(`Deep sleep was only ${pct}% (${fmtDur(deepSleep)}), well below the ≥20% target. Deep sleep is when your body repairs and rebuilds — low levels mean you're carrying more residual muscle damage and inflammatory markers into today than after a full night.`);
    }
  }

  // REM context — explain the brain maintenance role
  if (remSleep != null && sleepDuration != null && sleepDuration > 0) {
    const pct = Math.round((remSleep / sleepDuration) * 100);
    if (pct >= 22) {
      parts.push(`REM sleep was healthy at ${pct}% (${fmtDur(remSleep)}). REM is your brain's overnight maintenance window — it consolidates what you learned yesterday, regulates emotional responses, and rebuilds creative thinking capacity. You'll be sharp today.`);
    } else if (pct < 15) {
      parts.push(`REM sleep was only ${pct}% (${fmtDur(remSleep)}), below the ≥25% target. Reduced REM typically shows up as blunted focus, slightly flat mood, and slower learning retention — worth being aware of if today involves complex decisions or skill work.`);
    }
  }

  if (parts.length === 0) {
    parts.push('Sync your Apple Watch or Garmin to unlock detailed sleep stage analysis. Duration, deep sleep %, REM %, and efficiency each tell a different part of the overnight recovery story.');
  }

  // ── Advice ──────────────────────────────────────────────────────────────────
  const advice = score >= 80
    ? `Well rested and ready. Sleep is fully supporting today's performance — train hard, think clearly, and trust your energy. To protect this pattern, keep your bedtime consistent and avoid screens in the 30 minutes before sleep.`
    : score >= 65
    ? `Good sleep with room to improve. Avoid caffeine after 2 pm — its half-life is 5–6 hours, and afternoon coffee pushes deep sleep later into the night. Aim to be in bed by 10:30 pm to lock in a full 8-hour window.`
    : score >= 50
    ? `Below-optimal sleep. Keep today's training moderate — your reaction time and strength are both slightly blunted. Tonight: set a firm lights-out time, keep your room cool (around 18°C / 65°F), and avoid heavy meals in the 2 hours before bed.`
    : score >= 35
    ? `Significant sleep deficit. Cognitive performance, mood, and physical output will all be affected today. A 20-minute nap before 3 pm can partially offset the deficit. Tonight: no screens after 9 pm, aim for bed by 9:30–10 pm, and keep the room dark and quiet.`
    : `Severe sleep restriction. Skip intense training — attempting it adds strain without adaptation benefit. Stay hydrated, eat regular meals, and get to bed as early as possible tonight. A short 20-minute nap will help more than caffeine right now.`;

  return {
    icon: '🌙', label: 'Sleep', weight: '40%',
    dateContext: lastNightContext(),
    score, statusLabel, statusColor,
    metrics, interpretation: parts.join(' '), advice,
  };
}

// ─── Stress ───────────────────────────────────────────────────────────────────

function buildStress(score: number, h: HealthData | null, rhrBaseline: number, hrvBaseline: number): BreakdownDetail {
  const { label: statusLabel, color: statusColor } = scoreStatus(score);
  const metrics: MetricRow[] = [];

  const stressScore   = h?.stressScore   ?? null;
  const hrv           = h?.hrv           ?? null;
  const daytimeAvgHR  = h?.daytimeAvgHR  ?? null;

  // ── Metric 1: Garmin Stress Index ────────────────────────────────────────────
  if (stressScore != null) {
    const s   = stressScore;
    const sub = s <= 25
      ? `Low — your autonomic nervous system is calm and not in a fight-or-flight state`
      : s <= 50
      ? `Moderate — your body is managing some load from training, work, or daily demands`
      : s <= 75
      ? `High — sustained physiological arousal that suppresses recovery and immune function`
      : `Very high — your nervous system is significantly activated; rest is more valuable than training right now`;
    metrics.push({
      label:  'Garmin Stress Index',
      value:  `${s} / 100`,
      sub,
      status: s <= 25 ? 'good' : s <= 50 ? 'ok' : 'poor',
    });
  }

  // ── Metric 2: HRV overnight ──────────────────────────────────────────────────
  // HRV is the most sensitive proxy for autonomic stress state
  if (hrv != null) {
    const delta = Math.round(hrv - hrvBaseline);
    const sign  = delta >= 0 ? '+' : '';
    const sub   = delta >= 5
      ? `${sign}${delta} ms above your ${hrvBaseline} ms baseline — nervous system is calm and adaptive`
      : delta >= -5
      ? `${sign}${delta} ms from your ${hrvBaseline} ms baseline — autonomic balance is neutral, neither stressed nor recovered`
      : `${delta} ms below your ${hrvBaseline} ms baseline — suppressed heart rate variability signals your body is managing more load than usual`;
    metrics.push({
      label:  'Heart Rate Variability',
      value:  `${hrv} ms`,
      sub,
      status: delta >= -5 ? (delta >= 5 ? 'good' : 'ok') : 'poor',
    });
  }

  // ── Metric 3: Daytime Avg Heart Rate ────────────────────────────────────────
  if (daytimeAvgHR != null) {
    const elevation = daytimeAvgHR - rhrBaseline;
    const sign      = elevation >= 0 ? '+' : '';
    const sub       = elevation <= 3
      ? `${sign}${elevation} bpm above your ${rhrBaseline} bpm baseline — heart rate is close to rest, a low-stress signal`
      : elevation <= 10
      ? `${sign}${elevation} bpm above your ${rhrBaseline} bpm baseline — mild elevation from activity, caffeine, or moderate stress`
      : `${sign}${elevation} bpm above your ${rhrBaseline} bpm baseline — significant elevation often signals high physiological stress or poor recovery`;
    metrics.push({
      label:  'Daytime Avg Heart Rate',
      value:  `${daytimeAvgHR} bpm`,
      sub,
      status: elevation <= 3 ? 'good' : elevation <= 10 ? 'ok' : 'poor',
    });
  }

  // ── Metric 4: Overall Stress Signal ─────────────────────────────────────────
  // Synthesised view combining all available signals
  if (stressScore != null || hrv != null) {
    const stressOk  = stressScore == null || stressScore <= 50;
    const hrvOk     = hrv == null || (hrv - hrvBaseline) >= -5;
    const bothOk    = stressOk && hrvOk;
    const neitherOk = !stressOk && !hrvOk;
    const sub       = bothOk
      ? 'All available stress signals point toward a calm, manageable state'
      : neitherOk
      ? 'Multiple stress signals are elevated — your nervous system is under meaningful load from training, poor sleep, or daily stressors'
      : 'Mixed signals — one stress indicator is elevated while another is within range';
    metrics.push({
      label:  'Overall Stress Signal',
      value:  statusLabel,
      sub,
      status: score >= 65 ? 'good' : score >= 45 ? 'ok' : 'poor',
    });
  }

  if (metrics.length === 0) {
    metrics.push({
      label:  'No stress signal available',
      value:  '—',
      sub:    'Stress is measured via Garmin\'s stress algorithm or overnight heart rate variability from Apple Watch. Sync your device to enable this.',
      status: 'neutral',
    });
  }

  // ── Interpretation ──────────────────────────────────────────────────────────
  const parts: string[] = [];

  // Lead with what the score means
  if (score >= 80) {
    parts.push(`Your stress score of ${Math.round(score)} is low — your nervous system is in a calm, recovered state today. This is the ideal baseline for both hard training and demanding cognitive work.`);
  } else if (score >= 65) {
    parts.push(`Your stress score of ${Math.round(score)} is manageable. There's a moderate amount of physiological load — your body is handling it well, but it's worth not stacking too many stressors on top of each other today.`);
  } else if (score >= 50) {
    parts.push(`Your stress score of ${Math.round(score)} indicates your nervous system is under meaningful load. This can come from training, poor sleep, life stressors, or a combination — your body can't easily distinguish between them.`);
  } else if (score >= 35) {
    parts.push(`Your stress score of ${Math.round(score)} is elevated. High physiological stress tells your body to stay in a protective, conservation mode — which directly conflicts with training adaptation and clear thinking.`);
  } else {
    parts.push(`Your stress score of ${Math.round(score)} is very high. Your nervous system is significantly activated — adding training load on top of this will create more damage than adaptation. Rest is genuinely the highest-performance choice today.`);
  }

  // Primary signal in plain body terms
  if (stressScore != null) {
    const s = stressScore;
    if (s <= 25) {
      parts.push(`Your Garmin stress score of ${s}/100 is in the low range. Garmin calculates this from your heart rate patterns throughout the day — a score this low means your nervous system spent most of the time in rest-and-digest mode rather than fight-or-flight mode.`);
    } else if (s <= 50) {
      parts.push(`Your Garmin stress score of ${s}/100 sits in the moderate range. This level of physiological stress is normal — it reflects the combined load of daily activity, light to moderate training, and routine demands. At this level, recovery is still happening, just at a slightly reduced rate.`);
    } else if (s <= 75) {
      parts.push(`Your Garmin stress score of ${s}/100 is in the high range. Sustained high stress — whether physical or psychological — keeps cortisol elevated and suppresses testosterone and growth hormone. In practical terms: slower muscle repair, blunted mood, and a lower ceiling on today's performance.`);
    } else {
      parts.push(`Your Garmin stress score of ${s}/100 is very high. At this level, your body is in a prolonged fight-or-flight state — digestion, immune function, and tissue repair are all deprioritised. Training hard when your score is this elevated typically prolongs recovery rather than shortens it.`);
    }
  } else if (hrv != null) {
    const d = Math.round(hrv - hrvBaseline);
    if (d >= 5) {
      parts.push(`Your overnight heart rate variability of ${hrv} ms is ${d} ms above your ${hrvBaseline} ms personal baseline. Higher variability than your own norm means your nervous system is flexible and responsive, not locked into a stressed, rigid rhythm — a reliable sign of low physiological stress.`);
    } else if (d >= -5) {
      parts.push(`Your overnight heart rate variability of ${hrv} ms is within 5 ms of your ${hrvBaseline} ms personal baseline. Your nervous system is operating at a typical level — not particularly stressed, but also not in a deeply recovered state.`);
    } else {
      parts.push(`Your overnight heart rate variability of ${hrv} ms is ${Math.abs(d)} ms below your ${hrvBaseline} ms personal baseline. A dip below your own norm is one of the clearest signs of elevated stress — whether from training load, accumulated fatigue, alcohol, illness, or life demands. Your body is managing more than it's letting on.`);
    }
  } else if (daytimeAvgHR != null) {
    const elevation = daytimeAvgHR - rhrBaseline;
    if (elevation <= 3) {
      parts.push(`Your daytime heart rate (${daytimeAvgHR} bpm) is close to your resting baseline of ${rhrBaseline} bpm — a sign of a calm, low-stress day. A heart rate that stays near resting during normal daily activity reflects efficient autonomic regulation.`);
    } else {
      parts.push(`Your daytime heart rate (${daytimeAvgHR} bpm) is ${elevation} bpm above your ${rhrBaseline} bpm resting baseline. A persistently elevated daytime HR — beyond what physical activity alone explains — often reflects physiological stress, high training load, or incomplete overnight recovery.`);
    }
  }

  // Cross-reference sleep — sleep and stress are tightly coupled
  if (h?.sleepDuration != null) {
    const sleepShortfall = 480 - h.sleepDuration;
    if (sleepShortfall >= 60) {
      parts.push(`Last night's sleep (${fmtDur(h.sleepDuration)}) is likely contributing to today's elevated stress readings. Sleep deprivation and physiological stress are tightly linked — poor sleep raises cortisol and prevents the overnight recovery that brings heart rate variability and stress scores back to baseline.`);
    }
  }

  if (parts.length === 0) {
    parts.push('No stress signal was detected. This can happen early in the morning before enough heart rate samples have been collected. Pull to refresh later in the day for a more complete picture.');
  }

  // ── Advice ──────────────────────────────────────────────────────────────────
  const advice = score >= 80
    ? `Low stress — your nervous system is settled and responsive. A great day for hard training or demanding focus work. To maintain this state, keep to your usual sleep schedule and avoid late-night caffeine or alcohol.`
    : score >= 65
    ? `Stress is manageable. If you want to shift your state further, try 5 minutes of box breathing: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 5 rounds. It activates the parasympathetic nervous system within minutes.`
    : score >= 50
    ? `Moderate stress. Avoid stacking stressors today — choose between a hard training session or a demanding work schedule, not both. A 20-minute walk in natural daylight can measurably lower cortisol and improve your afternoon state.`
    : score >= 35
    ? `Elevated stress. Training hard today adds physiological load without meaningful adaptation benefit. Prioritise sleep tonight over training volume. A 10-minute body scan meditation or slow yoga session can meaningfully reduce sympathetic nervous system activation.`
    : `High physiological stress. Rest is the most productive thing you can do today. If you need to move, limit it to a 15–20 minute easy walk. Focus on going to bed early, avoiding screens after 9 pm, and eating regular meals to keep cortisol from spiking further.`;

  return {
    icon: '🧠', label: 'Stress', weight: '15%',
    dateContext: todayContext(),
    score, statusLabel, statusColor,
    metrics, interpretation: parts.join(' '), advice,
  };
}

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * Computes a 0–100 context score for yesterday's activity.
 *
 * Scoring model:
 *   Steps        (0–75 pts):  10,000 steps → 75 pts, linear
 *   Exercise min (0–25 pts):  60 min → 25 pts, linear
 *
 * This score is DISPLAY-ONLY — it never feeds into the readiness calculation.
 * It exists purely so the BreakdownModal can show a meaningful progress ring.
 */
export function computeActivityScore(h: HealthData | null): number {
  if (!h) return 0;
  const steps  = h.steps          ?? 0;
  const exMins = h.exerciseMinutes ?? 0;
  const stepsScore = Math.min(75, (steps / 10_000) * 75);
  const exScore    = Math.min(25, (exMins / 60) * 25);
  return Math.round(stepsScore + exScore);
}

function buildActivity(score: number, h: HealthData | null): BreakdownDetail {
  const { label: statusLabel, color: statusColor } = scoreStatus(score);
  const metrics: MetricRow[] = [];

  const steps           = h?.steps           ?? null;
  const activeCalories  = h?.activeCalories  ?? null;
  const exerciseMinutes = h?.exerciseMinutes ?? null;

  // ── Metric 1: Steps ─────────────────────────────────────────────────────────
  if (steps != null) {
    const sub = steps >= 10_000
      ? `${steps.toLocaleString()} steps — above the 10,000-step mark associated with reduced all-cause mortality risk`
      : steps >= 7_500
      ? `${steps.toLocaleString()} steps — approaching the research-backed 7,500–10,000 range for cardiovascular health`
      : steps >= 5_000
      ? `${steps.toLocaleString()} steps — a moderate day; 7,500+ is where most health benefits accelerate`
      : `${steps.toLocaleString()} steps — a low-movement day; even a short walk adds meaningful benefit`;
    metrics.push({
      label:  'Steps',
      value:  steps.toLocaleString(),
      sub,
      status: steps >= 8_000 ? 'good' : steps >= 5_000 ? 'ok' : 'poor',
    });
  }

  // ── Metric 2: Active Calories ────────────────────────────────────────────────
  if (activeCalories != null) {
    const sub = activeCalories >= 500
      ? `${activeCalories} kcal — high active burn; reflects significant movement or structured exercise`
      : activeCalories >= 300
      ? `${activeCalories} kcal — solid active burn in line with a moderately active day`
      : `${activeCalories} kcal — light burn; more movement or a dedicated workout session would raise this`;
    metrics.push({
      label:  'Active Calories',
      value:  `${activeCalories} kcal`,
      sub,
      status: activeCalories >= 400 ? 'good' : activeCalories >= 250 ? 'ok' : 'poor',
    });
  }

  // ── Metric 3: Exercise Minutes ───────────────────────────────────────────────
  // Apple's Exercise ring counts minutes of brisk activity (≥ moderate intensity)
  if (exerciseMinutes != null) {
    const sub = exerciseMinutes >= 30
      ? `${exerciseMinutes} min of brisk activity — meets the WHO minimum of 150 min moderate activity per week on this day alone`
      : exerciseMinutes >= 20
      ? `${exerciseMinutes} min — close to the 30-min daily target; a short brisk walk would close the gap`
      : exerciseMinutes > 0
      ? `${exerciseMinutes} min — below the 30-min recommended minimum; even 10-min bouts of brisk walking count`
      : `0 min recorded — Apple's Exercise ring counts activity above a brisk-walk intensity (≥ 3 METs)`;
    metrics.push({
      label:  'Exercise Minutes',
      value:  `${exerciseMinutes} min`,
      sub,
      status: exerciseMinutes >= 30 ? 'good' : exerciseMinutes >= 20 ? 'ok' : 'poor',
    });
  }

  // ── Metric 4: Overall Activity Signal ────────────────────────────────────────
  if (steps != null || exerciseMinutes != null) {
    const stepsOk = steps == null || steps >= 7_500;
    const exOk    = exerciseMinutes == null || exerciseMinutes >= 20;
    const sub     = stepsOk && exOk
      ? 'Good movement volume — activity load from yesterday is a positive context signal for today\'s recovery'
      : !stepsOk && !exOk
      ? 'Low movement day — a sedentary pattern can gradually reduce baseline fitness and slow recovery adaptation'
      : 'Mixed — one aspect of yesterday\'s activity is below target, but the other looks good';
    metrics.push({
      label:  'Overall Activity',
      value:  stepsOk && exOk ? 'Active' : stepsOk || exOk ? 'Moderate' : 'Low',
      sub,
      status: score >= 65 ? 'good' : score >= 40 ? 'ok' : 'poor',
    });
  }

  if (metrics.length === 0) {
    metrics.push({
      label:  'No activity data available',
      value:  '—',
      sub:    'Steps and exercise data come from your iPhone or Apple Watch via Apple Health',
      status: 'neutral',
    });
  }

  // ── Interpretation ──────────────────────────────────────────────────────────
  const parts: string[] = [];

  if (steps != null) {
    if (steps >= 10_000) {
      parts.push(`Yesterday was a high-movement day with ${steps.toLocaleString()} steps. Research consistently links 7,500–10,000+ daily steps with lower cardiovascular risk, better insulin sensitivity, and improved sleep quality — all of which show up in today's recovery metrics.`);
    } else if (steps >= 7_500) {
      parts.push(`Yesterday's ${steps.toLocaleString()} steps puts you in the research-backed range for cardiovascular benefit. Studies show the biggest risk reduction comes between 4,000–8,000 steps, with diminishing returns above that — you hit the zone that matters most.`);
    } else if (steps >= 5_000) {
      parts.push(`Yesterday's ${steps.toLocaleString()} steps is a moderately active day. The health and recovery benefits of walking start to accelerate meaningfully above 7,500 steps — an extra 20-minute walk would have put you there.`);
    } else {
      parts.push(`Yesterday was a low-movement day at ${steps.toLocaleString()} steps. Sedentary days don't just mean fewer benefits — prolonged sitting independently raises cortisol and blunts insulin sensitivity, which can show up in today's heart rate variability and resting heart rate readings.`);
    }
  }

  if (exerciseMinutes != null) {
    if (exerciseMinutes >= 30) {
      parts.push(`You also logged ${exerciseMinutes} minutes of brisk exercise — meeting the WHO's minimum of 150 minutes of moderate activity per week in a single day. Structured exercise is the strongest single driver of long-term cardiovascular adaptation.`);
    } else if (exerciseMinutes > 0) {
      parts.push(`You got ${exerciseMinutes} minutes of brisk-paced movement. The target is 30 minutes daily — you were close. Even short bouts of 10 minutes count toward the total.`);
    }
  }

  if (activeCalories != null && parts.length > 0) {
    if (activeCalories >= 400) {
      parts.push(`Active calorie burn was solid at ${activeCalories} kcal, reflecting a genuinely active day beyond just incidental movement.`);
    }
  }

  if (parts.length === 0) {
    parts.push('No activity data was recorded for yesterday. Steps, exercise minutes, and active calories come from your iPhone or Apple Watch via Apple Health. Make sure Apple Health is syncing correctly.');
  }

  // ── Advice ──────────────────────────────────────────────────────────────────
  const advice = score >= 75
    ? `Strong activity yesterday. Today's focus should be on quality recovery — prioritise sleep timing and protein intake to maximise the adaptation from that effort. Active movement like walking is still beneficial even on rest days.`
    : score >= 50
    ? `Moderate activity day. Aim for 7,500–10,000 steps today and at least 20–30 minutes of brisk walking or exercise. Breaking it into two 15-minute walks is just as effective as one continuous bout.`
    : `Low activity day yesterday. Today is a good opportunity to move more — even a 30-minute walk in natural daylight improves insulin sensitivity, reduces cortisol, and meaningfully boosts tomorrow's recovery metrics. You don't need a structured workout to get the benefit.`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLabel = yesterday.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return {
    icon: '🏃', label: 'Activity', weight: 'Context · not scored',
    dateContext: `Yesterday · ${yesterdayLabel}`,
    score, statusLabel, statusColor,
    metrics, interpretation: parts.join(' '), advice,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildBreakdownDetail(
  component:   'recovery' | 'sleep' | 'stress' | 'activity',
  score:       number,
  healthData:  HealthData | null,
  rhrBaseline: number,
  hrvBaseline  = 55,   // personal 30-day HRV baseline; falls back to population avg
): BreakdownDetail {
  switch (component) {
    case 'recovery': return buildRecovery(score, healthData, rhrBaseline, hrvBaseline);
    case 'sleep':    return buildSleep(score, healthData);
    case 'stress':   return buildStress(score, healthData, rhrBaseline, hrvBaseline);
    case 'activity': return buildActivity(score, healthData);
  }
}
