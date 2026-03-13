/**
 * lifeEvents.ts
 *
 * CRUD for life_events — contextual tags users attach to days so the AI
 * can understand cause-and-effect (e.g. "bad night out → HRV drop").
 */

import { supabase } from '@services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | 'alcohol'
  | 'illness'
  | 'travel'
  | 'stress'
  | 'poor_sleep'
  | 'medication'
  | 'intense_workout'
  | 'other';

export interface LifeEvent {
  id:         string;
  user_id:    string;
  date:       string;   // YYYY-MM-DD
  event_type: EventType;
  notes:      string | null;
  created_at: string;
}

export interface EventMeta {
  type:  EventType;
  label: string;
  emoji: string;
}

export const EVENT_TYPES: EventMeta[] = [
  { type: 'alcohol',          label: 'Alcohol / Late night', emoji: '🍷' },
  { type: 'illness',          label: 'Sick / Illness',       emoji: '🤒' },
  { type: 'travel',           label: 'Travel / Jet lag',     emoji: '✈️' },
  { type: 'stress',           label: 'High stress',          emoji: '😤' },
  { type: 'poor_sleep',       label: 'Poor sleep',           emoji: '😴' },
  { type: 'intense_workout',  label: 'Intense workout',      emoji: '💪' },
  { type: 'medication',       label: 'Medication',           emoji: '💊' },
  { type: 'other',            label: 'Other',                emoji: '📌' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDate(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Fetch life events for the last N days (default 7) */
export async function fetchRecentEvents(days = 7): Promise<LifeEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data, error } = await supabase
    .from('life_events')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', toLocalDate(from))
    .order('date', { ascending: false });

  if (error) {
    console.warn('[lifeEvents] fetch error:', error.message);
    return [];
  }
  return (data ?? []) as LifeEvent[];
}

/** Fetch events for a specific date */
export async function fetchEventsForDate(date: string): Promise<LifeEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('life_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as LifeEvent[];
}

/** Tag today with an event */
export async function tagEvent(type: EventType, notes?: string): Promise<LifeEvent | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('life_events')
    .insert({
      user_id:    user.id,
      date:       toLocalDate(),
      event_type: type,
      notes:      notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.warn('[lifeEvents] insert error:', error.message);
    return null;
  }
  return data as LifeEvent;
}

/** Remove an event by ID */
export async function removeEvent(id: string): Promise<void> {
  await supabase.from('life_events').delete().eq('id', id);
}
