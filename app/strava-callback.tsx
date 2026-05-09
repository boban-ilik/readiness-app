import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@constants/theme';
import { exchangeStravaCode } from '@services/strava';

export default function StravaCallbackScreen() {
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function run() {
      if (error || !code || typeof code !== 'string') {
        Alert.alert('Strava connection failed', 'Missing or invalid callback from Strava.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
        ]);
        return;
      }

      const token = await exchangeStravaCode(code);
      if (token) {
        router.replace('/(tabs)/profile');
        return;
      }

      Alert.alert(
        'Strava connection failed',
        'We could not complete the Strava token exchange. Please try again.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }],
      );
    }

    run();
  }, [code, error]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator color={colors.amber[400]} size="large" />
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 18,
          fontWeight: '600',
          marginTop: 16,
        }}
      >
        Connecting Strava
      </Text>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        Finishing the secure callback...
      </Text>
    </View>
  );
}
