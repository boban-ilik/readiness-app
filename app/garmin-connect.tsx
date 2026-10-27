/**
 * The consent screen before Garmin's own consent page: what Readiness will
 * read, where it goes, and how to take it back. Garmin's programme requires
 * an AI transparency statement with explicit consent, so this is it.
 */

import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, radius, spacing } from '@constants/theme';
import { startGarminConnect } from '@services/garmin';
import { track } from '@services/analytics';

const READS = [
  'Overnight HRV, resting heart rate and sleep, for your daily score',
  'Stress and Body Battery, for the stress part of the score',
  'Activities, for training load',
  'Water you log in Garmin Connect, for the Hydration row',
  'VO2 max and fitness age, stored for later use (not used yet)',
];

export default function GarminConnectScreen() {
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      track('garmin_connect_started');
      await startGarminConnect();
      // Garmin's page is open in the browser; the callback brings the user back.
      router.back();
    } catch (e) {
      Alert.alert("Couldn't start", e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>CONNECT GARMIN</Text>
        <Text style={styles.title}>Your Garmin data, straight from Garmin</Text>
        <Text style={styles.lede}>
          Garmin Connect doesn't share HRV with Apple Health. Connecting your Garmin account lets Readiness read it directly, so your score needs nothing typed in.
        </Text>

        <Text style={styles.heading}>What Readiness reads</Text>
        {READS.map(r => <Text key={r} style={styles.item}>•  {r}</Text>)}

        <Text style={styles.heading}>Where it goes</Text>
        <Text style={styles.body}>
          Garmin sends these daily summaries to Readiness's server (Supabase), where they are stored against your account and used only for your own score, trends and coaching. They are not sold or shared for advertising.
        </Text>

        <Text style={styles.heading}>AI transparency</Text>
        <Text style={styles.body}>
          Your daily summaries (score components, HRV, resting heart rate, sleep, stress) are sent to Anthropic's Claude to write your briefing, coach answers and weekly report, under Anthropic's commercial API terms. Garmin data is never used to train AI models. If you would rather not, don't connect: the app works from Apple Health without it.
        </Text>

        <Text style={styles.heading}>Taking it back</Text>
        <Text style={styles.body}>
          Disconnect any time in Profile. That tells Garmin to stop sending and deletes every Garmin record Readiness holds. You can also revoke Readiness from your Garmin Connect account.
        </Text>

        <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={connect} disabled={busy} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.buttonText}>I agree, connect Garmin</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Not now</Text>
        </TouchableOpacity>
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg.primary },
  scroll:  { padding: spacing[5] },
  kicker:  { color: colors.text.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginTop: spacing[3] },
  title:   { color: colors.text.primary, fontSize: 26, fontWeight: '800', marginTop: spacing[3] },
  lede:    { color: colors.text.secondary, fontSize: fontSize.base, lineHeight: 22, marginTop: spacing[3] },
  heading: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semiBold, marginTop: spacing[5], marginBottom: spacing[2] },
  item:    { color: colors.text.secondary, fontSize: fontSize.sm, lineHeight: 21 },
  body:    { color: colors.text.secondary, fontSize: fontSize.sm, lineHeight: 21 },
  button:  { marginTop: spacing[6], backgroundColor: colors.text.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.bg.primary, fontSize: fontSize.base, fontWeight: '800' },
  cancel:  { color: colors.text.tertiary, fontSize: fontSize.base, textAlign: 'center', marginTop: spacing[4], paddingVertical: 6 },
});
