/**
 * onboardingOptions — the selection tables for the onboarding steps.
 *
 * Kept out of the screen so the option copy is one obvious place to edit and
 * the tables can be unit-tested.
 */

export type DeviceType        = 'garmin' | 'apple_watch' | 'both' | 'other' | 'none';
export type TrainingFrequency = 'light' | 'moderate' | 'high';
export type TrainingGoal      = 'performance' | 'recovery' | 'weight_loss' | 'general_health';
export type BiologicalSex     = 'male' | 'female' | 'prefer_not_to_say';

export const DEVICES: { key: DeviceType; label: string; icon: string }[] = [
  { key: 'garmin',      label: 'Garmin',              icon: '⌚' },
  { key: 'apple_watch', label: 'Apple Watch',         icon: '🍎' },
  { key: 'both',        label: 'Both',                icon: '🔁' },
  { key: 'other',       label: 'Other watch or ring', icon: '💍' },
  { key: 'none',        label: 'No watch',            icon: '📱' },
];

// Said before Health access is asked, so nobody without a watch finds out
// from an empty score on day one.
export const DEVICE_NOTE: Partial<Record<DeviceType, string>> = {
  other: 'Readiness works with any watch or ring whose app shares heart rate, HRV and sleep with Apple Health. Turn that sharing on in its app.',
  none:  'Most of the score comes from overnight heart data, which needs a watch. Without one your score will be limited: you can type in an HRV reading each morning, and sleep counts if an app writes it to Apple Health.',
};

export const FREQ_OPTIONS: {
  key:   TrainingFrequency;
  icon:  string;
  label: string;
  sub:   string;
}[] = [
  { key: 'light',    icon: '🚶', label: '2–3 days / week', sub: 'I exercise occasionally' },
  { key: 'moderate', icon: '🏃', label: '4–5 days / week', sub: 'I train consistently' },
  { key: 'high',     icon: '⚡', label: '6+ days / week',  sub: "I'm a high-volume athlete" },
];

export const GOAL_OPTIONS: {
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

export const SEX_OPTIONS: { key: BiologicalSex; label: string }[] = [
  { key: 'female',            label: 'Female' },
  { key: 'male',              label: 'Male' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];
