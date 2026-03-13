/**
 * Training Load Recommendation Engine
 *
 * Converts a readiness score + component breakdown into a plain-English
 * training prescription that any user can act on immediately — no fitness
 * jargon required.
 *
 * Each tier includes:
 *   - A friendly headline and concrete activity suggestions
 *   - An effort description that explains what the number feels like in the body
 *   - A plain-language rationale explaining WHY this prescription was given
 *
 * Zone labels are kept internally for device-sync purposes but are not
 * surfaced in the primary UI.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingIntensity =
  | 'rest'
  | 'recovery'
  | 'easy'
  | 'moderate'
  | 'quality'
  | 'peak';

export interface TrainingRecommendation {
  intensity:          TrainingIntensity;
  headline:           string;   // Short action label, e.g. "Push Hard Today"
  zone:               number;   // 0–5 (for device badge display only)
  zoneName:           string;   // Internal zone label (Garmin/Polar compatible)
  zoneColor:          string;   // Hex colour for the zone badge
  durationMin:        number;   // Minimum recommended minutes
  durationMax:        number;   // Maximum recommended minutes
  rpe:                string;   // Borg RPE 1–10 range, e.g. "6–7"
  effortDescription:  string;   // Plain-English feel: what does this effort feel like?
  suggestedActivities: string;  // Concrete examples of what to do
  rationale:          string;   // Why this recommendation, based on today's data
}

// ─── Zone colours ─────────────────────────────────────────────────────────────

const ZONE_COLORS: Record<number, string> = {
  0: '#5A6180',   // rest
  1: '#9BA3B8',   // very light
  2: '#43A047',   // aerobic
  3: '#F5A623',   // tempo
  4: '#F4511E',   // threshold
  5: '#E53935',   // VO2max
};

// ─── Tiers ────────────────────────────────────────────────────────────────────

interface Tier {
  minScore:           number;
  intensity:          TrainingIntensity;
  headline:           string;
  zone:               number;
  zoneName:           string;
  durationMin:        number;
  durationMax:        number;
  rpe:                string;
  effortDescription:  string;
  suggestedActivities: string;
}

const TIERS: Tier[] = [
  {
    minScore:  86,
    intensity: 'peak',
    headline:  'Push Hard Today',
    zone:      5,
    zoneName:  'Zone 4–5 — Threshold / VO₂',
    durationMin: 60,
    durationMax: 90,
    rpe:       '8–9',
    effortDescription:
      'Very hard — you can say a few words but not sentences. ' +
      'You\'re working at near-maximum. On a 1–10 scale, 10 is an all-out sprint.',
    suggestedActivities:
      'Intervals, tempo run, race-pace cycling, HIIT, or a hard gym session. ' +
      'This is your window for PR-chasing efforts.',
  },
  {
    minScore:  71,
    intensity: 'quality',
    headline:  'Strong Workout Day',
    zone:      4,
    zoneName:  'Zone 3–4 — Tempo / Threshold',
    durationMin: 60,
    durationMax: 75,
    rpe:       '6–7',
    effortDescription:
      'Comfortably hard — breathing deeply, you can speak in short phrases ' +
      'but prefer not to. Feels like a solid effort you couldn\'t sustain all day.',
    suggestedActivities:
      'Tempo run, steady-state bike or row, structured swim, or a challenging ' +
      'strength session. Aim to finish tired but not destroyed.',
  },
  {
    minScore:  56,
    intensity: 'moderate',
    headline:  'Steady Training Day',
    zone:      3,
    zoneName:  'Zone 2–3 — Aerobic / Tempo',
    durationMin: 50,
    durationMax: 70,
    rpe:       '4–5',
    effortDescription:
      'Somewhat hard — you can speak in full sentences but you notice the ' +
      'effort. Breathing is deeper, but you\'re comfortably in control.',
    suggestedActivities:
      'A comfortable run or bike ride, moderate-intensity swim, Pilates, ' +
      'or a moderate gym session. Keep the intensity consistent throughout.',
  },
  {
    minScore:  41,
    intensity: 'easy',
    headline:  'Easy Day',
    zone:      2,
    zoneName:  'Zone 2 — Aerobic Base',
    durationMin: 40,
    durationMax: 60,
    rpe:       '3–4',
    effortDescription:
      'Easy — you can hold a full conversation without pausing for breath. ' +
      'If you\'re finding it hard to talk, slow down. This should feel almost too easy.',
    suggestedActivities:
      'Easy jog, brisk walk, gentle cycling, light swimming, or yoga. ' +
      'The "easy" in easy day is non-negotiable — resist the urge to go harder.',
  },
  {
    minScore:  26,
    intensity: 'recovery',
    headline:  'Light Movement Only',
    zone:      1,
    zoneName:  'Zone 1 — Active Recovery',
    durationMin: 20,
    durationMax: 35,
    rpe:       '2–3',
    effortDescription:
      'Very easy — this should feel like a gentle stroll. Your heart rate ' +
      'barely rises. If you feel like you\'re exercising, you\'re going too hard.',
    suggestedActivities:
      'Slow walk, gentle stretching, foam rolling, restorative yoga, or a ' +
      'leisurely swim. The goal is blood flow, not fitness.',
  },
  {
    minScore:  0,
    intensity: 'rest',
    headline:  'Rest Today',
    zone:      0,
    zoneName:  'Rest',
    durationMin: 0,
    durationMax: 0,
    rpe:       '1',
    effortDescription:
      'Complete rest. Your body is asking for recovery, not more stimulus. ' +
      'Skipping training today is the right call — not the lazy one.',
    suggestedActivities:
      'Sleep in, take a nap, go for a very slow walk if you need to move. ' +
      'Eat well, stay hydrated, and prioritise getting to bed early tonight.',
  },
];

// ─── Rationale builder ────────────────────────────────────────────────────────
// Plain-English explanation of WHY this recommendation was made today.

function buildRationale(
  score: number,
  components: { recovery: number; sleep: number; stress: number },
  intensity: TrainingIntensity,
): string {
  const { recovery, sleep, stress } = components;

  const weakest = [
    { name: 'recovery', value: recovery },
    { name: 'sleep',    value: sleep    },
    { name: 'stress',   value: stress   },
  ].sort((a, b) => a.value - b.value)[0];

  if (intensity === 'rest') {
    if (weakest.name === 'recovery' && recovery < 40)
      return 'Your heart and nervous system haven\'t bounced back yet — your resting heart rate and heart rate variability both signal you need more time. Skipping training today will make you stronger tomorrow.';
    if (weakest.name === 'sleep' && sleep < 40)
      return 'You didn\'t get enough quality sleep and your body can\'t perform or adapt right now. More training would just dig a deeper hole — rest is the most productive thing you can do today.';
    return 'Recovery, sleep, and stress are all in the red. Your body is sending a clear signal — give it the break it\'s asking for.';
  }

  if (intensity === 'recovery') {
    if (weakest.name === 'recovery')
      return 'Your body shows signs of lingering fatigue — heart rate is elevated or heart rate variability is down. Light movement improves circulation and speeds recovery without adding strain.';
    if (weakest.name === 'sleep')
      return 'Last night\'s sleep held your score back. Keep it very easy today and focus on getting to bed early tonight.';
    return 'Your readiness is low today. Some gentle movement is fine, but any real intensity would slow your recovery rather than build your fitness.';
  }

  if (intensity === 'easy') {
    if (weakest.name === 'sleep')
      return 'Your sleep quality was below par. An easy session is fine and won\'t set you back, but save the harder efforts for when you\'re better rested.';
    if (weakest.name === 'recovery')
      return 'Your recovery numbers are moderate. An easy aerobic session builds your base without putting extra stress on a system that\'s still catching up.';
    return 'You\'re in a solid but conservative range. An easy session today keeps momentum without risking unnecessary fatigue.';
  }

  if (intensity === 'moderate') {
    if (recovery > sleep && sleep < 65)
      return 'Your body is well-recovered but sleep wasn\'t ideal — a steady, controlled workout is a great fit. Your legs are ready; just don\'t push past what feels comfortable.';
    if (sleep > recovery && recovery < 65)
      return 'You slept well but recovery signals are only moderate. A steady session is fine — just keep an eye on how your heart rate responds and back off if it feels harder than expected.';
    return 'All your numbers are in a good, balanced range. A steady workout today will build your fitness without overdoing it.';
  }

  if (intensity === 'quality') {
    if (stress > 80)
      return 'You\'re well-recovered, well-rested, and your body is under low stress. Everything is lined up for a solid training session — make it count.';
    return 'Recovery and sleep are both strong. You\'re ready to handle some real intensity — a quality session today will give you a meaningful fitness boost.';
  }

  // peak
  return 'All three pillars — recovery, sleep, and stress — are green. This kind of full-readiness day doesn\'t come around every week. Hit it hard.';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getTrainingRecommendation(
  score: number,
  components: { recovery: number; sleep: number; stress: number },
): TrainingRecommendation {
  const tier = TIERS.find(t => score >= t.minScore) ?? TIERS[TIERS.length - 1];

  return {
    intensity:           tier.intensity,
    headline:            tier.headline,
    zone:                tier.zone,
    zoneName:            tier.zoneName,
    zoneColor:           ZONE_COLORS[tier.zone] ?? ZONE_COLORS[1],
    durationMin:         tier.durationMin,
    durationMax:         tier.durationMax,
    rpe:                 tier.rpe,
    effortDescription:   tier.effortDescription,
    suggestedActivities: tier.suggestedActivities,
    rationale:           buildRationale(score, components, tier.intensity),
  };
}
