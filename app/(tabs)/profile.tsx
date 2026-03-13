import {
  View, Text, TouchableOpacity, Switch, StyleSheet,
  Alert, ScrollView, Image, Platform,
} from 'react-native';
import { SafeAreaView }              from 'react-native-safe-area-context';
import { useEffect, useState }       from 'react';
import AsyncStorage                  from '@react-native-async-storage/async-storage';
import Constants                     from 'expo-constants';
import { useRouter }                 from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { useAuth }                   from '@contexts/AuthContext';
import { useSubscription }           from '@contexts/SubscriptionContext';
import { useNotifications }          from '@hooks/useNotifications';
import { ProGate }                   from '@components/common/ProGate';
import { NAME_KEY, FREQ_KEY, JOINED_AT_KEY } from '../onboarding';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// ─── expo-image-picker — deferred require ─────────────────────────────────────
// expo-modules-core populates globalThis.expo.modules during native bridge
// initialisation. Requiring at module-evaluation time can race that setup, so
// we require inside each handler (tap-time) when the runtime is fully ready.
type ImagePickerModule = typeof import('expo-image-picker');
function getIP(): ImagePickerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker') as ImagePickerModule;
  } catch {
    return null;
  }
}

// ─── expo-file-system — deferred require ──────────────────────────────────────
// Same deferred pattern: required at tap-time to avoid module-evaluation races.
type FileSystemModule = typeof import('expo-file-system');
function getFS(): FileSystemModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-file-system') as FileSystemModule;
  } catch {
    return null;
  }
}

/**
 * Copies a picked/captured image URI into the app's Documents directory
 * so it survives iOS cache evictions and app restarts.
 *
 * The image picker returns a temp file in Caches/ — fine for display but
 * iOS can remove it at any time. Documents/ is persistent and backed up.
 *
 * Uses a timestamp in the filename so React Native's Image component treats
 * each save as a new URI and doesn't serve a stale cache hit.
 *
 * Also deletes the previous persistent copy (if any) to avoid accumulation.
 */
async function persistPhoto(
  tempUri: string,
  previousPersistentUri: string | null,
): Promise<string> {
  const FS = getFS();
  if (!FS || !FS.documentDirectory) {
    // FileSystem native module not linked (stale build — run pod install + rebuild).
    // Throw so the caller can show a meaningful error instead of silently
    // storing a temp URI that iOS will evict between launches.
    throw new Error('expo-file-system is not available. Rebuild the app to enable photo saving.');
  }

  // Delete the old persistent file to keep Documents tidy
  if (previousPersistentUri && previousPersistentUri.startsWith(FS.documentDirectory)) {
    try {
      await FS.deleteAsync(previousPersistentUri, { idempotent: true });
    } catch { /* non-fatal */ }
  }

  const ext     = tempUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const destUri = `${FS.documentDirectory}profile_photo_${Date.now()}.${ext}`;
  try {
    await FS.copyAsync({ from: tempUri, to: destUri });
  } catch (copyErr) {
    // Copy failed — file may have been evicted from the picker temp dir.
    // Throw so the alert in the handler shows the real error.
    throw new Error(`Could not save photo: ${String(copyErr)}`);
  }
  return destUri;
}

// ─── AsyncStorage keys ────────────────────────────────────────────────────────

const PHOTO_KEY  = '@readiness/profile_photo_uri';
const AGE_KEY    = '@readiness/profile_age';
const SEX_KEY    = '@readiness/profile_sex';
const HEIGHT_KEY = '@readiness/profile_height_cm';
const WEIGHT_KEY = '@readiness/profile_weight_kg';
const GOAL_KEY   = '@readiness/profile_goal';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainingFrequency = 'light' | 'moderate' | 'high';
type BiologicalSex     = 'male' | 'female' | 'prefer_not_to_say';
type TrainingGoal      = 'performance' | 'recovery' | 'weight_loss' | 'general_health';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function freqLabel(freq: TrainingFrequency): string {
  switch (freq) {
    case 'light':    return '🚶 2–3 days/week';
    case 'moderate': return '🏃 4–5 days/week';
    case 'high':     return '⚡ 6+ days/week';
  }
}

