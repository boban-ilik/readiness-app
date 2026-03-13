/**
 * userProfile.ts
 *
 * Loads the user's personal profile from AsyncStorage and exposes it as a
 * typed object that other services (coach chat, daily briefing) can include
 * as personalisation context.
 *
 * All fields are optional — the app works even if the user skipped profile setup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAME_KEY, FREQ_KEY } from '../../app/onboarding';

// ─── Storage keys (mirrored from profile.tsx) ─────────────────────────────────

export const PROFILE_AGE_KEY    = '@readiness/profile_age';
export const PROFILE_SEX_KEY    = '@readiness/profile_sex';
export const PROFILE_HEIGHT_KEY = '@readiness/profile_height_cm';
export const PROFILE_WEIGHT_KEY = '@readiness/profile_weight_kg';
export const PROFILE_GOAL_KEY   = '@readiness/profile_goal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BiologicalSex     = 'male' | 'female' | 'prefer_not_to_say';
export type TrainingFrequency = 'light' | 'moderate' | 'high';
export type TrainingGoal      = 'performance' | 'recovery' | 'weight_loss' | 'general_health';

export interface UserProfile {
  name?:             string;
  age?:              number;
  sex?:              BiologicalSex;
  heightCm?:         number;
  weightKg?:         number;
  trainingFrequency?: TrainingFrequency;
  primaryGoal?:      TrainingGoal;
  /** Computed from height + weight when both are present */
  bmi?:              number;
}

// ─── Human-readable labels ────────────────────────────────────────────────────

export function sexLabel(sex: BiologicalSex): string {
  switch (sex) {
    case 'male':              return 'male';
    case 'female':            return 'female';
    case 'prefer_not_to_say': return 'unspecified';
  }
}

export function freqLabel(freq: TrainingFrequency): string {
  switch (freq) {
    case 'light':    return '2–3 days/week';
    case 'moderate': return '4–5 days/week';
    case 'high':     return '6+ days/week';
  }
}

export function goalLabel(goal: TrainingGoal): string {
  switch (goal) {
    case 'performance':    return 'peak performance';
    case 'recovery':       return 'optimise recovery';
    case 'weight_loss':    return 'lose weight';
    case 'general_health': return 'general health';
  }
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load the user's profile from AsyncStorage.
 * Returns an empty object if nothing has been set (never throws).
 */
export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const entries = await AsyncStorage.multiGet([
      NAME_KEY,
      FREQ_KEY,
      PROFILE_AGE_KEY,
      PROFILE_SEX_KEY,
      PROFILE_HEIGHT_KEY,
      PROFILE_WEIGHT_KEY,
      PROFILE_GOAL_KEY,
    ]);
    const map = Object.fromEntries(entries.map(([k, v]) => [k, v]));

    const heightCm = map[PROFILE_HEIGHT_KEY] ? Number(map[PROFILE_HEIGHT_KEY]) : undefined;
    const weightKg = map[PROFILE_WEIGHT_KEY] ? Number(map[PROFILE_WEIGHT_KEY]) : undefined;
    const bmi =
      heightCm && weightKg && heightCm > 0
        ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
        : undefined;

    const profile: UserProfile = {};

    if (map[NAME_KEY])              profile.name             = map[NAME_KEY]!.trim();
    if (map[PROFILE_AGE_KEY])       profile.age              = Number(map[PROFILE_AGE_KEY]);
    if (map[PROFILE_SEX_KEY])       profile.sex              = map[PROFILE_SEX_KEY] as BiologicalSex;
    if (heightCm)                   profile.heightCm         = heightCm;
    if (weightKg)                   profile.weightKg         = weightKg;
    if (bmi)                        profile.bmi              = bmi;
    if (map[FREQ_KEY])              profile.trainingFrequency = map[FREQ_KEY] as TrainingFrequency;
    if (map[PROFILE_GOAL_KEY])      profile.primaryGoal      = map[PROFILE_GOAL_KEY] as TrainingGoal;

    return profile;
  } catch {
    return {};
  }
}
