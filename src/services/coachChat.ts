/**
 * coachChat.ts
 *
 * Client-side service for the "Ask your coach" conversational layer.
 * Sends the user's question + full health context to the coach-chat Edge Function.
 */

import { supabase } from '@services/supabase';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData } from '@types/index';
import type { PatternInsight } from '@services/patternAnalysis';
import type { WorkloadResult } from '@services/workloadAnalysis';
import type { LifeEvent } from '@services/lifeEvents';
import type { UserProfile } from '@services/userProfile';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
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
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  if (!SUPABASE_URL) throw new Error('Supabase not configured');

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
        history,
        profile,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }

    const { answer } = await res.json();
    return answer ?? '';
  } finally {
    clearTimeout(timeout);
  }
}
