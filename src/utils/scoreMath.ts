/**
 * Plain-language working for the "How today's score was calculated" screen.
 *
 * Built only from ScoreExplanation, the same object the score itself comes
 * from, so the screen can never describe a different calculation from the
 * one that produced the number. No em dashes in any string (house rule).
 */

import { DEFAULTS, type ScoreExplanation } from './readiness';
import type { PhaseBaselineResult } from './cycleBaselines';
import type { CyclePhase } from './cyclePhase';

export interface MathSection {
  key:     'total' | 'recovery' | 'sleep' | 'stress' | 'baselines' | 'cycle';
  title:   string;
  /** e.g. "45% of your score" */
  weight?: string;
  /** Rounded component result, shown large */
  result?: number;
  lines:   string[];
}

export interface MathInput {
  explanation:         ScoreExplanation;
  hrvBaseline:         number;
  rhrBaseline:         number;
  hrvBaselineAllMonth: number;
  rhrBaselineAllMonth: number;
  cycle:               PhaseBaselineResult | null;
  uncorrectedScore:    number | null;
}

const PHASE_NAMES: Record<CyclePhase, string> = {
  menstrual:   'menstrual',
  follicular:  'follicular',
  ovulatory:   'ovulatory',
  luteal:      'luteal',
  late_luteal: 'late luteal',
};

