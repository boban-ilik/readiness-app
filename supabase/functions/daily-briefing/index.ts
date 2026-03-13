/**
 * daily-briefing — Supabase Edge Function
 *
 * Generates a full personalised daily readiness briefing using Claude.
 * Called when a Pro user taps their score ring on the home screen.
 *
 * ── Deployment ───────────────────────────────────────────────────────────────
 *   supabase functions deploy daily-briefing --no-verify-jwt
 *
 * ── Request ──────────────────────────────────────────────────────────────────
 *   POST /functions/v1/daily-briefing
 *   Authorization: Bearer <supabase-anon-key>
 *   Body: DailyBriefingInput
 *
 * ── Response ─────────────────────────────────────────────────────────────────
 *   200 DailyBriefing
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthData {
  date:             string;
  hrv:              number | null;
  restingHeartRate: number | null;
  sleepDuration:    number | null;
  deepSleep:        number | null;
  remSleep:         number | null;
  sleepEfficiency:  number | null;
  stressScore:      number | null;
  daytimeAvgHR:     number | null;
  steps:            number | null;
}

interface PatternInsight {
  type:     string;
  severity: 'info' | 'warning' | 'alert';
  message:  string;
}

interface WorkoutSummary {
  type:          string;
  durationMins:  number;
  calories:      number | null;
  intensityTier: 'easy' | 'moderate' | 'hard';
  load:          number;
}

interface WorkloadResult {
  workouts:   WorkoutSummary[];
  dailyLoad:  number;
  isHighLoad: boolean;
}

interface BriefingFeedback {
  date:   string;
  rating: 'helpful' | 'unhelpful';
}

interface LifeEvent {
  id:         string;
  date:       string;   // YYYY-MM-DD
  event_type: string;
  notes:      string | null;
}

interface DailyBriefingInput {
  score:       number;
  scoreLabel:  string;
  components: {
    recovery: number;
    sleep:    number;
    stress:   number;
  };
  healthData:   HealthData;
  rhrBaseline:  number;
  hrvBaseline:  number;
  /** Longitudinal patterns detected from 30 days of history. May be empty. */
  patterns:     PatternInsight[];
  /** Yesterday's training load from HealthKit workouts. Null if no workouts. */
  workload:     WorkloadResult | null;
  /** Life events tagged by the user in the last 7 days. */
  lifeEvents?:        LifeEvent[];
  /** User's rating of yesterday's briefing. Used to calibrate today's specificity. */
  yesterdayFeedback?: BriefingFeedback | null;
}

