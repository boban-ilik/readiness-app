/**
 * chatMemory.ts
 *
 * Persists coach chat history to AsyncStorage so conversations survive
 * between modal opens. Capped at MAX_MESSAGES to bound storage growth.
 *
 * Storage key is versioned (v1) so a schema change in future can
 * cleanly drop old data by bumping the version.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@services/coachChat';

const STORAGE_KEY   = '@readiness/coach_chat_v1';
const MAX_MESSAGES  = 40;   // max stored (display)
export const CONTEXT_WINDOW = 10; // max sent to the AI as history context

// ─── Dating ───────────────────────────────────────────────────────────────────

/** Local date, not UTC — a conversation belongs to the user's day. */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The slice of conversation sent to the model as context.
 *
 * Only today's turns qualify. Yesterday's answers describe yesterday's body:
 * left in the context window they get restated as current, so the coach would
 * cite an 8.2 h night while the rest of the app showed 6 h 17 m. Older turns
 * stay in the transcript for the user to scroll — they just stop being fed
 * back as fact. Messages stored before dating existed have no date and are
 * treated as older than today.
 */
export function selectContext(messages: ChatMessage[]): ChatMessage[] {
  const today = todayLocal();
  return messages.filter(m => m.date === today).slice(-CONTEXT_WINDOW);
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMessage[];
  } catch {
    return [];
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Persists the full message list, trimmed to the last MAX_MESSAGES entries.
 * Fire-and-forget — safe to call inside a setState updater.
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  const trimmed = messages.slice(-MAX_MESSAGES);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)).catch(() => {});
}

// ─── Clear ────────────────────────────────────────────────────────────────────

export async function clearChatHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