/** One decimal, trailing ".0" dropped: 31.5, 9, -0.2 */
export function n1(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function signed(v: number): string {
  const s = n1(v);
  return v > 0 ? `+${s}` : s;
}

function hm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function buildScoreMath(input: MathInput): MathSection[] {
  const e = input.explanation;
  const w = e.weights;
  const sections: MathSection[] = [];

  // ── Total ────────────────────────────────────────────────────────────────
  const rTerm = e.recovery.score * w.recovery;
  const sTerm = e.sleep.score * w.sleep;
  const tTerm = e.stress.score * w.stress;
  sections.push({
    key: 'total',
    title: 'Your score',
    result: e.score,
    lines: [
      `Recovery ${n1(e.recovery.score)} × ${pct(w.recovery)} + Sleep ${n1(e.sleep.score)} × ${pct(w.sleep)} + Stress ${n1(e.stress.score)} × ${pct(w.stress)}`,
      `= ${n1(rTerm)} + ${n1(sTerm)} + ${n1(tTerm)} = ${n1(e.raw)}, rounded to ${e.score}.`,
    ],
  });

  // ── Recovery ─────────────────────────────────────────────────────────────
  const rec = e.recovery;
  const recLines: string[] = [];
  if (rec.hrv) {
    const diff = rec.hrv.value - rec.hrv.baseline;
    recLines.push(
      `Heart rate variability: ${n1(rec.hrv.value)} ms against your ${n1(rec.hrv.baseline)} ms baseline, a difference of ${signed(diff)} ms.`,
      `${signed(diff)} ÷ ${rec.hrv.spread} ms typical spread = ${signed(rec.hrv.z)}. 50 + ${signed(rec.hrv.z)} × 20 = ${n1(rec.hrv.score)}.`,
    );
  }
  if (rec.rhr) {
    const d = rec.rhr.delta;
    const dir = d > 0 ? `${n1(d)} bpm below` : d < 0 ? `${n1(-d)} bpm above` : 'level with';
    recLines.push(
      `Resting heart rate: ${n1(rec.rhr.value)} bpm, ${dir} your ${n1(rec.rhr.baseline)} bpm baseline.`,
      `Each bpm below baseline is worth 3 points: 50 + ${signed(d)} × 3 = ${n1(rec.rhr.score)}.`,
    );
  }
  if (rec.method === 'blend') {
    recLines.push(`Heart rate variability counts for 60% and resting heart rate for 40%: ${n1(rec.hrv!.score)} × 0.6 + ${n1(rec.rhr!.score)} × 0.4 = ${n1(rec.score)}.`);
  } else if (rec.method === 'hrv') {
    recLines.push('No resting heart rate today, so Recovery is the heart rate variability score on its own.');
  } else if (rec.method === 'rhr') {
    recLines.push('No heart rate variability today, so Recovery is the resting heart rate score on its own. Entering HRV by hand on Today adds it.');
  } else {
    recLines.push('No heart rate variability or resting heart rate today, so Recovery sits at a neutral 50 instead of guessing.');
  }
  sections.push({ key: 'recovery', title: 'Recovery', weight: `${pct(w.recovery)} of your score`, result: Math.round(rec.score), lines: recLines });

  // ── Sleep ────────────────────────────────────────────────────────────────
  const sl = e.sleep;
  const slLines: string[] = [];
  if (!sl.parts) {
    slLines.push('No sleep recorded last night, so Sleep sits at a neutral 50.');
  } else {
    for (const p of sl.parts) {
      if (p.key === 'duration') {
        slLines.push(p.value >= p.target
          ? `Time asleep: ${hm(p.value)}, at or above the ${hm(p.target)} target, so 100. Weight 50%.`
          : `Time asleep: ${hm(p.value)} of the ${hm(p.target)} target: ${hm(p.value)} ÷ ${hm(p.target)} × 100 = ${n1(p.score)}. Weight 50%.`);
      } else if (p.key === 'deep') {
        slLines.push(`Deep sleep: ${n1(p.value)}% of the night against a ${n1(p.target)}% target. Hitting the target earns 80, more earns the rest: ${n1(p.score)}. Weight 20%.`);
      } else if (p.key === 'rem') {
        slLines.push(`REM sleep: ${n1(p.value)}% of the night against a ${n1(p.target)}% target: ${n1(p.score)}. Weight 20%.`);
      } else {
        slLines.push(`Efficiency: ${n1(p.value)}% of time in bed asleep against an 85% target: ${n1(p.score)}. Weight 10%.`);
      }
    }
    const missing = (['deep', 'rem', 'efficiency'] as const).filter(k => !sl.parts!.some(p => p.key === k));
    if (missing.length > 0) {
      const names = missing.map(k => (k === 'deep' ? 'deep sleep' : k === 'rem' ? 'REM' : 'time in bed'));
      slLines.push(`Your watch didn't record ${names.join(', ')}. Those parts are left out and the rest are rebalanced, so you aren't marked down for what it can't measure.`);
    }
    const sum = sl.parts.map(p => `${n1(p.score)} × ${p.weight}`).join(' + ');
    slLines.push(sl.parts.length === 1
      ? `Sleep = ${n1(sl.score)}.`
      : `(${sum}) ÷ ${n1(sl.totalWeight)} = ${n1(sl.score)}.`);
  }
  sections.push({ key: 'sleep', title: 'Sleep', weight: `${pct(w.sleep)} of your score`, result: Math.round(sl.score), lines: slLines });

  // ── Stress ───────────────────────────────────────────────────────────────
  const st = e.stress;
  const stLines: string[] = [];
  if (st.tier === 'device' && st.deviceStress !== undefined) {
    stLines.push(`Your device reported a stress level of ${n1(st.deviceStress)}. Low stress is good for readiness, so it is inverted: 100 − ${n1(st.deviceStress)} = ${n1(st.score)}.`);
  } else if (st.tier === 'hrv' && st.hrv) {
    stLines.push(
      'Read from overnight heart rate variability, the same comparison as in Recovery with a gentler slope.',
      `50 + ${signed(st.hrv.z)} × 15 = ${n1(st.score)}.`,
    );
  } else if (st.tier === 'daytime_hr' && st.daytimeHR) {
    const el = st.daytimeHR.elevation;
    stLines.push(
      `No overnight heart rate variability, so daytime heart rate is used. Today it averaged ${n1(st.daytimeHR.value)} bpm, ${n1(el)} bpm above your ${n1(st.daytimeHR.rhrBaseline)} bpm resting baseline.`,
      `An ordinary day runs about 15 bpm above resting. 75 − (${n1(el)} − 15) × 2.5 = ${n1(75 - (el - 15) * 2.5)}, kept between 20 and 90: ${n1(st.score)}.`,
    );
  } else {
    stLines.push('No stress signal today, so Stress sits at a neutral 50 rather than penalising you for data you don\'t have.');
  }
  sections.push({ key: 'stress', title: 'Stress', weight: `${pct(w.stress)} of your score`, result: Math.round(st.score), lines: stLines });

  // ── Baselines ────────────────────────────────────────────────────────────
  const blLines = [
    `Heart rate variability: ${n1(input.hrvBaselineAllMonth)} ms. Resting heart rate: ${n1(input.rhrBaselineAllMonth)} bpm.`,
    'Each is the median of your last 30 days. The lowest 20% of variability nights (illness, alcohol, hard blocks) and the highest 20% of resting heart rate days are left out.',
  ];
  if (input.hrvBaselineAllMonth === DEFAULTS.HRV_BASELINE || input.rhrBaselineAllMonth === DEFAULTS.RHR_BASELINE) {
    blLines.push(`Until your watch has 7 days of data, typical values stand in (${DEFAULTS.HRV_BASELINE} ms and ${DEFAULTS.RHR_BASELINE} bpm). If a number above matches one of those, that is probably why.`);
  }
  sections.push({ key: 'baselines', title: 'Your baselines', lines: blLines });

  // ── Cycle ────────────────────────────────────────────────────────────────
  const c = input.cycle;
  if (c) {
    const phase = c.phase ? PHASE_NAMES[c.phase] : null;
    const cyLines: string[] = [];
    if (c.status === 'active' && phase) {
      cyLines.push(`Today is in your ${phase} phase. Heart rate variability often dips and resting heart rate often rises in parts of the cycle, which an all-month baseline would read as poor recovery.`);
      if (c.hrv !== null) cyLines.push(`Heart rate variability was compared with your own ${phase} nights from earlier cycles: ${n1(c.hrv)} ms from ${c.hrvSamples} nights, instead of ${n1(input.hrvBaselineAllMonth)} ms.`);
      if (c.rhr !== null) cyLines.push(`Resting heart rate was compared with your ${phase} days: ${n1(c.rhr)} bpm from ${c.rhrSamples} days, instead of ${n1(input.rhrBaselineAllMonth)} bpm.`);
      if (input.uncorrectedScore !== null) cyLines.push(`Against the all-month baselines your score would be ${input.uncorrectedScore}.`);
      cyLines.push('The adjustment is capped (heart rate variability within 25%, resting heart rate within 8 bpm of the all-month value) so a few unusual nights can\'t swing it.');
    } else {
      cyLines.push(
        'Collecting. Once two complete cycles are logged and your watch has at least 5 nights from the current phase, today is compared with the same phase of earlier cycles instead of the whole month.',
        `So far: ${c.completedCycles} complete ${c.completedCycles === 1 ? 'cycle' : 'cycles'}${phase ? `, ${c.hrvSamples} ${c.hrvSamples === 1 ? 'night' : 'nights'} of heart rate variability from the ${phase} phase` : ''}.`,
      );
    }
    sections.push({ key: 'cycle', title: 'Cycle adjustment', lines: cyLines });
  }

  return sections;
}
