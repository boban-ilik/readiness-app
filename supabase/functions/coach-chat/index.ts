/**
 * coach-chat — Supabase Edge Function
 *
 * Powers the "Ask your coach" conversational layer inside the daily briefing modal.
 * The AI has full access to the user's current biometrics and detected patterns,
 * making every answer specific to their actual data — not generic advice.
 *
 * ── Deployment ───────────────────────────────────────────────────────────────
 *   supabase functions deploy coach-chat --no-verify-jwt
 *
 * ── Request ──────────────────────────────────────────────────────────────────
 *   POST /functions/v1/coach-chat
 *   Body: CoachChatInput
 *
 * ── Response ─────────────────────────────────────────────────────────────────
 *   200 { answer: string }
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthData {
  hrv:              number | null;
  restingHeartRate: number | null;
  sleepDuration:    number | null;
  deepSleep:        number | null;
  remSleep:         number | null;
  sleepEfficiency:  number | null;
  stressScore:      number | null;
  steps:            number | null;
}

interface PatternInsight {
  type:     string;
  severity: 'info' | 'warning' | 'alert';
  message:  string;
}

interface WorkloadResult {
  dailyLoad:  number;
  isHighLoad: boolean;
  workouts:   Array<{ type: string; durationMins: number; intensityTier: string }>;
}

interface LifeEvent {
  date:       string;
  event_type: string;
  notes:      string | null;
}

interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

interface UserProfile {
  name?:              string;
  age?:               number;
  sex?:               'male' | 'female' | 'prefer_not_to_say';
  heightCm?:          number;
  weightKg?:          number;
  bmi?:               number;
  trainingFrequency?: 'light' | 'moderate' | 'high';
  primaryGoal?:       'performance' | 'recovery' | 'weight_loss' | 'general_health';
}

interface CoachChatInput {
  question:   string;
  score:      number;
  scoreLabel: string;
  components: { recovery: number; sleep: number; stress: number };
  healthData:   HealthData;
  rhrBaseline:  number;
  hrvBaseline:  number;
  patterns:     PatternInsight[];
  workload:     WorkloadResult | null;
  lifeEvents:   LifeEvent[];       // recent tagged events (last 7 days)
  history:      ChatMessage[];     // last 6 turns for context
  profile?:     UserProfile;       // personal details from profile screen
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the user's personal health coach inside the Readiness app.

You have real-time access to their biometric data, personal profile (age, sex, height, weight, training goal), detected patterns from the past 30 days, and any life events they have tagged (illness, travel, poor sleep, etc.). Use all of this to give specific, personalised answers — not generic advice.

Your tone: warm, direct, like a knowledgeable friend who happens to have a sports science degree. Address the user by name if you know it. No excessive caveats. No "I recommend consulting a doctor" on routine questions — they know you're an AI coach.

Rules:
- Always reference their actual numbers when relevant (e.g. "your HRV is 48ms vs your 62ms baseline")
- Factor in their profile when relevant: a 25-year-old male training 6 days/week for performance needs different advice than a 45-year-old training for general health
- Keep answers concise — 2-4 sentences unless the question genuinely needs more
- If the question is outside health/recovery/training, politely redirect to what you can help with
- Be honest: if something looks concerning, say so clearly but kindly
- Never diagnose conditions — but you can say "this pattern looks like overtraining" or "this drop is consistent with poor sleep recovery"`;

function freqLabel(f: UserProfile['trainingFrequency']): string {
  if (f === 'light')    return '2–3 days/week';
  if (f === 'moderate') return '4–5 days/week';
  if (f === 'high')     return '6+ days/week';
  return 'unknown';
}

function goalLabel(g: UserProfile['primaryGoal']): string {
  if (g === 'performance')    return 'peak performance';
  if (g === 'recovery')       return 'optimise recovery';
  if (g === 'weight_loss')    return 'lose weight';
  if (g === 'general_health') return 'general health';
  return 'unknown';
}

function buildContext(input: CoachChatInput): string {
  const { score, scoreLabel, components, healthData: h, rhrBaseline, hrvBaseline, patterns, workload, lifeEvents, profile } = input;

  const lines: string[] = [];

  // ── Profile ────────────────────────────────────────────────────────────────
  if (profile && Object.keys(profile).length > 0) {
    const p = profile;
    const parts: string[] = [];
    if (p.name)              parts.push(`Name: ${p.name}`);
    if (p.age)               parts.push(`Age: ${p.age}`);
    if (p.sex && p.sex !== 'prefer_not_to_say') parts.push(`Sex: ${p.sex}`);
    if (p.heightCm)          parts.push(`Height: ${p.heightCm}cm`);
    if (p.weightKg)          parts.push(`Weight: ${p.weightKg}kg`);
    if (p.bmi)               parts.push(`BMI: ${p.bmi}`);
    if (p.trainingFrequency) parts.push(`Training frequency: ${freqLabel(p.trainingFrequency)}`);
    if (p.primaryGoal)       parts.push(`Primary goal: ${goalLabel(p.primaryGoal)}`);
    if (parts.length > 0) {
      lines.push('User profile:');
      for (const part of parts) lines.push(`  ${part}`);
      lines.push('');
    }
  }

  lines.push(
    `Current readiness: ${score}/100 (${scoreLabel})`,
    `Components — Recovery: ${components.recovery} | Sleep: ${components.sleep} | Stress: ${components.stress}`,
    '',
    'Biometrics:',
  );

  if (h.hrv !== null) {
    const d = Math.round(h.hrv - hrvBaseline);
    lines.push(`  HRV: ${h.hrv}ms (baseline: ${hrvBaseline}ms, delta: ${d >= 0 ? '+' : ''}${d}ms)`);
  }
  if (h.restingHeartRate !== null) {
    const d = Math.round(h.restingHeartRate - rhrBaseline);
    lines.push(`  RHR: ${h.restingHeartRate}bpm (baseline: ${rhrBaseline}bpm, delta: ${d >= 0 ? '+' : ''}${d}bpm)`);
  }
  if (h.sleepDuration !== null) lines.push(`  Sleep: ${(h.sleepDuration / 60).toFixed(1)}h`);
  if (h.deepSleep !== null)     lines.push(`  Deep sleep: ${h.deepSleep}min`);
  if (h.remSleep !== null)      lines.push(`  REM: ${h.remSleep}min`);
  if (h.sleepEfficiency !== null) lines.push(`  Sleep efficiency: ${h.sleepEfficiency}%`);
  if (h.stressScore !== null)   lines.push(`  Stress index: ${h.stressScore}/100`);
  if (h.steps !== null)         lines.push(`  Steps yesterday: ${h.steps.toLocaleString()}`);

  if (workload && workload.workouts.length > 0) {
    lines.push('');
    lines.push(`Yesterday's training (load: ${workload.dailyLoad}/100${workload.isHighLoad ? ' — HIGH' : ''}):`);
    for (const w of workload.workouts) {
      lines.push(`  • ${w.type} — ${w.durationMins}min (${w.intensityTier})`);
    }
  }

  if (patterns.length > 0) {
    lines.push('');
    lines.push('Detected 30-day patterns:');
    for (const p of patterns) {
      const badge = p.severity === 'alert' ? '🔴' : p.severity === 'warning' ? '🟡' : 'ℹ️';
      lines.push(`  ${badge} ${p.message}`);
    }
  }

  if (lifeEvents.length > 0) {
    lines.push('');
    lines.push('Recent life events tagged by the user:');
    for (const e of lifeEvents) {
      const noteStr = e.notes ? ` — "${e.notes}"` : '';
      lines.push(`  • ${e.date}: ${e.event_type}${noteStr}`);
    }
  }

  return lines.join('\n');
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const input: CoachChatInput = await req.json();

    if (!input.question?.trim() || typeof input.score !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Build message array: context as first user turn, then conversation history, then new question
    const contextBlock = buildContext(input);
    const messages: ChatMessage[] = [
      { role: 'user',      content: `Here is my current health context:\n\n${contextBlock}` },
      { role: 'assistant', content: "Got it — I have your data loaded. What would you like to know?" },
      // Inject up to last 6 history turns for continuity
      ...input.history.slice(-6),
      // New question
      { role: 'user', content: input.question },
    ];

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      return new Response(JSON.stringify({ error: `Upstream error: ${claudeRes.status}` }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data  = await claudeRes.json();
    const answer = data.content?.[0]?.text?.trim() ?? '';

    return new Response(JSON.stringify({ answer }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[coach-chat] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
