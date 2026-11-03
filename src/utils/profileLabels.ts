/**
 * profileLabels — how the Profile screen renders the saved enum values.
 *
 * (The coach/briefing use their own phrasing in services/userProfile.ts — this
 * version carries the emoji and title case the screen shows.)
 */

import type { BiologicalSex, TrainingFrequency, TrainingGoal } from '@constants/onboarding';

export function freqLabel(freq: TrainingFrequency): string {
  switch (freq) {
    case 'light':    return '🚶 2–3 days/week';
    case 'moderate': return '🏃 4–5 days/week';
    case 'high':     return '⚡ 6+ days/week';
  }
}

export function sexLabel(sex: BiologicalSex): string {
  switch (sex) {
    case 'male':               return 'Male';
    case 'female':             return 'Female';
    case 'prefer_not_to_say':  return 'Prefer not to say';
  }
}

export function goalLabel(goal: TrainingGoal): string {
  switch (goal) {
    case 'performance':    return '🏆 Peak performance';
    case 'recovery':       return '🔄 Optimise recovery';
    case 'weight_loss':    return '⚖️  Lose weight';
    case 'general_health': return '❤️  General health';
  }
}

export function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
