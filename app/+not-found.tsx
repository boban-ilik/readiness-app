import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, fontSize, spacing } from '@constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>This screen doesn&apos;t exist.</Text>
      <Link href="/" style={styles.link}>
        Go home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    marginTop: spacing[2],
  },
  link: {
    color: colors.amber[400],
    fontSize: fontSize.base,
    marginTop: spacing[6],
  },
});
