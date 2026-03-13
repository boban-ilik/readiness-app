/**
 * weekly-report — Supabase Edge Function
 *
 * Returns a structured weekly readiness report for the authenticated user.
 *
 * Response shape:
 *   {
 *     summary:       string          — 2-3 sentence narrative
 *     tip:           string          — one specific actionable tip
 *     trend:         'improving' | 'declining' | 'stable'
 *     avgScore:      number
 *     bestDay:       { date, score, dayLabel }
 *     worstDay:      { date, score, dayLabel }
 *     topComponent:  'recovery' | 'sleep' | 'stress'
 *     weakComponent: 'recovery' | 'sleep' | 'stress' | null
 *     scores:        { date, score, dayLabel, components }[]
 *     weekOf:        string  — ISO date of generation
 *   }
 */

// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function trend(scores: number[]): 'improving' | 'declining' | 'stable' {
  if (scores.length < 3) return 'stable';
  const half   = Math.floor(scores.length / 2);
  const first  = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = scores.slice(-half).reduce((a, b) => a + b, 0) / half;
  const diff   = second - first;
  if (diff >  4) return 'improving';
  if (diff < -4) return 'declining';
  return 'stable';
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Fetch last 7 days ─────────────────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data: rows, error: rowsError } = await userSupabase
      .from('readiness_scores')
      .select('date, score, recovery_score, sleep_score, stress_score, hrv, rhr, sleep_duration')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .order('date', { ascending: true });

    if (rowsError) throw new Error(rowsError.message);
    if (!rows || rows.length < 3) {
      return json({ error: 'Not enough data yet (need at least 3 tracked days)' }, 422);
    }

    // ── Compute stats ─────────────────────────────────────────────────────────
    const scoreValues = rows.map((r: any) => r.score as number);
    const avgScore    = Math.round(scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length);
    const trendDir    = trend(scoreValues);

    const bestRow  = rows.reduce((a: any, b: any) => b.score > a.score ? b : a);
    const worstRow = rows.reduce((a: any, b: any) => b.score < a.score ? b : a);

    const avgRecovery = Math.round(rows.reduce((a: number, r: any) => a + (r.recovery_score ?? 0), 0) / rows.length);
    const avgSleep    = Math.round(rows.reduce((a: number, r: any) => a + (r.sleep_score    ?? 0), 0) / rows.length);
    const avgStress   = Math.round(rows.reduce((a: number, r: any) => a + (r.stress_score   ?? 0), 0) / rows.length);

    const compMap: Record<string, number> = { recovery: avgRecovery, sleep: avgSleep, stress: avgStress };
    const topComponent  = Object.entries(compMap).sort((a, b) => b[1] - a[1])[0][0] as 'recovery' | 'sleep' | 'stress';
    const weakComponent = avgRecovery < 45 ? 'recovery'
                        : avgSleep    < 45 ? 'sleep'
                        : avgStress   < 45 ? 'stress'
                        : null;

    const scoresShaped = rows.map((r: any) => ({
      date:       r.date,
      score:      r.score,
      dayLabel:   dayLabel(r.date),
      components: {
        recovery: r.recovery_score ?? 0,
        sleep:    r.sleep_score    ?? 0,
        stress:   r.stress_score   ?? 0,
      },
    }));

    // ── Build Claude prompt ───────────────────────────────────────────────────
    const scoreLines = rows.map((r: any) => {
      const hrvNote = r.hrv ? ` · HRV ${Math.round(r.hrv)}ms` : '';
      const rhrNote = r.rhr ? ` · RHR ${r.rhr}bpm`            : '';
      return `${r.date} (${dayLabel(r.date)}): overall ${r.score} (recovery ${r.recovery_score}, sleep ${r.sleep_score}, stress ${r.stress_score})${hrvNote}${rhrNote}`;
    }).join('\n');

    const trendNote = trendDir === 'improving' ? 'an upward trend'
                    : trendDir === 'declining' ? 'a downward trend'
                    : 'a stable trend';

    const prompt =
      `You are a warm, expert performance coach writing a weekly readiness summary.\n\n` +
      `Data (${rows.length} days, ${trendNote}, avg ${avgScore}/100):\n${scoreLines}\n\n` +
      `Strongest component this week: ${topComponent}` +
      (weakComponent ? `\nArea needing attention: ${weakComponent}` : '') + `\n\n` +
      `Return ONLY valid JSON (no markdown, no code fences) with exactly these two keys:\n` +
      `{\n` +
      `  "summary": "2-3 sentences describing the week's trend and any standout days",\n` +
      `  "tip": "one specific, actionable sentence for the coming week based on the weakest area"\n` +
      `}\n\n` +
      `Tone: encouraging, evidence-based, personal. No generic platitudes.`;

    // ── Call Claude ───────────────────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude API error ${claudeRes.status}`);

    const claudeData = await claudeRes.json();
    const rawText    = claudeData.content?.[0]?.text ?? '';
    if (!rawText) throw new Error('Empty response from Claude');

    // Parse structured response; fall back gracefully if JSON is malformed
    let summary = rawText;
    let tip     = '';
    try {
      const parsed = JSON.parse(rawText);
      summary = parsed.summary ?? rawText;
      tip     = parsed.tip     ?? '';
    } catch {
      // Claude didn't return valid JSON — use the raw text as summary
      summary = rawText;
    }

    const today = new Date().toISOString().split('T')[0];

    return json({
      summary,
      tip,
      trend:         trendDir,
      avgScore,
      bestDay:       { date: bestRow.date,  score: bestRow.score,  dayLabel: dayLabel(bestRow.date)  },
      worstDay:      { date: worstRow.date, score: worstRow.score, dayLabel: dayLabel(worstRow.date) },
      topComponent,
      weakComponent,
      scores:        scoresShaped,
      weekOf:        today,
    });

  } catch (err: any) {
    console.error('[weekly-report]', err.message);
    return json({ error: 'Failed to generate weekly report' }, 500);
  }
});
