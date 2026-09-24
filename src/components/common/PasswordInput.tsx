/**
 * PasswordInput
 *
 * A TextInput that starts masked with a tap-to-reveal eye button.
 *
 * Typing a password blind is the main cause of failed sign-ups — a mistyped
 * confirmation field can't be spotted, only re-tried. Every password field in
 * the app uses this so the behaviour is consistent.
 *
 * Takes the same props as TextInput; `style` is applied to the input itself so
 * each screen keeps its own focus styling.
 */

import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@constants/theme';

export default function PasswordInput({ style, ...props }: TextInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        style={[style, styles.input]}
        secureTextEntry={!revealed}
        // Revealing turns the field into plain text, so stop iOS trying to
        // autocorrect or capitalise what it now thinks is a normal word.
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setRevealed(v => !v)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        activeOpacity={0.7}
      >
        <Ionicons
          name={revealed ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    // Room for the eye so long passwords don't run underneath it.
    paddingRight: spacing[10],
  },
  toggle: {
    position: 'absolute',
    right: spacing[3],
    padding: spacing[1],
  },
});
