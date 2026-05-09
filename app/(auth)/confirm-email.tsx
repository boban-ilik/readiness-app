import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { useAuth } from '@contexts/AuthContext';

export default function ConfirmEmailScreen() {
  const { confirmEmailCode, resendSignupCode } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = useMemo(
    () => (typeof params.email === 'string' ? params.email.trim().toLowerCase() : ''),
    [params.email],
  );

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleConfirm() {
    const token = code.trim();
    if (!email) {
      Alert.alert('Missing email', 'Go back and create your account again.');
      return;
    }
    if (token.length < 6) {
      Alert.alert('Invalid code', 'Enter the confirmation code from your email.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmEmailCode(email, token);
      Alert.alert('Email confirmed', 'Your account is ready. You can sign in now.', [
        { text: 'Continue', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Confirmation failed', error?.message ?? 'Could not verify that code.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      Alert.alert('Missing email', 'Go back and create your account again.');
      return;
    }
    setIsResending(true);
    try {
      await resendSignupCode(email);
      Alert.alert('Code sent', 'Check your inbox for a fresh confirmation email.');
    } catch (error: any) {
      Alert.alert('Could not resend', error?.message ?? 'Please try again in a moment.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>READINESS</Text>
          <Text style={styles.title}>Confirm your email</Text>
          <Text style={styles.subtitle}>
            Enter the confirmation code from the email we sent to{'\n'}
            <Text style={styles.email}>{email || 'your inbox'}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>CONFIRMATION CODE</Text>
          <TextInput
            value={code}
            onChangeText={text => setCode(text.replace(/\D/g, '').slice(0, 12))}
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isResending && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={isResending}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>
              {isResending ? 'Sending...' : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
            <Text style={styles.backLink}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[12],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
    gap: spacing[2],
  },
  wordmark: {
    color: colors.amber[400],
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: 6,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  email: {
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold,
  },
  form: {
    gap: spacing[4],
  },
  label: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    color: colors.text.primary,
    fontSize: fontSize.lg,
    letterSpacing: 2,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.secondary,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  backLink: {
    color: colors.text.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
