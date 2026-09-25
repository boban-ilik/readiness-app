/**
 * coachChat.ts
 *
 * Client-side service for the "Ask your coach" conversational layer.
 * Sends the user's question + full health context to the coach-chat Edge Function.
 */

import { supabase } from '@services/supabase';
import type { ReadinessResult } from '@utils/readiness';
import { getCycleContext } from '@services/cycleTracking';
import type { HealthData } from '@/types/index';
import type { PatternInsight } from '@services/patternAnalysis';
import type { WorkloadResult } from '@services/workloadAnalysis';
import type { LifeEvent } from '@services/lifeEvents';
import type { UserProfile } from '@services/userProfile';
import type { CoachExtras } from '@services/coachContext';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
  /**
   * Local date the message was written, YYYY-MM-DD. Absent on messages stored
   * before this field existed, which are treated as older than today.
   */
  date?:   string;
  /** Facts the coach saved from this answer, shown under it (display only) */
  remembered?: string[];
  /** The user's thumbs rating of a coach answer (display only) */
  rating?: 'up' | 'down';
}

export interface CoachReply {
  answer:   string;
  /** New durable facts to remember (0-3); empty from servers older than 1.0.4 */
  remember: string[];
  /** Free-tier questions left this week; null for trial and Pro */
  freeRemaining: number | null;
}

/** Failure with a kind the screen can act on (show the paywall, say come back tomorrow). */
export class CoachError extends Error {
  constructor(public kind: 'pro_required' | 'daily_limit' | 'other', message: string) {
    super(message);
  }
}

export async function askCoach(
  question:    string,
  readiness:   ReadinessResult,
  healthData:  HealthData,
  rhrBaseline: number,
  hrvBaseline: number,
  patterns:    PatternInsight[],
  workload:    WorkloadResult | null,
  lifeEvents:  LifeEvent[],
  history:     ChatMessage[],
  profile:     UserProfile = {},
  extras:      Partial<CoachExtras> = {},
): Promise<CoachReply> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  if (!SUPABASE_URL) throw new Error('Supabase not configured');

  const cycle = await getCycleContext();

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/coach-chat`, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        question,
        cycle,
        score:      Math.round(readiness.score),
        scoreLabel: readiness.score >= 80 ? 'Optimal' : readiness.score >= 60 ? 'Good' : readiness.score >= 40 ? 'Moderate' : 'Low',
        components: {
          recovery: Math.round(readiness.components.recovery),
          sleep:    Math.round(readiness.components.sleep),
          stress:   Math.round(readiness.components.stress),
        },
        healthData: {
          hrv:              healthData.hrv,
          restingHeartRate: healthData.restingHeartRate,
          sleepDuration:    healthData.sleepDuration,
          deepSleep:        healthData.deepSleep,
          remSleep:         healthData.remSleep,
          sleepEfficiency:  healthData.sleepEfficiency,
          stressScore:      healthData.stressScore,
          steps:            healthData.steps ?? null,
        },
        rhrBaseline,
        hrvBaseline,
        patterns,
        workload,
        lifeEvents: lifeEvents.map(e => ({
          date:       e.date,
          event_type: e.event_type,
          notes:      e.notes,
        })),
        // The Edge Function spreads these straight into the Anthropic messages
        // array, which rejects unexpected keys, so `date` is stripped here.
        history: history.map(m => ({ role: m.role, content: m.content })).slice(-6),
        profile,
        memory:    extras.memory ?? [],
        trend:     extras.trend ?? [],
        scoreMath: extras.scoreMath ?? [],
        strava:    extras.strava ?? [],
      }),
    });

    if (res.status === 402) {
      throw new CoachError('pro_required', "You've used this week's 3 free questions. Readiness Pro gives you unlimited coaching.");
    }
    if (res.status === 429) throw new CoachError('daily_limit', 'You have reached today\'s limit for this. Try again tomorrow.');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new CoachError('other', body.error ?? `HTTP ${res.status}`);
    }

    const body = await res.json();
    return {
      answer:        typeof body.answer === 'string' ? body.answer : '',
      remember:      Array.isArray(body.remember) ? body.remember.filter((m: unknown) => typeof m === 'string') : [],
      freeRemaining: typeof body.freeRemaining === 'number' ? body.freeRemaining : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
