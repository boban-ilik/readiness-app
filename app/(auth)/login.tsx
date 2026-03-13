import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { useAuth } from '@contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigation handled automatically by auth gating in _layout.tsx
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message ?? 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>READINESS</Text>
          <Text style={styles.tagline}>Know before you go.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              keyboardAppearance="dark"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              keyboardAppearance="dark"
            />
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </Link>
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
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  wordmark: {
    color: colors.amber[400],
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: 6,
  },
  tagline: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing[2],
    letterSpacing: 0.3,
  },
  form: {
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[1.5],
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
  inputFocused: {
    borderColor: colors.amber[400],
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -spacing[1],
  },
  forgotText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  button: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[10],
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
});
