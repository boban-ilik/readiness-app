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
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { useAuth } from '@contexts/AuthContext';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords are the same.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
      // Supabase sends a confirmation email by default.
      // Show a message and redirect to login.
      Alert.alert(
        'Check your inbox',
        'We sent a confirmation email. Tap the link to activate your account, then sign in.',
        [{ text: 'Got it', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message ?? 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
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
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              returnKeyType="next"
              keyboardAppearance="dark"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="Re-enter password"
              placeholderTextColor={colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              keyboardAppearance="dark"
            />
          </View>

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>

          {/* Create Account button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
    paddingVertical: spacing[12],
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
  privacyNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginTop: -spacing[1],
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
