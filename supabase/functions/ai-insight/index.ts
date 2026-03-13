/**
 * ai-insight — Supabase Edge Function
 *
 * Acts as a secure server-side proxy between the Readiness app and the
 * Anthropic API.  The Claude API key is stored as a Supabase secret and
 * never leaves this function — it is NOT shipped in the app binary.
 *
 * ── Deployment ──────────────────────────────────────────────────────────────
 *   supabase functions deploy ai-insight
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * ── Local dev ───────────────────────────────────────────────────────────────
 *   supabase start
 *   supabase functions serve ai-insight --env-file supabase/.env.local
 *   (supabase/.env.local should contain ANTHROPIC_API_KEY=sk-ant-...)
 *
 * ── Request ──────────────────────────────────────────────────────────────────
 *   POST /functions/v1/ai-insight
 *   Authorization: Bearer <supabase-anon-key>
 *   Content-Type: application/json
 *   Body: AiInsightInput (see types below)
 *
 * ── Response ──────────────────────────────────────────────────────────────────
 *   200 { interpretation: string, advice: string }
 *   4xx { error: string }  — bad request / missing auth
 *   5xx { error: string }  — Claude API failure / misconfiguration
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Expo apps run on localhost in dev and as native apps in production.
// We allow all origins here — the Supabase anon key provides the access control.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightComponent = 'recovery' | 'sleep' | 'stress';

interface HealthData {
  date:              string;
  hrv:               number | null;
  restingHeartRate:  number | null;
  sleepDuration:     number | null;
  deepSleep:         number | null;
  remSleep:          number | null;
  sleepEfficiency:   number | null;
  stressScore:       number | null;
  daytimeAvgHR:      number | null;
}

interface AiInsightInput {
  component:    InsightComponent;
  score:        number;
  statusLabel:  string;
  healthData:   HealthData;
  rhrBaseline:  number;
  hrvBaseline:  number;
}

interface AiInsight {
  interpretation: string;
  advice:         string;
}

// ─── Claude config ────────────────────────────────────────────────────────────

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are a concise, science-literate health coach embedded in a readiness app.

Given a readiness component (Recovery, Sleep, or Stress), its score, and the user's actual biometric values versus their personal baselines, write two short, warm, and actionable pieces of text:

INTERPRETATION: 2–3 sentences explaining what today's numbers mean for this person's body right now — referencing their specific numbers and personal baselines where available.

ADVICE: 1–2 sentences telling them the single most useful thing they can do TODAY based on this data.

Rules:
- Address the user directly ("Your HRV…", "You…")
- Be specific: cite the actual numbers, not vague generalisations
- Be encouraging even for poor scores — frame it as useful information, not a judgement
- Do NOT repeat the score or status label
- Keep INTERPRETATION under 60 words, ADVICE under 35 words
- Format your response EXACTLY as two lines:
  INTERPRETATION: <text>
  ADVICE: <text>`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildUserPrompt(input: AiInsightInput): string {
  const { component, score, statusLabel, healthData: h, rhrBaseline, hrvBaseline } = input;

  const lines: string[] = [
    `Component: ${component.charAt(0).toUpperCase() + component.slice(1)}`,
    `Score: ${Math.round(score)}/100 — ${statusLabel}`,
    '',
  ];

  if (component === 'recovery') {
    lines.push('Overnight recovery metrics:');
    if (h.hrv !== null) {
      const delta = Math.round(h.hrv - hrvBaseline);
      const sign  = delta >= 0 ? '+' : '';
      lines.push(`  HRV: ${h.hrv} ms  (personal 30-day baseline: ${hrvBaseline} ms, delta: ${sign}${delta} ms)`);
    } else {
      lines.push('  HRV: not recorded');
    }
    if (h.restingHeartRate !== null) {
      const delta = Math.round(h.restingHeartRate - rhrBaseline);
      const sign  = delta >= 0 ? '+' : '';
      lines.push(`  Resting HR: ${h.restingHeartRate} bpm  (personal 30-day baseline: ${rhrBaseline} bpm, delta: ${sign}${delta} bpm)`);
    } else {
      lines.push('  Resting HR: not recorded');
    }
    if (h.sleepDuration !== null) {
      const hrs = Math.floor(h.sleepDuration / 60);
      const min = h.sleepDuration % 60;
      lines.push(`  Sleep duration: ${hrs}h ${min}m`);
    }
  }

  if (component === 'sleep') {
    lines.push('Sleep metrics:');
    if (h.sleepDuration !== null) {
      const hrs = Math.floor(h.sleepDuration / 60);
      const min = h.sleepDuration % 60;
      lines.push(`  Total sleep: ${hrs}h ${min}m`);
    } else {
      lines.push('  Total sleep: not recorded');
    }
    if (h.sleepEfficiency !== null) lines.push(`  Sleep efficiency: ${h.sleepEfficiency}%`);
    if (h.deepSleep       !== null) lines.push(`  Deep sleep: ${h.deepSleep} min`);
    if (h.remSleep        !== null) lines.push(`  REM sleep: ${h.remSleep} min`);
  }

  if (component === 'stress') {
    lines.push('Stress & autonomic signals:');
    if (h.stressScore !== null) {
      lines.push(`  Garmin stress index: ${h.stressScore}/100`);
    }
    if (h.hrv !== null) {
      const delta = Math.round(h.hrv - hrvBaseline);
      const sign  = delta >= 0 ? '+' : '';
      lines.push(`  HRV: ${h.hrv} ms  (baseline: ${hrvBaseline} ms, delta: ${sign}${delta} ms)`);
    }
    if (h.daytimeAvgHR !== null) {
      const elevation = Math.round(h.daytimeAvgHR - rhrBaseline);
      const sign      = elevation >= 0 ? '+' : '';
      lines.push(`  Daytime avg HR: ${h.daytimeAvgHR} bpm  (RHR baseline: ${rhrBaseline} bpm, elevation: ${sign}${elevation} bpm)`);
    }
  }

  return lines.join('\n');
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseInsight(raw: string): AiInsight {
  const interpretMatch = raw.match(/INTERPRETATION:\s*([\s\S]+?)(?=\nADVICE:|$)/i);
  const adviceMatch    = raw.match(/ADVICE:\s*([\s\S]+?)$/i);

  if (!interpretMatch?.[1]?.trim() || !adviceMatch?.[1]?.trim()) {
    throw new Error(`Unexpected AI response format: ${raw.slice(0, 100)}`);
  }

  return {
    interpretation: interpretMatch[1].trim(),
    advice:         adviceMatch[1].trim(),
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Parse request body ──────────────────────────────────────────────────
    let input: AiInsightInput;
    try {
      input = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Basic input validation
    if (!input.component || !['recovery', 'sleep', 'stress'].includes(input.component)) {
      return new Response(JSON.stringify({ error: 'Invalid component' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Read API key from server-side secret ────────────────────────────────
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      console.error('[ai-insight] ANTHROPIC_API_KEY secret is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Call Claude ─────────────────────────────────────────────────────────
    const claudeRes = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 250,
        system:     SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(input) }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text().catch(() => '');
      console.error(`[ai-insight] Claude API error ${claudeRes.status}:`, errText);
      return new Response(JSON.stringify({ error: `Upstream API error: ${claudeRes.status}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeRes.json();
    const text: string = claudeData.content?.[0]?.text ?? '';

    // ── Parse and return ────────────────────────────────────────────────────
    const insight = parseInsight(text);
    return new Response(JSON.stringify(insight), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai-insight] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
