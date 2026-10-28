import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { supabase } from '@services/supabase';
import { colors } from '@constants/theme';

const VALID_OTP_TYPES = new Set([
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email',
  'email_change',
]);

function parseCallbackParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const out: Record<string, string> = {};

    for (const [key, value] of parsed.searchParams.entries()) {
      out[key] = value;
    }

    const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      for (const [key, value] of hashParams.entries()) {
        out[key] = value;
      }
    }

    const nestedConfirmationUrl = out.confirmation_url ?? out.redirect_to;
    if (nestedConfirmationUrl) {
      try {
        const nested = parseCallbackParams(decodeURIComponent(nestedConfirmationUrl));
        for (const [key, value] of Object.entries(nested)) {
          if (!(key in out)) out[key] = value;
        }
      } catch {
        // Ignore malformed nested URLs and keep the top-level params.
      }
    }

    return out;
  } catch {
    return {};
  }
}

export default function AuthCallbackScreen() {
  const incomingUrl = ExpoLinking.useURL();
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();

  const hasRun = useRef(false);
  const [message, setMessage] = useState('Finishing sign-in...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function run() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const parsedFromInitialUrl = initialUrl ? parseCallbackParams(initialUrl) : {};
        const parsedFromIncomingUrl = incomingUrl ? parseCallbackParams(incomingUrl) : {};

        const merged = {
          token_hash:
            typeof params.token_hash === 'string'
              ? params.token_hash
              : parsedFromIncomingUrl.token_hash ?? parsedFromInitialUrl.token_hash,
          type:
            typeof params.type === 'string'
              ? params.type
              : parsedFromIncomingUrl.type ?? parsedFromInitialUrl.type,
          error:
            typeof params.error === 'string'
              ? params.error
              : parsedFromIncomingUrl.error ?? parsedFromInitialUrl.error,
          error_description:
            typeof params.error_description === 'string'
              ? params.error_description
              : parsedFromIncomingUrl.error_description ?? parsedFromInitialUrl.error_description,
        };

        if (merged.error_description || merged.error) {
          throw new Error(String(merged.error_description ?? merged.error));
        }

        // Deliberately no access_token/refresh_token branch: the app only ever
        // signs in through OTP codes, and accepting raw session tokens from a
        // deep link would let any link (QR, Safari, another app) log the
        // victim into an attacker's account and pour their health data into it.
        if (
          typeof merged.token_hash === 'string' &&
          typeof merged.type === 'string' &&
          VALID_OTP_TYPES.has(merged.type)
        ) {
          setMessage('Confirming your email...');
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: merged.token_hash,
            type: merged.type as
              | 'signup'
              | 'magiclink'
              | 'recovery'
              | 'invite'
              | 'email'
              | 'email_change',
          });
          if (verifyError) throw verifyError;
          router.replace('/');
          return;
        }

        throw new Error('Missing confirmation data in callback URL.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not complete authentication.');
      }
    }

    run();
  }, [incomingUrl, params]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator color={colors.amber[400]} size="large" />
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 20,
          fontWeight: '600',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        {error ? 'Authentication Failed' : 'Confirming Account'}
      </Text>
      <Text
        style={{
          color: error ? '#F87171' : colors.text.secondary,
          fontSize: 14,
          marginTop: 10,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {error ?? message}
      </Text>
      {error && (
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: colors.amber[400],
            borderRadius: 12,
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>
            Back to Login
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
