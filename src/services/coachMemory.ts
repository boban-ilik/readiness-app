/**
 * coachMemory.ts
 *
 * Durable facts the coach has picked up from conversations: goals, race
 * dates, injuries, preferences. The coach-chat function returns 0-3 new facts
 * with each answer; they are kept on the device only and sent back with every
 * question so the coach remembers across days. The user can see and delete
 * each one in Profile > What your coach remembers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const COACH_MEMORY_KEY = '@readiness/coach_memory_v1';
export const MAX_MEMORY_ITEMS = 15;
const MAX_ITEM_CHARS = 200;

export interface MemoryItem {
  text:    string;
  /** Local date the fact was saved, YYYY-MM-DD */
  savedOn: string;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function loadCoachMemory(): Promise<MemoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(COACH_MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((m): m is MemoryItem => typeof m?.text === 'string' && typeof m?.savedOn === 'string')
      : [];
  } catch {
    return [];
  }
}

async function save(items: MemoryItem[]): Promise<void> {
  await AsyncStorage.setItem(COACH_MEMORY_KEY, JSON.stringify(items)).catch(() => {});
}

/**
 * Adds new facts, skipping ones already known (case and punctuation
 * insensitive). When over the cap, the oldest facts are dropped first.
 * Returns how many were actually added.
 */
export async function addCoachMemory(facts: string[]): Promise<number> {
  const clean = facts.map(f => f.trim().slice(0, MAX_ITEM_CHARS)).filter(Boolean);
  if (clean.length === 0) return 0;
  const items = await loadCoachMemory();
  const known = new Set(items.map(i => norm(i.text)));
  let added = 0;
  for (const text of clean) {
    const key = norm(text);
    if (!key || known.has(key)) continue;
    known.add(key);
    items.push({ text, savedOn: today() });
    added++;
  }
  if (added > 0) await save(items.slice(-MAX_MEMORY_ITEMS));
  return added;
}

export async function removeCoachMemory(text: string): Promise<MemoryItem[]> {
  const items = (await loadCoachMemory()).filter(i => i.text !== text);
  await save(items);
  return items;
}

export async function clearCoachMemory(): Promise<void> {
  await AsyncStorage.removeItem(COACH_MEMORY_KEY).catch(() => {});
}
