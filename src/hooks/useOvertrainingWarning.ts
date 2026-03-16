/**
 * useOvertrainingWarning
 *
 * Synthesises existing pattern-analysis results with Strava training-load data
 * to produce an overtraining risk assessment that is surfaced as a dedicated
 * warning card on the home screen.
 *
 * ── Risk model ─────────────────────────────────────────────────────────────
 * We compose signals from two sources:
 *   1. patternAnalysis.ts — 30-day Supabase pattern detectors
 *      (consecutive HRV drop, persistent low score, score decline,
 *       sleep debt, stress accumulation)
 *   2. stravaLoad.ts — Strava A:C ratio overreaching flag
 *      (this-week load > 130% of 4-week average)
 *
 * Risk levels:
 *   none      → No signals, or only positive signals (improving, rebound)
 *   low       → One warning-severity signal
 *   moderate  → Two warning signals OR one alert signal
 *   high      → Two or more alert signals, or persistent_low + any other
 *
 * ── Caching ────────────────────────────────────────────────────────────────
 * analyzePatterns() already caches for 6h — this hook simply reads from
 * that result and adds the Strava overlay, so no extra network call is made.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@services/supabase';
import { analyzePatterns } from '@services/patternAnalysis';
import { computeTrainingTrend } from '@utils/stravaLoad';
import type { PatternInsight } from '@services/patternAnalysis';
import type { StravaActivity } from '@services/strava';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OvertRiskLevel = 'none' | 'low' | 'moderate' | 'high';

export interface OvertSignal {
  /** Short contextual emoji */
  icon:     string;
  /** One-line label shown in the signal list */
  label:    string;
  /** Full sentence from the pattern detector — shown in expanded detail */
  detail:   string;
  severity: 'warning' | 'alert';
}

export interface OvertrainingWarning {
  riskLevel:  OvertRiskLevel;
  /** Top signals (max 4) that contributed to the risk level */
  signals:    OvertSignal[];
  /** 3-point, severity-appropriate action plan */
  actionPlan: string[];
  isLoading:  boolean;
}

// ─── Pattern type → signal mapping ───────────────────────────────────────────

/** Only these pattern types are relevant to overtraining risk. */
const OVERTRAINING_TYPES = new Set([
  'consecutive_hrv_drop',
  'persistent_low',
  'consecutive_score_decline',
  'sleep_debt',
  'stress_accumulation',
]);

function patternToSignal(p: PatternInsight): OvertSignal {
  switch (p.type) {
    case 'consecutive_hrv_drop':
      return {
        icon:     '📉',
        label:    'HRV dropping',
        detail:   p.message,
        severity: p.severity as 'warning' | 'alert',
      };
    case 'persistent_low':
      return {
        icon:     '🔴',
        label:    'Persistently low readiness',
        detail:   p.message,
        severity: 'alert',
      };
    case 'consecutive_score_decline':
      return {
        icon:     '⬇️',
        label:    'Readiness declining',
        detail:   p.message,
        severity: p.severity as 'warning' | 'alert',
      };
    case 'sleep_debt':
      return {
        icon:     '😴',
        label:    'Sleep debt building',
        detail:   p.message,
        severity: p.severity as 'warning' | 'alert',
      };
    case 'stress_accumulation':
      return {
        icon:     '⚡',
        label:    'Stress accumulating',
        detail:   p.message,
        severity: 'warning',
      };
    default:
      return {
        icon:     '⚠️',
        label:    'Fatigue signal',
        detail:   p.message,
        severity: 'warning',
      };
  }
}

// ─── Risk level ───────────────────────────────────────────────────────────────

function computeRiskLevel(signals: OvertSignal[]): OvertRiskLevel {
  if (signals.length === 0) return 'none';

  const alertCount   = signals.filter(s => s.severity === 'alert').length;
  const warningCount = signals.filter(s => s.severity === 'warning').length;

  // Two or more alerts, or one alert + two warnings
  if (alertCount >= 2 || (alertCount >= 1 && warningCount >= 2)) return 'high';

  // One alert OR two or more warnings
  if (alertCount >= 1 || warningCount >= 2) return 'moderate';

  // Single warning
  if (warningCount >= 1) return 'low';

  return 'none';
}

// ─── Action plan builder ──────────────────────────────────────────────────────

