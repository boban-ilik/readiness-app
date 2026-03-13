/**
 * claude.ts
 *
 * Client-side service for fetching AI-generated readiness insights.
 *
 * Security architecture:
 *   iOS App  →  Supabase Edge Function  →  Anthropic API
 *
 * The Claude API key is stored as a Supabase secret inside the Edge Function
 * (supabase/functions/ai-insight/).  It is NOT present in this file, in .env,
 * or anywhere in the app binary.  The app only holds the Supabase anon key,
 * which is safe to ship and provides no privilege beyond calling public endpoints.
 *
 * ── Caching ──────────────────────────────────────────────────────────────────
 * Results are cached in AsyncStorage (key = component + date + score) so
 * re-opening the modal within the same day re-uses the AI copy without an
 * additional network call.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HealthData } from '@types/index';

// ─── Public types ─────────────────────────────────────────────────────────────

export type InsightComponent = 'recovery' | 'sleep' | 'stress';

export interface AiInsightInput {
  component:    InsightComponent;
  score:        number;
  statusLabel:  string;
  healthData:   HealthData;
  rhrBaseline:  number;
  hrvBaseline:  number;
}

export interface AiInsight {
  interpretation: string;
  advice:         string;
}

// ─── Edge Function endpoint ───────────────────────────────────────────────────
// The Supabase URL and anon key are safe to bundle (they're public credentials
// that only gate access — they do not grant any privilege).

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

/** Full URL of the deployed Edge Function */
function edgeFunctionUrl(): string {
  return `${SUPABASE_URL}/functions/v1/ai-insight`;
}

const REQUEST_TIMEOUT_MS = 20_000; // 20 s — edge function adds ~200 ms round-trip overhead

// ─── AsyncStorage cache ───────────────────────────────────────────────────────
// One cached insight per component × date × score.
// Expires automatically when the date changes (new day → new data → re-fetch).

const AI_CACHE_PREFIX = '@readiness/ai_v1_';

interface CachedInsight extends AiInsight {
  cachedAt: number; // unix ms — used to validate the cache is still for today
}

function makeCacheKey(component: InsightComponent, date: string, score: number): string {
  return `${AI_CACHE_PREFIX}${component}_${date}_${Math.round(score)}`;
}

async function loadCachedInsight(
  component: InsightComponent,
  date: string,
  score: number,
): Promise<AiInsight | null> {
  try {
    const raw = await AsyncStorage.getItem(makeCacheKey(component, date, score));
    if (!raw) return null;
    const cached: CachedInsight = JSON.parse(raw);
    // Invalidate if the cached entry is from a different calendar day
    const cachedDate = new Date(cached.cachedAt).toISOString().split('T')[0];
    if (cachedDate !== date) return null;
    return { interpretation: cached.interpretation, advice: cached.advice };
  } catch {
    return null;
  }
}

async function saveCachedInsight(
  component: InsightComponent,
  date: string,
  score: number,
  insight: AiInsight,
): Promise<void> {
  try {
    const data: CachedInsight = { ...insight, cachedAt: Date.now() };
    await AsyncStorage.setItem(
      makeCacheKey(component, date, score),
      JSON.stringify(data),
    );
  } catch {
    // Cache write failure is non-fatal — we just re-fetch next time
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch an AI-generated interpretation + advice for a readiness component.
 *
 * Calls the Supabase Edge Function which proxies to Claude on the server
 * using a secret API key that is never present in the app binary.
 *
 * - Checks the AsyncStorage cache first; only hits the network on a miss.
 * - Throws on error — callers should catch and fall back to static copy.
 */
export async function fetchAIInsight(input: AiInsightInput): Promise<AiInsight> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase is not configured — set EXPO_PUBLIC_SUPABASE_URL');
  }

  const { component, score, healthData } = input;
  const date = healthData.date;

  // ── Cache hit ────────────────────────────────────────────────────────────────
  const cached = await loadCachedInsight(component, date, score);
  if (cached) {
    console.log(`[AI] Cache hit — ${component} ${date} score=${Math.round(score)}`);
    return cached;
  }

  // ── Call Edge Function ───────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[AI] Fetching insight via Edge Function — ${component} score=${Math.round(score)}`);

    const response = await fetch(edgeFunctionUrl(), {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Edge Function error ${response.status}: ${body.slice(0, 120)}`);
    }

    const insight: AiInsight = await response.json();

    if (!insight.interpretation || !insight.advice) {
      throw new Error('Edge Function returned unexpected response shape');
    }

    await saveCachedInsight(component, date, score, insight);
    return insight;

  } finally {
    clearTimeout(timeoutId);
  }
}