function sexLabel(sex: BiologicalSex): string {
  switch (sex) {
    case 'male':               return 'Male';
    case 'female':             return 'Female';
    case 'prefer_not_to_say':  return 'Prefer not to say';
  }
}

function goalLabel(goal: TrainingGoal): string {
  switch (goal) {
    case 'performance':    return '🏆 Peak performance';
    case 'recovery':       return '🔄 Optimise recovery';
    case 'weight_loss':    return '⚖️  Lose weight';
    case 'general_health': return '❤️  General health';
  }
}

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── Reusable settings row components ─────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingsCard}>{children}</View>;
}

function RowBase({
  label,
  sublabel,
  right,
  topBorder = true,
  onPress,
}: {
  label:      string;
  sublabel?:  string;
  right:      React.ReactNode;
  topBorder?: boolean;
  onPress?:   () => void;
}) {
  const inner = (
    <View style={[styles.row, topBorder && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

function ToggleRow({
  label, sublabel, value, onValueChange, topBorder,
}: {
  label:         string;
  sublabel?:     string;
  value:         boolean;
  onValueChange: (v: boolean) => void;
  topBorder?:    boolean;
}) {
  return (
    <RowBase
      label={label}
      sublabel={sublabel}
      topBorder={topBorder}
      right={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border.default, true: colors.amber[400] }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border.default}
        />
      }
    />
  );
}

function StepperRow({
  label, sublabel, value, unit, min, max, onDecrement, onIncrement, topBorder,
}: {
  label:       string;
  sublabel?:   string;
  value:       number;
  unit:        string;
  min:         number;
  max:         number;
  onDecrement: () => void;
  onIncrement: () => void;
  topBorder?:  boolean;
}) {
  return (
    <RowBase
      label={label}
      sublabel={sublabel}
      topBorder={topBorder}
      right={
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
            onPress={onDecrement}
            disabled={value <= min}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.stepBtnText, value <= min && styles.stepBtnTextDisabled]}>−</Text>
          </TouchableOpacity>

          <Text style={styles.stepValue}>
            {value}<Text style={styles.stepUnit}> {unit}</Text>
          </Text>

          <TouchableOpacity
            style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
            onPress={onIncrement}
            disabled={value >= max}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.stepBtnText, value >= max && styles.stepBtnTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

/** A tappable row that shows a current value and a › chevron. */
function SelectRow({
  label, value, topBorder, onPress,
}: {
  label:      string;
  value:      string;
  topBorder?: boolean;
  onPress:    () => void;
}) {
  return (
    <RowBase
      label={label}
      topBorder={topBorder}
      onPress={onPress}
      right={
        <View style={styles.selectRight}>
          <Text style={styles.selectValue} numberOfLines={1}>{value}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      }
    />
  );
}

// ─── Notifications settings (Pro content inside ProGate) ──────────────────────

function NotificationsContent() {
  const { prefs, permissionStatus, requestPermissions, updatePrefs } = useNotifications();
  const hasPermission = permissionStatus === 'granted';

  if (IS_EXPO_GO) {
    return (
      <View style={styles.notifContent}>
        <View style={styles.expoGoNote}>
          <Text style={styles.expoGoNoteText}>
            🔔  Notifications require a custom dev build. Run{' '}
            <Text style={styles.expoGoNoteCode}>npx expo run:ios</Text> or use
            EAS Build to test this feature on a real device.
          </Text>
        </View>
      </View>
    );
  }

  const handleDigestToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for Readiness in iOS Settings → Readiness → Notifications.',
          [{ text: 'OK' }],
        );
        return;
      }
    }
    await updatePrefs({ digestEnabled: value });
  };

  const handleThresholdToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for Readiness in iOS Settings → Readiness → Notifications.',
          [{ text: 'OK' }],
        );
        return;
      }
    }
    await updatePrefs({ thresholdEnabled: value });
  };

  const digestTimeLabel = `${String(prefs.digestHour).padStart(2, '0')}:${String(prefs.digestMinute).padStart(2, '0')}`;

  return (
    <View style={styles.notifContent}>
      <SectionLabel title="MORNING DIGEST" />
      <SettingsCard>
        <ToggleRow
          label="Daily morning reminder"
          sublabel="Tap to check your score for the day"
          value={prefs.digestEnabled}
          onValueChange={handleDigestToggle}
          topBorder={false}
        />
        {prefs.digestEnabled && (
          <StepperRow
            label="Reminder time"
            sublabel={digestTimeLabel}
            value={prefs.digestHour}
            unit="h"
            min={4}
            max={12}
            onDecrement={() => updatePrefs({ digestHour: prefs.digestHour - 1 })}
            onIncrement={() => updatePrefs({ digestHour: prefs.digestHour + 1 })}
          />
        )}
      </SettingsCard>

      <SectionLabel title="SCORE THRESHOLD" />
      <SettingsCard>
        <ToggleRow
          label="Low readiness alert"
          sublabel="Notified when your score opens below your target"
          value={prefs.thresholdEnabled}
          onValueChange={handleThresholdToggle}
          topBorder={false}
        />
        {prefs.thresholdEnabled && (
          <StepperRow
            label="Alert below"
            sublabel="Adjust to match your training goals"
            value={prefs.thresholdValue}
            unit="pts"
            min={30}
            max={90}
            onDecrement={() => updatePrefs({ thresholdValue: prefs.thresholdValue - 5 })}
            onIncrement={() => updatePrefs({ thresholdValue: prefs.thresholdValue + 5 })}
          />
        )}
      </SettingsCard>

      {permissionStatus === 'denied' && (
        <View style={styles.permWarning}>
          <Text style={styles.permWarningText}>
            ⚠️  Notifications are blocked. Go to iOS Settings → Readiness → Notifications to enable them.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router                             = useRouter();
  const { user, signOut }                  = useAuth();
  const { isPro, debugSetPro, presentPaywall, presentCustomerCenter } = useSubscription();

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [userName,     setUserName]     = useState<string>('');
  const [trainingFreq, setTrainingFreq] = useState<TrainingFrequency | null>(null);
  const [joinedAt,     setJoinedAt]     = useState<string | null>(null);
  const [photoUri,     setPhotoUri]     = useState<string | null>(null);

  // Personal details
  const [age,    setAge]    = useState<number>(30);
  const [sex,    setSex]    = useState<BiologicalSex | null>(null);
  const [height, setHeight] = useState<number>(175); // cm
  const [weight, setWeight] = useState<number>(75);  // kg

  // Training goal
  const [goal, setGoal] = useState<TrainingGoal | null>(null);

  // ── Load saved data ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          NAME_KEY, FREQ_KEY, JOINED_AT_KEY,
          PHOTO_KEY, AGE_KEY, SEX_KEY, HEIGHT_KEY, WEIGHT_KEY, GOAL_KEY,
        ]);
        const map = Object.fromEntries(entries.map(([k, v]) => [k, v]));

        if (map[NAME_KEY])      setUserName(map[NAME_KEY]!.trim());
        if (map[FREQ_KEY])      setTrainingFreq(map[FREQ_KEY] as TrainingFrequency);
        if (map[JOINED_AT_KEY]) setJoinedAt(map[JOINED_AT_KEY]);
        if (map[AGE_KEY])       setAge(Number(map[AGE_KEY]));
        if (map[SEX_KEY])       setSex(map[SEX_KEY] as BiologicalSex);
        if (map[HEIGHT_KEY])    setHeight(Number(map[HEIGHT_KEY]));
        if (map[WEIGHT_KEY])    setWeight(Number(map[WEIGHT_KEY]));
        if (map[GOAL_KEY])      setGoal(map[GOAL_KEY] as TrainingGoal);

        // ── Validate stored photo URI ──────────────────────────────────────
        // Each fresh install (npx expo run:ios) gets a new app container UUID,
        // so any previously-stored file:// path is stale and the file no
        // longer exists. Check with FileSystem before setting state; if the
        // file is gone, clear the stale key so the initials avatar shows.
        const storedUri = map[PHOTO_KEY];
        if (storedUri) {
          const FS = getFS();
          if (FS) {
            try {
              const info = await FS.getInfoAsync(storedUri);
              if (info.exists) {
                setPhotoUri(storedUri);
              } else {
                // Stale URI — silently clear it
                AsyncStorage.removeItem(PHOTO_KEY).catch(() => {});
              }
            } catch {
              // getInfoAsync unavailable; optimistically set and let Image handle it
              setPhotoUri(storedUri);
            }
          } else {
            // FileSystem not linked yet (stale build) — just try to display
            setPhotoUri(storedUri);
          }
        }
      } catch { /* AsyncStorage read failure — non-fatal */ }
    })();
  }, []);

  const displayName = userName || user?.email?.split('@')[0] || 'Athlete';
  const initial     = displayName[0]?.toUpperCase() ?? '?';

  // ── Photo picker ────────────────────────────────────────────────────────────

  const nativeNotReadyAlert = () => {
    const msg = IS_EXPO_GO
      ? 'expo-image-picker isn\'t available in Expo Go for this SDK version.\n\nRun a native build instead:\n  npx expo run:ios'
      : 'The native ImagePicker module isn\'t registered in the running binary — the build is stale.\n\nRun a full clean rebuild:\n  cd ios && pod install && cd ..\n  npx expo run:ios --no-build-cache\n\nOr in Xcode: Product → Clean Build Folder (⇧⌘K) then run.';
    Alert.alert('Photo picker unavailable', msg, [{ text: 'OK' }]);
  };

  const handlePickPhoto = async () => {
    const IP = getIP();
    if (!IP) { nativeNotReadyAlert(); return; }
    try {
      const { status } = await IP.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow Readiness to access your photos in Settings → Readiness → Photos.',
        );
        return;
      }
      const result = await IP.launchImageLibraryAsync({
        mediaTypes: IP.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:        [1, 1],
        quality:       0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        try {
          const persistentUri = await persistPhoto(result.assets[0].uri, photoUri);
          setPhotoUri(persistentUri);
          await AsyncStorage.setItem(PHOTO_KEY, persistentUri);
        } catch (saveErr: unknown) {
          const msg = saveErr instanceof Error ? saveErr.message : 'Could not save photo.';
          Alert.alert('Photo not saved', msg);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleTakePhoto = async () => {
    const IP = getIP();
    if (!IP) { nativeNotReadyAlert(); return; }
    try {
      const { status } = await IP.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow Readiness to access your camera in Settings → Readiness → Camera.',
        );
        return;
      }
      const result = await IP.launchCameraAsync({
        allowsEditing: true,
        aspect:        [1, 1],
        quality:       0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        try {
          const persistentUri = await persistPhoto(result.assets[0].uri, photoUri);
          setPhotoUri(persistentUri);
          await AsyncStorage.setItem(PHOTO_KEY, persistentUri);
        } catch (saveErr: unknown) {
          const msg = saveErr instanceof Error ? saveErr.message : 'Could not save photo.';
          Alert.alert('Photo not saved', msg);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleAvatarPress = () => {
    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Camera',        onPress: handleTakePhoto },
      { text: 'Photo library', onPress: handlePickPhoto },
      ...(photoUri ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => {
        // Delete persistent file from Documents if it lives there
        const FS = getFS();
        if (FS?.documentDirectory && photoUri.startsWith(FS.documentDirectory)) {
          FS.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
        }
        setPhotoUri(null);
        AsyncStorage.removeItem(PHOTO_KEY).catch(() => {});
      }}] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Edit name ───────────────────────────────────────────────────────────────
  const handleEditName = () => {
    Alert.prompt(
      'Edit name',
      'How should we call you?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (value?: string) => {
            const trimmed = value?.trim() ?? '';
            if (!trimmed) return;
            setUserName(trimmed);
            AsyncStorage.setItem(NAME_KEY, trimmed).catch(() => {});
          },
        },
      ],
      'plain-text',
      userName,
    );
  };

  // ── Sex picker ──────────────────────────────────────────────────────────────
  const handlePickSex = () => {
    const options: BiologicalSex[] = ['male', 'female', 'prefer_not_to_say'];
    Alert.alert('Biological sex', 'Used to personalise your baselines', [
      ...options.map(o => ({
        text:    sexLabel(o),
        onPress: () => {
          setSex(o);
          AsyncStorage.setItem(SEX_KEY, o).catch(() => {});
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Training freq picker ────────────────────────────────────────────────────
  const handlePickFreq = () => {
    const options: TrainingFrequency[] = ['light', 'moderate', 'high'];
    Alert.alert('Training frequency', 'How often do you train?', [
      ...options.map(o => ({
        text:    freqLabel(o),
        onPress: () => {
          setTrainingFreq(o);
          AsyncStorage.setItem(FREQ_KEY, o).catch(() => {});
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Goal picker ─────────────────────────────────────────────────────────────
  const handlePickGoal = () => {
    const options: TrainingGoal[] = ['performance', 'recovery', 'weight_loss', 'general_health'];
    Alert.alert('Primary goal', 'What are you optimising for?', [
      ...options.map(o => ({
        text:    goalLabel(o),
        onPress: () => {
          setGoal(o);
          AsyncStorage.setItem(GOAL_KEY, o).catch(() => {});
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Save helpers ────────────────────────────────────────────────────────────
  const saveAge    = (v: number) => { setAge(v);    AsyncStorage.setItem(AGE_KEY,    String(v)).catch(() => {}); };
  const saveHeight = (v: number) => { setHeight(v); AsyncStorage.setItem(HEIGHT_KEY, String(v)).catch(() => {}); };
  const saveWeight = (v: number) => { setWeight(v); AsyncStorage.setItem(WEIGHT_KEY, String(v)).catch(() => {}); };

  // ── Sign out + dev ──────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          try { await signOut(); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleManageSubscription = async () => {
    await presentCustomerCenter();
  };

  const handlePlanLongPress = () => {
    if (!__DEV__) return;
    Alert.alert('Dev toggle', `Switch to ${isPro ? 'Free' : 'Pro'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes',    onPress: () => debugSetPro(!isPro) },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          {/* Tappable avatar */}
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={styles.avatarWrapper}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.heroInfo}>
            {/* Tappable name */}
            <TouchableOpacity onPress={handleEditName} activeOpacity={0.7} style={styles.heroNameRow}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.editPencil}>✎</Text>
            </TouchableOpacity>

            <View style={styles.heroBadges}>
              {trainingFreq && (
                <View style={styles.freqBadge}>
                  <Text style={styles.freqBadgeText}>{freqLabel(trainingFreq)}</Text>
                </View>
              )}
              {joinedAt && (
                <Text style={styles.joinedText}>Since {formatJoinedDate(joinedAt)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <SectionLabel title="ACCOUNT" />
        <SettingsCard>
          <RowBase
            label="Email"
            topBorder={false}
            right={
              <Text style={styles.rowValue} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            }
          />
          <TouchableOpacity onLongPress={handlePlanLongPress} activeOpacity={1}>
            <RowBase
              label="Plan"
              right={
                isPro ? (
                  <View style={styles.proPill}>
                    <Text style={styles.proPillText}>PRO ♛</Text>
                  </View>
                ) : (
                  <Text style={styles.freePillText}>Free</Text>
                )
              }
            />
          </TouchableOpacity>
          {isPro && (
            <RowBase
              label="Manage subscription"
              sublabel="Cancel, upgrade, request refund, or contact support"
              onPress={handleManageSubscription}
              right={<Text style={styles.chevron}>›</Text>}
            />
          )}
        </SettingsCard>

        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            activeOpacity={0.85}
            onPress={presentPaywall}
          >
            <Text style={styles.upgradeText}>Upgrade to Pro · $6.99/mo</Text>
          </TouchableOpacity>
        )}

        {/* ── Personal details ─────────────────────────────────────────────── */}
        <SectionLabel title="PERSONAL DETAILS" />
        <SettingsCard>
          <StepperRow
            label="Age"
            value={age}
            unit="yrs"
            min={13}
            max={100}
            onDecrement={() => saveAge(age - 1)}
            onIncrement={() => saveAge(age + 1)}
            topBorder={false}
          />
          <SelectRow
            label="Biological sex"
            value={sex ? sexLabel(sex) : 'Not set'}
            onPress={handlePickSex}
          />
          <StepperRow
            label="Height"
            value={height}
            unit="cm"
            min={100}
            max={250}
            onDecrement={() => saveHeight(height - 1)}
            onIncrement={() => saveHeight(height + 1)}
          />
          <StepperRow
            label="Weight"
            value={weight}
            unit="kg"
            min={30}
            max={250}
            onDecrement={() => saveWeight(weight - 1)}
            onIncrement={() => saveWeight(weight + 1)}
          />
        </SettingsCard>

        {/* ── Training profile ─────────────────────────────────────────────── */}
        <SectionLabel title="TRAINING PROFILE" />
        <SettingsCard>
          <SelectRow
            label="Training frequency"
            value={trainingFreq ? freqLabel(trainingFreq) : 'Not set'}
            topBorder={false}
            onPress={handlePickFreq}
          />
          <SelectRow
            label="Primary goal"
            value={goal ? goalLabel(goal) : 'Not set'}
            onPress={handlePickGoal}
          />
        </SettingsCard>
        <Text style={styles.sectionHint}>
          Used to personalise your coach recommendations and readiness context.
        </Text>

        {/* ── Notifications — Pro feature ─────────────────────────────────── */}
        <ProGate
          feature="Custom Thresholds & Notifications"
          description="Set a score target and get a morning digest — so your phone tells you how hard to push today."
          style={styles.proGateBlock}
        >
          <NotificationsContent />
        </ProGate>

        {/* ── Sign out ────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* ── DEV tools ──────────────────────────────────────────────────── */}
        {__DEV__ && (
          <>
            <SectionLabel title="DEVELOPER" />
            <SettingsCard>
              <ToggleRow
                label="Pro subscription"
                sublabel={isPro ? '✓ Pro features unlocked' : 'Tap to simulate a Pro purchase'}
                value={isPro}
                onValueChange={(v) => debugSetPro(v)}
                topBorder={false}
              />
            </SettingsCard>
            <Text style={styles.devNote}>
              This section is only visible in development builds and will not appear in the App Store release.
            </Text>
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[6],
  },

  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
    marginBottom: spacing[2],
    marginTop: spacing[4],
  },
  sectionHint: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing[2],
    lineHeight: fontSize.xs * 1.6,
  },

  settingsCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    minHeight: 52,
    gap: spacing[3],
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  rowLeft: {
    flex: 1,
    gap: spacing[0.5],
  },
  rowLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  rowSublabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    marginTop: 1,
  },
  rowValue: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    maxWidth: '55%',
    textAlign: 'right',
  },

  // ── SelectRow ──────────────────────────────────────────────────────────────
  selectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    maxWidth: '60%',
  },
  selectValue: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: 'right',
    flexShrink: 1,
  },
  chevron: {
    color: colors.text.tertiary,
    fontSize: fontSize.lg,
    marginTop: 1,
  },

  // ── Badges / pills ─────────────────────────────────────────────────────────
  proPill: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[0.5],
  },
  proPillText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  freePillText: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
  },

  // ── Stepper ────────────────────────────────────────────────────────────────
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  stepBtnTextDisabled: { color: colors.text.tertiary },
  stepValue: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    minWidth: 60,
    textAlign: 'center',
  },
  stepUnit: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifContent: { paddingBottom: spacing[2] },
  permWarning: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.warning,
  },
  permWarningText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.6,
  },
  proGateBlock: { marginTop: spacing[2] },
  expoGoNote: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    margin: spacing[2],
  },
  expoGoNoteText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
  expoGoNoteCode: {
    color: colors.amber[400],
    fontWeight: fontWeight.medium,
  },

  // ── Upgrade button ─────────────────────────────────────────────────────────
  upgradeButton: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[4],
  },
  upgradeText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },

  // ── Sign out ───────────────────────────────────────────────────────────────
  signOutButton: {
    paddingVertical: spacing[5],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },

  bottomPad: { height: spacing[8] },

  devNote: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
    lineHeight: fontSize.xs * 1.6,
  },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.amber[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 11,
    lineHeight: 14,
  },
  heroInfo: {
    flex: 1,
    gap: spacing[1.5],
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroName: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  editPencil: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    marginTop: 1,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  freqBadge: {
    backgroundColor: colors.amber[900] + '44',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[0.5],
    borderWidth: 1,
    borderColor: colors.amber[700] + '66',
  },
  freqBadgeText: {
    color: colors.amber[300],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.3,
  },
  joinedText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
});