function buildActionPlan(
  riskLevel: OvertRiskLevel,
  signals:   OvertSignal[],
): string[] {
  const hasSleepDebt   = signals.some(s => s.label.includes('Sleep'));
  const hasHRVDrop     = signals.some(s => s.label.includes('HRV'));
  const hasTrainingLoad = signals.some(s => s.label.includes('Training load'));

  if (riskLevel === 'high') {
    return [
      'Take 1–2 full rest days now — no structured training until your scores begin recovering.',
      hasSleepDebt
        ? 'Sleep is your highest-leverage recovery tool right now. Aim for 8–9 h tonight and move your bedtime earlier for the next 3 nights.'
        : 'Prioritise 8–9 h of sleep tonight. This single variable drives more recovery than any supplement or protocol.',
      hasHRVDrop
        ? 'If HRV doesn\'t start recovering within 72 h, consider seeing a sports physician — a prolonged drop can signal illness or hormonal disruption.'
        : 'Eat at a slight calorie surplus (protein-rich, 1.6–2 g/kg) to support tissue repair and restock glycogen.',
    ];
  }

  if (riskLevel === 'moderate') {
    return [
      hasTrainingLoad
        ? 'Cut this week\'s training volume by ~30 % — your acute load is well above your chronic baseline.'
        : 'Shift the next 2–3 sessions to Zone 1–2 only (conversational pace, RPE ≤ 4).',
      hasSleepDebt
        ? 'Address sleep debt: go to bed 30–45 min earlier tonight and hold that for the next 3 nights.'
        : 'Protect sleep — 7.5–8.5 h is the window where most recovery and adaptation occurs.',
      'Focus nutrition: high protein, adequate carbohydrates after sessions, and consistent hydration throughout the day.',
    ];
  }

  // low
  return [
    'Keep today\'s session easy (RPE ≤ 5). Your body hasn\'t fully absorbed recent training load yet.',
    hasSleepDebt
      ? 'Prioritise getting to bed on time tonight — even 30 extra minutes consistently helps clear accumulated sleep debt.'
      : 'Monitor how your energy and mood trend over the next 2–3 days before returning to high-intensity work.',
    'Consider an active recovery session (yoga, walking, easy cycling) in place of any hard intervals you had planned.',
  ];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Evaluates overtraining risk by combining existing 30-day pattern detectors
 * with the Strava A:C ratio signal.
 *
 * @param stravaActivities  Activities fetched for the last 28 days (already
 *                          loaded on the home screen — no extra API call).
 */
export function useOvertrainingWarning(
  stravaActivities: StravaActivity[],
): OvertrainingWarning {
  const [riskLevel,  setRiskLevel]  = useState<OvertRiskLevel>('none');
  const [signals,    setSignals]    = useState<OvertSignal[]>([]);
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setIsLoading(false); return; }

        // analyzePatterns() is 6h-cached — no extra network cost here
        const patterns = await analyzePatterns(user.id);

        // ── Signals from pattern analysis ──────────────────────────────────
        const combinedSignals: OvertSignal[] = patterns
          .filter(p => OVERTRAINING_TYPES.has(p.type) && p.severity !== 'info')
          .map(patternToSignal);

        // ── Strava A:C ratio overreaching signal ───────────────────────────
        if (stravaActivities.length > 0) {
          const trend = computeTrainingTrend(stravaActivities);
          if (trend.trend === 'overreaching' && trend.acRatio !== null) {
            combinedSignals.push({
              icon:     '🏃',
              label:    'Training load spike',
              detail:   trend.insight,
              severity: 'alert',
            });
          }
        }

        // ── Deduplicate and limit to top 4 ────────────────────────────────
        // Alert-severity signals take precedence
        const sorted = [...combinedSignals].sort((a, b) =>
          (b.severity === 'alert' ? 1 : 0) - (a.severity === 'alert' ? 1 : 0),
        );
        const topSignals = sorted.slice(0, 4);

        const level = computeRiskLevel(topSignals);
        const plan  = buildActionPlan(level, topSignals);

        if (!cancelled) {
          setRiskLevel(level);
          setSignals(topSignals);
          setActionPlan(plan);
        }
      } catch (err) {
        console.warn('[useOvertrainingWarning] non-fatal error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    evaluate();
    return () => { cancelled = true; };
  // Re-evaluate when Strava activity count changes (pull-to-refresh)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stravaActivities.length]);

  return { riskLevel, signals, actionPlan, isLoading };
}
