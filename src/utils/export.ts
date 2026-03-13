/**
 * export.ts
 *
 * Builds a CSV from the 7-day DayHistory array and opens the system share
 * sheet so the user can AirDrop, email, or save to Files.
 *
 * ── Expo Go compatibility ──────────────────────────────────────────────────
 * expo-sharing calls requireNativeModule('ExpoSharing') during module
 * initialization (static import time), which throws in Expo Go before any
 * IS_EXPO_GO guard can run.
 *
 * Fix: expo-sharing is NOT statically imported at the top of this file.
 * Instead it is lazily require()-d inside exportHistoryCSV() AFTER the
 * IS_EXPO_GO guard has already exited early. This means the native module is
 * never touched when running in Expo Go.
 *
 * expo-file-system IS safe to import statically — it ships inside Expo Go.
 */

import * as FileSystem from 'expo-file-system';
import Constants       from 'expo-constants';
import type { DayHistory } from '@hooks/useHistoryData';

// ─── Expo Go detection ────────────────────────────────────────────────────────
// Same dual-check used in useNotifications.ts — see comment there for rationale.

const IS_EXPO_GO =
  Constants.appOwnership === 'expo' ||
  (Constants.executionEnvironment as string) === 'storeClient';

// ─── CSV builder ──────────────────────────────────────────────────────────────

const CSV_HEADER =
  'Date,Day,Score,Recovery,Sleep,Stress,Resting Heart Rate (bpm),Sleep (min),Sleep Efficiency (%)';

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains a comma, double-quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(history: DayHistory[]): string {
  const rows = history.map(d => [
    escapeCSV(d.date),
    escapeCSV(d.dayLabel),
    escapeCSV(d.score),
    escapeCSV(d.components?.recovery ?? null),
    escapeCSV(d.components?.sleep    ?? null),
    escapeCSV(d.components?.stress   ?? null),
    escapeCSV(d.rhr),
    escapeCSV(d.sleepMinutes),
    escapeCSV(d.sleepEfficiency),
  ].join(','));

  return [CSV_HEADER, ...rows].join('\n');
}

// ─── Public export ────────────────────────────────────────────────────────────

/**
 * Writes history to a temp CSV file and opens the native share sheet.
 *
 * In Expo Go this throws a descriptive error (caught by the UI's Alert).
 * In a custom dev build / production it opens AirDrop / Files / email etc.
 */
export async function exportHistoryCSV(history: DayHistory[]): Promise<void> {
  // Guard #1 — Expo Go: expo-sharing's native module is not compiled in.
  // We throw here so the UI can show a friendly Alert rather than crashing.
  if (IS_EXPO_GO) {
    throw new Error(
      'Export requires a custom dev build.\n\n' +
      'expo-sharing is not available in Expo Go. ' +
      'Run `expo run:ios` or `expo run:android` to test this feature.',
    );
  }

  // Lazy-require expo-sharing only after the guard — this ensures the native
  // module is never accessed in Expo Go (static import would crash at load time).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const csv      = buildCSV(history);
  const dateSlug = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = `readiness_${dateSlug}.csv`;
  const fileUri  = (FileSystem.cacheDirectory ?? '') + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType:    'text/csv',
    dialogTitle: 'Export Readiness Data',
    UTI:         'public.comma-separated-values-text', // iOS UTI
  });
}
