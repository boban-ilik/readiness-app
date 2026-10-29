/**
 * IllnessRecoveryCard / IllnessNudgeCard
 *
 * Back from illness on Today. The recovery card shows how far resting HR and
 * HRV are from their pre-illness usual and why training is held at Easy Day.
 * The nudge only ever asks: a raised resting HR has causes other than illness.
 */

import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { BACK_DAYS_REQUIRED, type RecoveryStatus, type SignalStatus } from '@utils/illnessRecovery';

const unit = (s: SignalStatus) => (s.key === 'rhr' ? 'bpm' : 'ms');

function SignalRow({ s }: { s: SignalStatus }) {
  return (
    <View style={styles.signalRow}>
      <Text style={[styles.signalMark, { color: s.back ? colors.success : colors.amber[400] }]}>
        {s.back ? '✓' : '•'}
      </Text>
      <Text style={styles.signalLabel}>{s.label}</Text>
      <Text style={styles.signalValue}>
        {s.latest != null ? `${Math.round(s.latest)} ${unit(s)}` : 'No reading yet'}
        <Text style={styles.signalUsual}>{`  usual ${Math.round(s.usual)}`}</Text>
      </Text>
    </View>
  );
}

export function IllnessRecoveryCard({ status, onEnd }: { status: RecoveryStatus; onEnd: () => void }) {
  const recovered = status.state === 'recovered';
  const noBaseline = status.signals.length === 0;

  function confirmEnd() {
    if (recovered) return onEnd();
    Alert.alert(
      'Stop tracking?',
      'Training advice goes back to following your score alone.',
      [
        { text: 'Keep tracking', style: 'cancel' },
        { text: "I'm better", onPress: onEnd },
      ],
    );
  }

  const title = recovered
    ? 'Your body is back to its usual'
    : status.backStreak > 0
      ? `Nearly there: ${status.backStreak} of ${BACK_DAYS_REQUIRED} mornings back`
      : "Your body isn't back yet";

  const body = recovered
    ? `Resting heart rate and HRV have been at your pre-illness levels for ${BACK_DAYS_REQUIRED} mornings. Normal training advice is back on.`
    : noBaseline
      ? "There isn't enough data from before you got sick to compare with, so training stays at Easy Day until you tap I'm better."
      : `Training is held at Easy Day until every reading is back for ${BACK_DAYS_REQUIRED} mornings in a row. Most people feel better before their numbers recover.`;

  return (
    <View style={[styles.card, { borderLeftColor: recovered ? colors.success : colors.amber[400] }]}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>{recovered ? '✅ BACK FROM ILLNESS' : '🤒 BACK FROM ILLNESS'}</Text>
        {!recovered && <Text style={styles.dayBadge}>Day {status.day}</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>

      {!recovered && status.signals.map(s => <SignalRow key={s.key} s={s} />)}

      <Text style={styles.body}>{body}</Text>

      {status.suggestDoctor && (
        <Text style={styles.body}>
          It has been over two weeks. If you still feel unwell, it is worth checking in with a doctor.
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={confirmEnd} activeOpacity={0.8} accessibilityRole="button">
        <Text style={styles.buttonText}>{recovered ? 'Done' : "I'm better"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function IllnessNudgeCard({ elevation, onStart, onDismiss }: {
  elevation: number;
  onStart:   () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: colors.amber[400] }]}>
      <Text style={[styles.sectionLabel, styles.labelGap]}>FEELING UNWELL?</Text>
      <Text style={styles.body}>
        Your resting heart rate has been {elevation} bpm or more above your usual for two days.
        Getting sick can do this, and so can travel, alcohol or hard training.
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.buttonFlex]} onPress={onStart} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.buttonText}>I'm sick, track recovery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonGhost, styles.buttonFlex]} onPress={onDismiss} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.buttonGhostText}>Not sick</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No side margin: Today's scroll view already insets its content
  card: {
    marginBottom:     spacing[5],
    borderRadius:     radius.lg,
    borderLeftWidth:  3,
    backgroundColor:  colors.bg.tertiary,
    padding:          spacing[4],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[2],
  },
  sectionLabel: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    color:         colors.text.secondary,
    letterSpacing: 1.0,
  },
  labelGap: { marginBottom: spacing[2] },
  dayBadge: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.bold,
    color:      colors.amber[400],
  },
  title: {
    fontSize:     fontSize.md,
    fontWeight:   fontWeight.semiBold,
    color:        colors.text.primary,
    marginBottom: spacing[3],
  },
  signalRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing[2],
  },
  signalMark: {
    width:      18,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  signalLabel: {
    flex:     1,
    fontSize: fontSize.sm,
    color:    colors.text.primary,
  },
  signalValue: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  signalUsual: {
    fontWeight: fontWeight.regular,
    color:      colors.text.tertiary,
  },
  body: {
    fontSize:     fontSize.sm,
    color:        colors.text.secondary,
    lineHeight:   22,
    marginTop:    spacing[1],
    marginBottom: spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  buttonFlex: { flex: 1 },
  button: {
    marginTop:         spacing[2],
    paddingVertical:   spacing[3],
    paddingHorizontal: spacing[3],
    justifyContent:    'center',
    borderRadius:      radius.md,
    alignItems:        'center',
    backgroundColor:   colors.amber[400],
  },
  buttonText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.bg.primary,
    textAlign:  'center',
  },
  buttonGhost: {
    marginTop:         spacing[2],
    paddingVertical:   spacing[3],
    paddingHorizontal: spacing[3],
    justifyContent:    'center',
    borderRadius:      radius.md,
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       colors.text.tertiary,
  },
  buttonGhostText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.secondary,
    textAlign:  'center',
  },
});
