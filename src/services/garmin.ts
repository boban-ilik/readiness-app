/**
 * Garmin Health API service.
 * Phase 4: Full implementation (after HealthKit).
 *
 * Requires: Garmin developer account + OAuth 2.0 credentials
 * Reads: HRV, resting HR, sleep, stress score, body battery
 */

import type { HealthData } from '@types/index';

// TODO: Set up Garmin OAuth flow and API client
// Docs: https://developer.garmin.com/health-api/

export async function initiateGarminAuth(): Promise<void> {
  // TODO: implement OAuth2 PKCE flow via expo-web-browser
  console.warn('Garmin: initiateGarminAuth not yet implemented');
}

export async function fetchGarminHealthData(_date: string): Promise<HealthData | null> {
  // TODO: implement
  console.warn('Garmin: fetchGarminHealthData not yet implemented');
  return null;
}
