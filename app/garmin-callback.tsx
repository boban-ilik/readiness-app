/**
 * readiness://garmin-callback?status=ok&nonce=...  or  status=error&reason=...
 * Where the Supabase callback sends the user after Garmin's consent page.
 * The nonce is confirmed from this signed-in account before the connection
 * counts; a link started from another account is refused.
 */

import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@constants/theme';
import { refreshGarminConnection, confirmGarminConnection } from '@services/garmin';
import { track } from '@services/analytics';

const REASONS: Record<string, string> = {
  declined:        'You didn\'t allow access on Garmin\'s page.',
  unknown_state:   'The connection attempt had expired. Please start again.',
  exchange_failed: 'Garmin accepted, but the final step failed. Please try again.',
  missing_code:    'Garmin sent an incomplete reply. Please try again.',
};

export default function GarminCallbackScreen() {
  const { status, reason, nonce } = useLocalSearchParams<{ status?: string; reason?: string; nonce?: string }>();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      let failure: string | null = null;
      if (status === 'ok') {
        if (typeof nonce === 'string' && nonce) {
          try {
            await confirmGarminConnection(nonce);
          } catch (e: any) {
            failure = e?.message === 'not_yours'
              ? 'This Garmin link was started from a different account.'
              : 'Garmin accepted, but confirming the link failed. Please try again.';
          }
        }
        const conn = failure ? null : await refreshGarminConnection();
        if (conn) {
          track('garmin_connected');
          Alert.alert('Garmin connected', "From the next sync, Readiness reads your overnight HRV, resting heart rate, sleep and stress straight from Garmin.", [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
          return;
        }
      }
      Alert.alert('Garmin not connected', failure ?? REASONS[reason ?? ''] ?? 'Something went wrong. Please try again.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
      ]);
    })();
  }, [status, reason, nonce]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <ActivityIndicator color={colors.amber[400]} size="large" />
      <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '600', marginTop: 16 }}>Connecting Garmin</Text>
      <Text style={{ color: colors.text.secondary, fontSize: 16, marginTop: 8, textAlign: 'center' }}>Finishing the secure callback...</Text>
    </View>
  );
}
