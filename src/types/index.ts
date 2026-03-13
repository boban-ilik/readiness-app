// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface ReadinessScore {
  date: string;           // ISO date string YYYY-MM-DD
  score: number;          // 0–100
  components: {
    recovery: number;     // 0–100 (45% weight)
    sleep: number;        // 0–100 (40% weight)
    stress: number;       // 0–100 (15% weight)
  };
  modifiers: JournalModifier[];
  aiInsight?: string;     // Pro only
  aiTip?: string;         // Pro only
}

export interface JournalModifier {
  tag: string;            // e.g. 'alcohol', 'late_meal', 'travel'
  impact: number;         // Negative = reduces score, positive = boosts
}

// ─── Health Data ─────────────────────────────────────────────────────────────

export interface HealthData {
  date: string;
  hrv: number | null;             // ms — from Apple Watch / Garmin (SDNN overnight)
  hrvSource?: 'healthkit' | 'manual'; // set to 'manual' when user entered HRV by hand
  restingHeartRate: number | null; // bpm
  sleepDuration: number | null;   // minutes
  deepSleep: number | null;       // minutes
  remSleep: number | null;        // minutes
  sleepEfficiency: number | null; // 0–100%
  stressScore: number | null;     // 0–100 (Garmin proprietary — doesn't sync to Apple Health)
  daytimeAvgHR: number | null;    // bpm — average HR during waking rest periods today
                                  // Used as a stress proxy for Garmin users without HRV sync

  // Activity (yesterday) — display context, does not feed into readiness score
  steps: number | null;           // total steps taken yesterday
  activeCalories: number | null;  // active energy burned yesterday (kcal)
  exerciseMinutes: number | null; // Apple Exercise ring minutes yesterday (brisk movement)
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  deviceType: 'apple_watch' | 'garmin' | 'both';
  subscriptionTier: 'free' | 'pro';
  createdAt: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: string;
  productId?: string;
}
