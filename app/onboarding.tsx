/**
 * Onboarding flow — shown once, on first launch after sign-up.
 *
 * Step 0 · Welcome          — brand intro + name input
 * Step 1 · How it works     — 3-component breakdown cards
 * Step 2 · Device           — Garmin / Apple Watch / Both selector
 * Step 3 · Training profile — frequency + primary goal (two sections)
 * Step 4 · Body stats       — age, sex, height, weight (all optional)
 * Step 5 · Permissions      — Apple Health permission request
 * Step 6 · Setup (auto)     — compute baseline, then navigate to tabs
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScoreRing from '@components/score/ScoreRing';
import {
  requestHealthKitPermissions,
  isHealthKitAvailable,
} from '@services/healthkit';
import { getPersonalRHRBaseline } from '@hooks/useHealthData';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  getScoreColor,
  getScoreLabel,
} from '@constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_KEY       = '@readiness/onboarding_complete';
const DEVICE_KEY           = '@readiness/device_type';
export const NAME_KEY      = '@readiness/user_name';
export const FREQ_KEY      = '@readiness/training_frequency';
export const JOINED_AT_KEY = '@readiness/joined_at';

// Profile keys (mirrored from src/services/userProfile.ts — kept here to avoid
// circular imports between onboarding.tsx and userProfile.ts)
const PROFILE_AGE_KEY    = '@readiness/profile_age';
const PROFILE_SEX_KEY    = '@readiness/profile_sex';
const PROFILE_HEIGHT_KEY = '@readiness/profile_height_cm';
const PROFILE_WEIGHT_KEY = '@readiness/profile_weight_kg';
const PROFILE_GOAL_KEY   = '@readiness/profile_goal';

const TOTAL_STEPS = 6;  // steps 0–5 show progress dots; step 6 = auto setup

type DeviceType       = 'garmin' | 'apple_watch' | 'both';
type TrainingFrequency = 'light' | 'moderate' | 'high';
type BiologicalSex     = 'male' | 'female' | 'prefer_not_to_say';
type TrainingGoal      = 'performance' | 'recovery' | 'weight_loss' | 'general_health';

function pause(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );
}

// ─── Step 0: Welcome + name ───────────────────────────────────────────────────

function StepWelcome({
  name,
  setName,
  onNext,
}: {
  name:    string;
  setName: (s: string) => void;
  onNext:  () => void;
}) {
  const DEMO_SCORE = 74;
  const scoreColor = getScoreColor(DEMO_SCORE);
  const inputRef   = useRef<TextInput>(null);

  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Animated ring */}
      <View style={styles.ringWrap}>
        <ScoreRing score={DEMO_SCORE} color={scoreColor} size={180} strokeWidth={10} />
        <View style={styles.ringOverlay} pointerEvents="none">
          <Text style={[styles.ringScore, { color: scoreColor }]}>{DEMO_SCORE}</Text>
          <Text style={styles.ringLabel}>{getScoreLabel(DEMO_SCORE)}</Text>
        </View>
      </View>

      <Text style={styles.appName}>Readiness</Text>
      <Text style={styles.tagline}>Know before you go.</Text>
      <Text style={styles.welcomeBody}>
        Your daily readiness score — built from heart rate, sleep, and recovery data synced from your wearable to Apple Health.
      </Text>

      {/* Name input */}
      <View style={styles.nameBlock}>
        <Text style={styles.nameLabel}>What should we call you?</Text>
        <TextInput
          ref={inputRef}
          style={styles.nameInput}
          placeholder="Your first name"
          placeholderTextColor={colors.text.tertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={30}
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => { Keyboard.dismiss(); onNext(); }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 1: How it works ─────────────────────────────────────────────────────

const SCORE_COMPONENTS = [
  {
    icon:   '💓',
    label:  'Recovery',
    weight: '45%',
    color:  colors.error,
    desc:   'Heart rate variability and resting heart rate show how well your body recovered overnight.',
  },
  {
    icon:   '🌙',
    label:  'Sleep',
    weight: '40%',
    color:  colors.info,
    desc:   'Duration, deep sleep, and REM cycles give a complete picture of sleep quality.',
  },
  {
    icon:   '🧠',
    label:  'Stress',
    weight: '15%',
    color:  colors.warning,
    desc:   'Overnight autonomic stress load — high stress blunts recovery even with great sleep.',
  },
] as const;

function StepHowItWorks({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>How your score is built</Text>
      <Text style={styles.stepSubtitle}>
        Three weighted components, recalculated every morning.
      </Text>

      <View style={styles.componentList}>
        {SCORE_COMPONENTS.map(c => (
          <View key={c.label} style={[styles.componentCard, { borderLeftColor: c.color }]}>
            <View style={styles.componentHeader}>
              <Text style={styles.componentIcon}>{c.icon}</Text>
              <Text style={styles.componentName}>{c.label}</Text>
              <View style={[styles.weightPill, { backgroundColor: c.color + '22' }]}>
                <Text style={[styles.weightText, { color: c.color }]}>{c.weight}</Text>
              </View>
            </View>
            <Text style={styles.componentDesc}>{c.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtnSmall} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step 2: Device selection ─────────────────────────────────────────────────

const DEVICES: { key: DeviceType; label: string; icon: string }[] = [
  { key: 'garmin',      label: 'Garmin',       icon: '⌚' },
  { key: 'apple_watch', label: 'Apple Watch',  icon: '🍎' },
  { key: 'both',        label: 'Both',         icon: '🔁' },
];

function StepDevice({
  device,
  setDevice,
  onNext,
  onBack,
}: {
  device:    DeviceType;
  setDevice: (d: DeviceType) => void;
  onNext:    () => void;
  onBack:    () => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What do you train with?</Text>
      <Text style={styles.stepSubtitle}>
        Readiness syncs all data through Apple Health — no direct device connection needed.
      </Text>

      {/* 2×1 grid: first two side-by-side, third centered below */}
      <View style={styles.deviceGrid}>
        {DEVICES.slice(0, 2).map(d => (
          <TouchableOpacity
            key={d.key}
            style={[styles.deviceCard, device === d.key && styles.deviceCardActive]}
            onPress={() => setDevice(d.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.deviceEmoji}>{d.icon}</Text>
            <Text style={[styles.deviceLabel, device === d.key && styles.deviceLabelActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.deviceCardFull, device === 'both' && styles.deviceCardActive]}
        onPress={() => setDevice('both')}
        activeOpacity={0.75}
      >
        <Text style={styles.deviceEmoji}>{DEVICES[2].icon}</Text>
        <Text style={[styles.deviceLabel, device === 'both' && styles.deviceLabelActive]}>
          {DEVICES[2].label}
        </Text>
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtnSmall} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 3: Training profile (frequency + goal) ──────────────────────────────

const FREQ_OPTIONS: {
  key:   TrainingFrequency;
  icon:  string;
  label: string;
  sub:   string;
}[] = [
  { key: 'light',    icon: '🚶', label: '2–3 days / week', sub: 'I exercise occasionally' },
  { key: 'moderate', icon: '🏃', label: '4–5 days / week', sub: 'I train consistently' },
  { key: 'high',     icon: '⚡', label: '6+ days / week',  sub: "I'm a high-volume athlete" },
];

const GOAL_OPTIONS: {
  key:   TrainingGoal;
  icon:  string;
  label: string;
  sub:   string;
}[] = [
  { key: 'performance',    icon: '🏆', label: 'Peak Performance',   sub: 'Push harder, train smarter' },
  { key: 'recovery',       icon: '🔄', label: 'Optimise Recovery',  sub: 'Avoid burnout & overtraining' },
  { key: 'weight_loss',    icon: '⚖️', label: 'Lose Weight',        sub: 'Balance training & body comp' },
  { key: 'general_health', icon: '💪', label: 'General Health',     sub: 'Stay active, feel great' },
];

function StepTrainingProfile({
  freq,
  setFreq,
  goal,
  setGoal,
  onNext,
  onBack,
}: {
  freq:    TrainingFrequency;
  setFreq: (f: TrainingFrequency) => void;
  goal:    TrainingGoal;
  setGoal: (g: TrainingGoal) => void;
  onNext:  () => void;
  onBack:  () => void;
}) {
  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Frequency ── */}
      <Text style={styles.stepTitle}>Your training profile</Text>
      <Text style={styles.stepSubtitle}>
        Helps calibrate your recommendations to your actual schedule and goals.
      </Text>

      <Text style={styles.sectionHeading}>How often do you train?</Text>
      <View style={styles.freqList}>
        {FREQ_OPTIONS.map(opt => {
          const active = freq === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.freqCard, active && styles.freqCardActive]}
              onPress={() => setFreq(opt.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.freqIcon}>{opt.icon}</Text>
              <View style={styles.freqText}>
                <Text style={[styles.freqLabel, active && styles.freqLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.freqSub}>{opt.sub}</Text>
              </View>
              {active && (
                <View style={styles.freqCheck}>
                  <Text style={styles.freqCheckMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Goal ── */}
      <Text style={[styles.sectionHeading, { marginTop: spacing[2] }]}>What's your primary goal?</Text>
      <View style={styles.goalGrid}>
        {GOAL_OPTIONS.map(opt => {
          const active = goal === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.goalCard, active && styles.goalCardActive]}
              onPress={() => setGoal(opt.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.goalIcon}>{opt.icon}</Text>
              <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>
                {opt.label}
              </Text>
              <Text style={styles.goalSub}>{opt.sub}</Text>
              {active && (
                <View style={styles.goalCheckBadge}>
                  <Text style={styles.goalCheckMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtnSmall} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step 4: Body stats (optional) ────────────────────────────────────────────

const SEX_OPTIONS: { key: BiologicalSex; label: string }[] = [
  { key: 'male',              label: 'Male' },
  { key: 'female',            label: 'Female' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function StepBodyStats({
  age,    setAge,
  sex,    setSex,
  height, setHeight,
  weight, setWeight,
  onNext,
  onBack,
}: {
  age:       string; setAge:    (v: string) => void;
  sex:       BiologicalSex | null; setSex: (v: BiologicalSex | null) => void;
  height:    string; setHeight: (v: string) => void;
  weight:    string; setWeight: (v: string) => void;
  onNext:    () => void;
  onBack:    () => void;
}) {
  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>About you</Text>
      <Text style={styles.stepSubtitle}>
        Optional — lets your coach give more personalised advice. You can update these any time on your profile.
      </Text>

      <View style={styles.statsCard}>

        {/* Age */}
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Age</Text>
          <TextInput
            style={styles.statsInput}
            placeholder="—"
            placeholderTextColor={colors.text.tertiary}
            value={age}
            onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="done"
          />
        </View>

        <View style={styles.statsDivider} />

        {/* Sex */}
        <View style={[styles.statsRow, { alignItems: 'flex-start', paddingVertical: spacing[3] }]}>
          <Text style={[styles.statsLabel, { paddingTop: spacing[1] }]}>Sex</Text>
          <View style={styles.sexPicker}>
            {SEX_OPTIONS.map(opt => {
              const active = sex === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sexBtn, active && styles.sexBtnActive]}
                  onPress={() => setSex(active ? null : opt.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sexBtnText, active && styles.sexBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.statsDivider} />

        {/* Height */}
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Height</Text>
          <View style={styles.statsInputWithUnit}>
            <TextInput
              style={[styles.statsInput, { textAlign: 'right' }]}
              placeholder="—"
              placeholderTextColor={colors.text.tertiary}
              value={height}
              onChangeText={v => setHeight(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="done"
            />
            <Text style={styles.statsUnit}>cm</Text>
          </View>
        </View>

        <View style={styles.statsDivider} />

        {/* Weight */}
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Weight</Text>
          <View style={styles.statsInputWithUnit}>
            <TextInput
              style={[styles.statsInput, { textAlign: 'right' }]}
              placeholder="—"
              placeholderTextColor={colors.text.tertiary}
              value={weight}
              onChangeText={v => setWeight(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={5}
              returnKeyType="done"
            />
            <Text style={styles.statsUnit}>kg</Text>
          </View>
        </View>

      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtnSmall} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step 5: Permissions ──────────────────────────────────────────────────────

const HEALTH_PERMS = [
  { icon: '🫀', label: 'Heart Rate Variability', detail: 'Recovery score component' },
  { icon: '💓', label: 'Resting Heart Rate',     detail: 'Personalised daily baseline' },
  { icon: '😴', label: 'Sleep Analysis',         detail: 'Duration, deep sleep & REM' },
];

function StepPermissions({
  onNext,
  onBack,
}: {
  onNext: (granted: boolean) => void;
  onBack: () => void;
}) {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant() {
    if (Platform.OS !== 'ios' || !isHealthKitAvailable()) {
      onNext(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const granted = await requestHealthKitPermissions();
      onNext(granted);
    } catch (e: any) {
      setError('Could not open Apple Health. Make sure the app is installed and try again.');
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.scrollStep}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Connect Apple Health</Text>
      <Text style={styles.stepSubtitle}>
        Readiness reads three types of data to calculate your score — nothing else.
      </Text>

      <View style={styles.permList}>
        {HEALTH_PERMS.map(p => (
          <View key={p.label} style={styles.permRow}>
            <Text style={styles.permIcon}>{p.icon}</Text>
            <View>
              <Text style={styles.permLabel}>{p.label}</Text>
              <Text style={styles.permDetail}>{p.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.privacyBanner}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.text.tertiary} />
        <Text style={styles.privacyText}>
          Your health data stays on your device and is never uploaded or shared.
        </Text>
      </View>

      {error !== null && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
        onPress={handleGrant}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy
          ? <ActivityIndicator color={colors.text.inverse} />
          : <Text style={styles.primaryBtnText}>Grant Apple Health Access</Text>
        }
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNext(false)}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step 6: Automated setup ──────────────────────────────────────────────────

interface SetupState {
  healthDone:   boolean;
  baselineDone: boolean;
  baseline:     number | null;
  allDone:      boolean;
}

function SetupItem({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.setupRow}>
      {done
        ? <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        : <ActivityIndicator size="small" color={colors.amber[400]} />
      }
      <Text style={[styles.setupLabel, done && styles.setupLabelDone]}>{label}</Text>
    </View>
  );
}

function StepSetup({
  permissionGranted,
  selectedDevice,
  userName,
  trainingFreq,
  goal,
  age,
  sex,
  height,
  weight,
  onComplete,
}: {
  permissionGranted: boolean;
  selectedDevice:    DeviceType;
  userName:          string;
  trainingFreq:      TrainingFrequency;
  goal:              TrainingGoal;
  age:               string;
  sex:               BiologicalSex | null;
  height:            string;
  weight:            string;
  onComplete:        () => void;
}) {
  const [s, setS] = useState<SetupState>({
    healthDone:   false,
    baselineDone: false,
    baseline:     null,
    allDone:      false,
  });

  useEffect(() => {
    async function run() {
      await pause(700);
      setS(prev => ({ ...prev, healthDone: true }));

      const baseline = permissionGranted ? await getPersonalRHRBaseline() : 60;
      setS(prev => ({ ...prev, baselineDone: true, baseline }));

      await pause(900);
      setS(prev => ({ ...prev, allDone: true }));

      // Persist all completion flags + profile data
      const pairs: [string, string][] = [
        [ONBOARDING_KEY, 'true'],
        [DEVICE_KEY,     selectedDevice],
        [NAME_KEY,       userName.trim()],
        [FREQ_KEY,       trainingFreq],
        [JOINED_AT_KEY,  new Date().toISOString()],
        [PROFILE_GOAL_KEY, goal],
      ];

      if (age.trim())    pairs.push([PROFILE_AGE_KEY,    age.trim()]);
      if (sex)           pairs.push([PROFILE_SEX_KEY,    sex]);
      if (height.trim()) pairs.push([PROFILE_HEIGHT_KEY, height.trim()]);
      if (weight.trim()) pairs.push([PROFILE_WEIGHT_KEY, weight.trim()]);

      await AsyncStorage.multiSet(pairs);
      await pause(400);
      onComplete();
    }
    run();
  }, []);

  const firstName = userName.trim() ? `, ${userName.trim().split(' ')[0]}` : '';

  return (
    <View style={styles.setupContainer}>
      <Text style={styles.setupTitle}>Setting up{firstName}…</Text>
      <Text style={styles.setupSubtitle}>Just a moment</Text>

      <View style={styles.setupList}>
        <SetupItem
          label={permissionGranted ? 'Apple Health connected' : 'Skipped Apple Health'}
          done={s.healthDone}
        />
        <SetupItem
          label={
            s.baselineDone && s.baseline !== null
              ? `Resting heart rate baseline: ${s.baseline} bpm`
              : 'Computing your personal baseline…'
          }
          done={s.baselineDone}
        />
        <SetupItem
          label="All set — loading your score"
          done={s.allDone}
        />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router  = useRouter();
  const [step,              setStep]   = useState(0);
  const [name,              setName]   = useState('');
  const [device,            setDevice] = useState<DeviceType>('garmin');
  const [trainingFreq,      setFreq]   = useState<TrainingFrequency>('moderate');
  const [goal,              setGoal]   = useState<TrainingGoal>('general_health');
  const [age,               setAge]    = useState('');
  const [sex,               setSex]    = useState<BiologicalSex | null>(null);
  const [height,            setHeight] = useState('');
  const [weight,            setWeight] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  function next() { setStep(s => s + 1); }
  function back() { setStep(s => Math.max(0, s - 1)); }

  function handlePermissionsNext(granted: boolean) {
    setPermissionGranted(granted);
    setStep(6); // jump to auto-setup
  }

  function handleComplete() {
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Progress dots for steps 0-5 only */}
      {step < 6 && <ProgressDots step={step} />}

      {step === 0 && (
        <StepWelcome name={name} setName={setName} onNext={next} />
      )}
      {step === 1 && (
        <StepHowItWorks onNext={next} onBack={back} />
      )}
      {step === 2 && (
        <StepDevice
          device={device}
          setDevice={setDevice}
          onNext={next}
          onBack={back}
        />
      )}
      {step === 3 && (
        <StepTrainingProfile
          freq={trainingFreq}
          setFreq={setFreq}
          goal={goal}
          setGoal={setGoal}
          onNext={next}
          onBack={back}
        />
      )}
      {step === 4 && (
        <StepBodyStats
          age={age}       setAge={setAge}
          sex={sex}       setSex={setSex}
          height={height} setHeight={setHeight}
          weight={weight} setWeight={setWeight}
          onNext={next}
          onBack={back}
        />
      )}
      {step === 5 && (
        <StepPermissions onNext={handlePermissionsNext} onBack={back} />
      )}
      {step === 6 && (
        <StepSetup
          permissionGranted={permissionGranted}
          selectedDevice={device}
          userName={name}
          trainingFreq={trainingFreq}
          goal={goal}
          age={age}
          sex={sex}
          height={height}
          weight={weight}
          onComplete={handleComplete}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // ── Progress dots ──────────────────────────────────────────────────────────
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.default,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.amber[400],
  },

  // ── Shared step layouts ────────────────────────────────────────────────────
  stepContent: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    justifyContent: 'flex-end',
    gap: spacing[4],
  },
  scrollStep: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[4],
    justifyContent: 'flex-end',
  },

  // ── Step 0: Welcome ────────────────────────────────────────────────────────
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  ringOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 52,
  },
  ringLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    marginTop: spacing[0.5],
  },
  appName: {
    color: colors.amber[400],
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginTop: -spacing[2],
  },
  welcomeBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Name input
  nameBlock: {
    gap: spacing[2],
  },
  nameLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    color: colors.text.primary,
    fontSize: fontSize.base,
    textAlign: 'center',
  },

  // ── Shared titles ──────────────────────────────────────────────────────────
  stepTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  stepSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: -spacing[2],
  },
  sectionHeading: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: -spacing[1],
  },

  // ── Step 1: Components ─────────────────────────────────────────────────────
  componentList: {
    gap: spacing[3],
  },
  componentCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
    gap: spacing[2],
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  componentIcon: {
    fontSize: 18,
  },
  componentName: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    flex: 1,
  },
  weightPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  weightText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  componentDesc: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  // ── Step 2: Devices ────────────────────────────────────────────────────────
  deviceGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  deviceCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
  },
  deviceCardFull: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  deviceCardActive: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[900],
  },
  deviceEmoji: {
    fontSize: 28,
  },
  deviceLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  deviceLabelActive: {
    color: colors.amber[400],
    fontWeight: fontWeight.semiBold,
  },

  // ── Step 3: Training frequency ─────────────────────────────────────────────
  freqList: {
    gap: spacing[3],
  },
  freqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
  },
  freqCardActive: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[900],
  },
  freqIcon: {
    fontSize: 26,
    width: 36,
    textAlign: 'center',
  },
  freqText: {
    flex: 1,
    gap: spacing[0.5],
  },
  freqLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  freqLabelActive: {
    color: colors.amber[400],
  },
  freqSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  freqCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.amber[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqCheckMark: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },

  // ── Step 3: Goal picker ────────────────────────────────────────────────────
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  goalCard: {
    width: '47%',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[1],
    position: 'relative',
  },
  goalCardActive: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[900],
  },
  goalIcon: {
    fontSize: 22,
    marginBottom: spacing[1],
  },
  goalLabel: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  goalLabelActive: {
    color: colors.amber[400],
  },
  goalSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  goalCheckBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.amber[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCheckMark: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },

  // ── Step 4: Body stats ─────────────────────────────────────────────────────
  statsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  statsLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  statsInput: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    minWidth: 60,
    textAlign: 'right',
  },
  statsInputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statsUnit: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  statsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing[4],
  },
  sexPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: spacing[3],
  },
  sexBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.tertiary,
  },
  sexBtnActive: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[900],
  },
  sexBtnText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  sexBtnTextActive: {
    color: colors.amber[400],
    fontWeight: fontWeight.semiBold,
  },

  // ── Step 5: Permissions ────────────────────────────────────────────────────
  permList: {
    gap: spacing[4],
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  permIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  permLabel: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  permDetail: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  privacyText: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnSmall: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: spacing[3],
  },
  backBtnText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  skipText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    paddingVertical: spacing[3],
  },

  // ── Step 6: Setup ──────────────────────────────────────────────────────────
  setupContainer: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
    gap: spacing[8],
  },
  setupTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  setupSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: -spacing[6],
  },
  setupList: {
    gap: spacing[5],
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  setupLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    flex: 1,
  },
  setupLabelDone: {
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
});
