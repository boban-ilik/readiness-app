/**
 * useStravaActivities
 *
 * Manages the Strava connection state and fetches recent activities.
 * Handles token presence check, loading state, and disconnect.
 *
 * Usage:
 *   const { isConnected, athleteName, activities, isLoading, disconnect } = useStravaActivities();
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking }          from 'react-native';
import {
  getStravaToken,
  fetchStravaActivities,
  handleStravaCallback,
  disconnectStrava,
  type StravaActivity,
} from '@services/strava';

export interface StravaState {
  isConnected:  boolean;
  athleteName:  string;
  activities:   StravaActivity[];
  isLoading:    boolean;
  connect:      () => void;
  disconnect:   () => Promise<void>;
  refresh:      () => Promise<void>;
}

export function useStravaActivities(daysBack = 7): StravaState {
  const [isConnected, setIsConnected] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const [activities,  setActivities]  = useState<StravaActivity[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  // Check if already connected on mount
  useEffect(() => {
    (async () => {
      const token = await getStravaToken();
      if (token) {
        setIsConnected(true);
        setAthleteName(token.athleteName);
      }
      setIsLoading(false);
    })();
  }, []);

  // Listen for the OAuth deep-link callback
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (!url.startsWith('readiness://strava-callback')) return;

      setIsLoading(true);
      try {
        const token = await handleStravaCallback(url);
        if (token) {
          setIsConnected(true);
          setAthleteName(token.athleteName);
          await loadActivities();
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load activities when connected state flips true
  useEffect(() => {
    if (isConnected) loadActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  async function loadActivities() {
    setIsLoading(true);
    try {
      const data = await fetchStravaActivities(daysBack);
      setActivities(data);
    } finally {
      setIsLoading(false);
    }
  }

  function connect() {
    // Import here to avoid circular dep issues at module load time
    const { initiateStravaAuth } = require('@services/strava');
    initiateStravaAuth();
  }

  const disconnect = useCallback(async () => {
    await disconnectStrava();
    setIsConnected(false);
    setAthleteName('');
    setActivities([]);
  }, []);

  const refresh = useCallback(() => loadActivities(), []);  // eslint-disable-line

  return { isConnected, athleteName, activities, isLoading, connect, disconnect, refresh };
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/**
 * Returns activities from the last N hours (useful for "today's workouts").
 */
export function filterRecentActivities(
  activities: StravaActivity[],
  hoursBack: number,
): StravaActivity[] {
  const cutoff = Date.now() - hoursBack * 3600 * 1000;
  return activities.filter(a => new Date(a.start_date_local).getTime() > cutoff);
}

/**
 * Returns the highest suffer score from a list of activities, or null.
 */
export function maxSufferScore(activities: StravaActivity[]): number | null {
  const scores = activities.map(a => a.suffer_score).filter((s): s is number => s != null);
  return scores.length > 0 ? Math.max(...scores) : null;
}