interface DailyBriefing {
  headline:    string;   // One punchy sentence — the TL;DR
  overview:    string;   // 2–3 sentences: what's happening in the body today
  focusAreas:  string[]; // 2–3 bullet points: what needs attention
  actionPlan:  string;   // 2–3 sentences: what to concretely do today
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a knowledgeable, warm health coach inside a readiness app.

Given a user's readiness score, component breakdown, biometric data, and detected longitudinal patterns from the past 30 days, generate a concise but rich daily briefing. Write like a smart friend who understands sports science — clear, direct, no fluff, no generic platitudes.

When longitudinal patterns are present, weave them naturally into the briefing. Do NOT list the patterns verbatim — synthesise them into coaching language. For example, "This is the third consecutive day your HRV has dropped, which is a classic early-warning signal." is better than robotically repeating the pattern message.

Respond with EXACTLY this format (no extra text, no markdown):

HEADLINE: <one punchy sentence summarising the day — e.g. "Strong recovery, but sleep quality held you back.">

OVERVIEW: <2–3 sentences explaining what's happening in the body today. Reference specific numbers (HRV, RHR, sleep duration etc.) vs their personal baselines where available. Be specific, not generic.>

FOCUS:
1. <first specific focus area for today — one sentence>
2. <second specific focus area — one sentence>
3. <third specific focus area — one sentence, or omit if only 2 are relevant>

ACTION_PLAN: <2–3 sentences of concrete things to do today. Be specific — mention training zones, sleep times, stress management techniques, nutrition timing, etc. based on the actual data.>`;

function buildPrompt(input: DailyBriefingInput): string {
  const { score, scoreLabel, components, healthData: h, rhrBaseline, hrvBaseline, patterns, workload } = input;

  const lines: string[] = [
    `Overall readiness: ${score}/100 (${scoreLabel})`,
    `Components — Recovery: ${components.recovery}/100 | Sleep: ${components.sleep}/100 | Stress: ${components.stress}/100`,
    '',
    'Biometrics:',
  ];

  if (h.hrv !== null) {
    const d = Math.round(h.hrv - hrvBaseline);
    lines.push(`  Heart rate variability: ${h.hrv} ms  (personal baseline: ${hrvBaseline} ms, delta: ${d >= 0 ? '+' : ''}${d} ms)`);
  }
  if (h.restingHeartRate !== null) {
    const d = Math.round(h.restingHeartRate - rhrBaseline);
    lines.push(`  Resting heart rate: ${h.restingHeartRate} bpm  (personal baseline: ${rhrBaseline} bpm, delta: ${d >= 0 ? '+' : ''}${d} bpm)`);
  }
  if (h.sleepDuration !== null) {
    const hrs = (h.sleepDuration / 60).toFixed(1);
    lines.push(`  Sleep duration: ${hrs} hours`);
  }
  if (h.sleepEfficiency !== null) {
    lines.push(`  Sleep efficiency: ${Math.round(h.sleepEfficiency * 100)}%`);
  }
  if (h.deepSleep !== null) {
    lines.push(`  Deep sleep: ${h.deepSleep} min`);
  }
  if (h.remSleep !== null) {
    lines.push(`  REM sleep: ${h.remSleep} min`);
  }
  if (h.stressScore !== null) {
    lines.push(`  Stress index: ${h.stressScore}/100`);
  }
  if (h.daytimeAvgHR !== null) {
    lines.push(`  Daytime avg heart rate: ${h.daytimeAvgHR} bpm`);
  }
  if (h.steps !== null) {
    lines.push(`  Steps yesterday: ${h.steps.toLocaleString()}`);
  }

  // ── Yesterday's training load ───────────────────────────────────────────────
  if (workload && workload.workouts.length > 0) {
    lines.push('');
    lines.push(`Yesterday's training (load index: ${workload.dailyLoad}/100${workload.isHighLoad ? ' — HIGH LOAD day' : ''}):`);
    for (const w of workload.workouts) {
      const calStr = w.calories ? `, ~${w.calories} kcal` : '';
      lines.push(`  • ${w.type} — ${w.durationMins} min (${w.intensityTier}${calStr})`);
    }
    lines.push('  Use this to contextualise whether today\'s lower readiness is expected post-exercise fatigue, and whether today calls for active recovery or rest.');
  }

  // ── Longitudinal patterns (30-day history) ──────────────────────────────────
  if (patterns && patterns.length > 0) {
    lines.push('');
    lines.push('Detected patterns from the past 30 days (use these to give historically-informed coaching):');
    for (const p of patterns) {
      const badge = p.severity === 'alert' ? '🔴' : p.severity === 'warning' ? '🟡' : 'ℹ️';
      lines.push(`  ${badge} ${p.message}`);
    }
  }

  // ── Life events (last 7 days) ────────────────────────────────────────────────
  if (input.lifeEvents && input.lifeEvents.length > 0) {
    lines.push('');
    lines.push('Life events the user has tagged in the last 7 days:');
    for (const e of input.lifeEvents) {
      const noteStr = e.notes ? ` — "${e.notes}"` : '';
      lines.push(`  • ${e.date}: ${e.event_type}${noteStr}`);
    }
    lines.push('  Factor these into your coaching: if a life event aligns with a data drop (e.g. alcohol → low HRV), name the connection explicitly. If multiple events cluster, note the pattern.');
  }

  // ── Yesterday's briefing feedback ───────────────────────────────────────────
  if (input.yesterdayFeedback?.rating === 'unhelpful') {
    lines.push('');
    lines.push('User feedback: The user rated yesterday\'s briefing as NOT HELPFUL.');
    lines.push('Today, raise the specificity bar significantly:');
    lines.push('  • Quote exact numbers (e.g. "Your HRV of 42 ms is 18% below your 51 ms baseline")');
    lines.push('  • Name concrete actions with timing (e.g. "Keep intensity below 140 bpm for the first 20 min")');
    lines.push('  • Tie every recommendation directly to a specific data point — no generic advice');
    lines.push('  • If a pattern is present, name the trend explicitly (e.g. "third consecutive drop")');
  }

  return lines.join('\n');
}

function parseBriefing(raw: string): DailyBriefing {
  // Extract a single-line field that ends at the next ALL_CAPS key or end-of-string
  const getField = (key: string) =>
    raw.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'))?.[1]?.trim() ?? '';

  const headline   = getField('HEADLINE');
  const overview   = getField('OVERVIEW');
  const actionPlan = getField('ACTION_PLAN');

  // Extract the FOCUS block (everything between "FOCUS:" and the next ALL_CAPS key)
  const focusBlock  = raw.match(/FOCUS:\s*\n([\s\S]+?)(?=\n[A-Z_]+:|$)/)?.[1] ?? '';
  const focusAreas  = focusBlock
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())   // strip "1. " / "2. " / "3. "
    .filter(Boolean);

  if (!headline || !overview || focusAreas.length === 0 || !actionPlan) {
    throw new Error('Unexpected AI response format');
  }

  return { headline, overview, focusAreas, actionPlan };
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
    const input: DailyBriefingInput = await req.json();

    if (typeof input.score !== 'number' || !input.components || !input.healthData) {
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

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 650,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: buildPrompt(input) }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: `Upstream error: ${claudeRes.status}` }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeRes.json();
    const text: string = claudeData.content?.[0]?.text ?? '';
    const briefing = parseBriefing(text);

    return new Response(JSON.stringify(briefing), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[daily-briefing] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
