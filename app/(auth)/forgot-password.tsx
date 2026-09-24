import { useState } from 'react';
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
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { useAuth } from '@contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { sendPasswordResetCode } = useAuth();

  const [email, setEmail]         = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Enter your email', 'We need the email address on your account.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetCode(trimmed);
      // Always report success — revealing whether an address is registered
      // would let anyone enumerate accounts.
      router.push({ pathname: '/(auth)/reset-password', params: { email: trimmed } });
    } catch (error: any) {
      Alert.alert('Could not send code', error?.message ?? 'Please try again in a moment.');
    } finally {
      setIsLoading(false);
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
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a 6-digit code to set a new password.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSend}
            keyboardAppearance="dark"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Send reset code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
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
    fontSize: fontSize.base,
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
