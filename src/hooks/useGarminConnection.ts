/**
 * useGarminConnection: connection state for Profile and the callback screen.
 */

import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { refreshGarminConnection, disconnectGarmin, type GarminConnection } from '@services/garmin';
import { track } from '@services/analytics';

export function useGarminConnection() {
  const [connection, setConnection] = useState<GarminConnection | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try { setConnection(await refreshGarminConnection()); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const disconnect = useCallback(async () => {
    await disconnectGarmin();
    track('garmin_disconnected');
    setConnection(null);
  }, []);

  return { connection, isConnected: !!connection, isLoading, refresh, disconnect };
}
