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
