import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Share } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScoreRing from '@components/score/ScoreRing';
import ScoreBreakdownCard from '@components/score/ScoreBreakdownCard';
import TrainingLoadCard from '@components/score/TrainingLoadCard';
import NutritionCard from '@components/score/NutritionCard';
import StreakBanner from '@components/score/StreakBanner';
import WorkoutContextBanner from '@components/score/WorkoutContextBanner';
import { StravaLastWorkoutSection } from '@components/score/StravaLastWorkoutCard';
import { StravaTrainingLoadSection } from '@components/score/StravaTrainingLoadCard';
import { CalibrationBanner } from '@components/score/CalibrationBanner';
import { CyclePhaseSection } from '@components/score/CyclePhaseCard';
import { OvertrainingWarningCard } from '@components/score/OvertrainingWarningCard';
import TrendInsightCard from '@components/score/TrendInsightCard';
import ForecastStrip from '@components/score/ForecastStrip';
import LifeEventTagger from '@components/score/LifeEventTagger';
import BreakdownModal from '@components/score/BreakdownModal';
import DailyBriefingModal from '@components/score/DailyBriefingModal';
import CalibrationReportModal from '@components/score/CalibrationReportModal';
import { hasSeenCalibrationReport, markCalibrationReportSeen } from '@services/calibrationReport';
import { canUseFreeBriefing, markFreeBriefingUsed } from '@services/freeBriefing';
import ShareCard from '@components/score/ShareCard';
import { colors, fontSize, fontWeight, spacing, radius, getScoreColor, getScoreLabel } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useHealthData } from '@hooks/useHealthData';
import { useRecentWorkouts } from '@hooks/useRecentWorkouts';
import { useStravaActivities } from '@hooks/useStravaActivities';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useNotifications } from '@hooks/useNotifications';
import { useCalibrationStatus } from '@hooks/useCalibrationStatus';
import { useRatingPrompt } from '@hooks/useRatingPrompt';
import { useCycleTracking } from '@hooks/useCycleTracking';
import { useOvertrainingWarning } from '@hooks/useOvertrainingWarning';
import { PROFILE_SEX_KEY } from '@services/userProfile';
import { formatDisplayDate } from '@utils/index';
import { computeActivityScore } from '@utils/breakdown';
import { fetchTodayActivity, type TodayActivity } from '@services/healthkit';
import { analyzePatterns } from '@services/patternAnalysis';
import { analyzeWorkload } from '@services/workloadAnalysis';
import { computeForecast, type ReadinessForecast } from '@services/readinessForecast';
import { fetchRecentEvents, type LifeEvent } from '@services/lifeEvents';
import { supabase } from '@services/supabase';
import type { HealthData } from '@/types/index';
import { NAME_KEY } from '../onboarding';
import { localDateStr } from '@utils/index';

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function InsufficientDataCard({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={styles.insufficientCard}>
      <Text style={styles.insufficientEyebrow}>WAITING FOR YOUR FIRST SYNC</Text>
      <Text style={styles.noDataTitle}>Not enough data for a score</Text>
      <Text style={styles.noDataBody}>
        Wear your watch overnight and sync sleep or heart-rate data. Your readiness score and training recommendation will appear as soon as we have a usable signal.
      </Text>
      <TouchableOpacity style={styles.refreshDataButton} onPress={onRefresh} activeOpacity={0.8}>
        <Text style={styles.refreshDataButtonText}>Check again</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProSummaryCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.proSummaryCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.proSummaryHeader}>
        <View style={styles.proSummaryBadge}><Text style={styles.proSummaryBadgeText}>PRO</Text></View>
        <Text style={styles.proSummaryTitle}>Go beyond the score</Text>
      </View>
      <Text style={styles.proSummaryBody}>
        Unlock deeper recovery, nutrition guidance, weekly trends, the 3-day forecast, coach chat and full activity context in one place.
      </Text>
      <Text style={styles.proSummaryCta}>See what’s included · $9.99/mo →</Text>
    </TouchableOpacity>
  );
}

// Returns a short "Last night · Mon, Mar 9" prefix for overnight metrics.
function lastNightLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `Last night · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

// Build a human-readable detail line for the Recovery card.
function buildRecoveryDetail(h: HealthData | null, baseline: number): string | undefined {
  if (!h) return undefined;
  const parts: string[] = [];
  // Always show HRV slot — dash makes the gap visible on the card itself
  if (h.hrv !== null) {
    const manualTag = h.hrvSource === 'manual' ? ' (manual)' : '';
    parts.push(`HRV ${h.hrv}ms${manualTag}`);
  } else {
    parts.push('HRV —');
  }
  if (h.restingHeartRate !== null) {
    const delta = h.restingHeartRate - baseline;
    const sign  = delta > 0 ? '+' : '';
    parts.push(`RHR ${h.restingHeartRate}bpm (${sign}${delta} vs your ${baseline} avg)`);
  }
  return `${lastNightLabel()} · ${parts.join(' · ')}`;
}

// Build a human-readable detail line for the Stress card.
// Prefers Garmin stress score; falls back to HRV proxy (same as the scoring algorithm).
function buildStressDetail(h: HealthData | null, rhrBaseline: number, hrvBaseline: number): string | undefined {
  if (!h) return undefined;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const prefix = `Today · ${today}`;
  // Tier 1: Garmin stress score
  if (h.stressScore != null) {
    const label = h.stressScore <= 25 ? 'Low'
                : h.stressScore <= 50 ? 'Moderate'
                : h.stressScore <= 75 ? 'High'
                :                       'Very high';
    return `${prefix} · Stress index ${h.stressScore}/100 · ${label}`;
  }
  // Tier 2: HRV overnight proxy
  if (h.hrv != null) {
    const delta = Math.round(h.hrv - hrvBaseline);
    const sign  = delta >= 0 ? '+' : '';
    const trend = delta >= 5  ? 'Low stress'
                : delta >= -5 ? 'Typical'
                :               'Elevated stress';
    return `${prefix} · HRV ${h.hrv}ms (${sign}${delta} vs ${hrvBaseline}ms baseline) · ${trend}`;
  }
  // Tier 3: Daytime HR elevation proxy (works for Garmin users without HRV sync)
  if (h.daytimeAvgHR != null) {
    const elevation = h.daytimeAvgHR - rhrBaseline;
    const sign      = elevation >= 0 ? '+' : '';
    const trend     = elevation <= 3  ? 'Low stress'
                    : elevation <= 10 ? 'Mild elevation'
                    :                   'Elevated';
    return `${prefix} · Daytime HR ${h.daytimeAvgHR}bpm (${sign}${elevation} vs ${rhrBaseline}bpm rest) · ${trend}`;
  }
  return `${prefix} · Sync your device to see stress data`;
}

// Build a human-readable detail line for the Activity card.
// Shows yesterday's completed numbers + today's in-progress totals side by side.
function buildActivityDetail(h: HealthData | null, today: TodayActivity | null): string | undefined {
  if (!h) return undefined;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayLabel = yesterday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Yesterday row
  const yParts: string[] = [];
  if (h.steps != null)           yParts.push(`${h.steps.toLocaleString()} steps`);
  if (h.exerciseMinutes != null) yParts.push(`${h.exerciseMinutes}min`);
  if (h.activeCalories != null)  yParts.push(`${h.activeCalories} kcal`);
  const yLine = yParts.length > 0 ? yParts.join(' · ') : 'no data';

  // Today row — only show fields that have a value
  const tParts: string[] = [];
  if (today?.steps != null)           tParts.push(`${today.steps.toLocaleString()} steps`);
  if (today?.exerciseMinutes != null) tParts.push(`${today.exerciseMinutes}min`);
  if (today?.activeCalories != null)  tParts.push(`${today.activeCalories} kcal`);
  const tLine = tParts.length > 0 ? `Today so far · ${tParts.join(' · ')}` : null;

  return tLine
    ? `${dayLabel} · ${yLine}\n${tLine}`
    : `${dayLabel} · ${yLine}`;
}

// Build a human-readable detail line for the Sleep card.
function buildSleepDetail(h: HealthData | null): string | undefined {
  if (!h?.sleepDuration) return undefined;
  const totalH = Math.floor(h.sleepDuration / 60);
  const totalM = h.sleepDuration % 60;
  const parts = [`${totalH}h ${totalM}m`];
  if (h.deepSleep)      parts.push(`Deep ${Math.floor(h.deepSleep / 60)}h ${h.deepSleep % 60}m`);
  if (h.remSleep)       parts.push(`REM ${h.remSleep}m`);
  if (h.sleepEfficiency) parts.push(`${h.sleepEfficiency}% eff`);
  return `${lastNightLabel()} · ${parts.join(' · ')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { readiness, isLoading, isRefreshing, error, refresh, rhrBaseline, hrvBaseline, setManualHRV } = useHealthData();
  const { isPro, isTrialActive, presentPaywall } = useSubscription();
  const calibration = useCalibrationStatus();

  // Day-7 choreography: the calibration report owns the moment; the rating
  // prompt waits until it has been seen so the two sheets never collide.
  const [reportVisible,  setReportVisible]  = useState(false);
  const [reportResolved, setReportResolved] = useState(false);
  const [ratingArmed,    setRatingArmed]    = useState(false);
  useEffect(() => {
    if (calibration.isLoading || calibration.daysComplete < 7 || reportResolved || reportVisible) return;
    // The report is a day-7 moment, not a "has been here at least a week"
    // moment: the seen-flag is new, so without this window every account
    // that predates it (and every reinstall of an old account) would get a
    // "calibration complete" sheet on first launch.
    const since    = calibration.daysSinceJoined;
    const inWindow = since !== null && since >= 7 && since <= 9;
    let cancelled = false;
    hasSeenCalibrationReport().then(seen => {
      if (cancelled) return;
      if (seen || !inWindow) {
        if (!seen) markCalibrationReportSeen();
        setReportResolved(true);
        setRatingArmed(true);
      } else {
        setReportVisible(true);
      }
    });
    return () => { cancelled = true; };
  }, [calibration.isLoading, calibration.daysComplete, calibration.daysSinceJoined, reportResolved, reportVisible]);
  // The rating sheet only arms on the dismiss path. Someone who just tapped
  // "Keep Pro" is on their way to the paywall, and iOS's review dialog
  // sliding over it is the last thing that screen needs.
  const closeReport = (armRating: boolean) => {
    markCalibrationReportSeen();
    setReportVisible(false);
    setReportResolved(true);
    if (armRating) setRatingArmed(true);
  };
  useRatingPrompt(ratingArmed ? calibration.daysComplete : 0);
  const {
    checkAndAlertScore,
    rescheduleDigestWithScore,
    checkAndAlertHRV,
    checkAndAlertRHR,
    checkAndAlertTrend,
  } = useNotifications();

  // Strava — fetch 28 days to power both the last-workout card and the 4-week trend card
  const { isConnected: stravaConnected, activities: stravaActivities, isLoading: stravaLoading } =
    useStravaActivities(28);

  // Workout load from Apple Health — used by WorkoutContextBanner and coach context
  const { loadSummary: workoutLoad, isLoading: workoutsLoading } = useRecentWorkouts(
    readiness?.healthData?.hrv ?? null,
    hrvBaseline,
  );

  const cycle = useCycleTracking();
  const overtraining = useOvertrainingWarning(stravaActivities);

  const [selectedCard,    setSelectedCard]    = useState<'recovery' | 'sleep' | 'stress' | 'activity' | null>(null);
  const [userName,        setUserName]        = useState<string>('');
  const [profileSex,      setProfileSex]      = useState<string | null>(null);
  const [briefingVisible, setBriefingVisible] = useState(false);
  const [isSharing,       setIsSharing]       = useState(false);
  const [todayActivity,   setTodayActivity]   = useState<TodayActivity | null>(null);
  const [lifeEvents,      setLifeEvents]      = useState<LifeEvent[]>([]);
  const [forecast,        setForecast]        = useState<ReadinessForecast | null>(null);
  const [yesterdayScore,  setYesterdayScore]  = useState<number | null>(null);
  const shareCardRef = useRef<View>(null);

  // ── Manual HRV handlers ────────────────────────────────────────────────────
  const handleEnterManualHRV = useCallback(() => {
    const currentHrv = readiness?.healthData?.hrv;
    const isManual   = readiness?.healthData?.hrvSource === 'manual';
    Alert.prompt(
      isManual ? 'Update HRV' : 'Enter HRV',
      'Enter your overnight HRV in milliseconds (ms). You can find this in your wearable\'s app (Polar, Garmin, Whoop, etc.) or from an HRV measurement app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const num = parseFloat(value ?? '');
            if (!value || isNaN(num) || num < 10 || num > 250) {
              Alert.alert('Invalid value', 'Please enter a number between 10 and 250 ms.');
              return;
            }
            await setManualHRV(Math.round(num));
          },
        },
      ],
      'plain-text',
      currentHrv !== null && currentHrv !== undefined ? String(currentHrv) : '',
      'numeric',
    );
  }, [setManualHRV, readiness?.healthData]);

  const handleClearManualHRV = useCallback(() => {
    Alert.alert(
      'Clear Manual HRV',
      'Remove today\'s manually entered HRV? Your Recovery score will revert to RHR-only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setManualHRV(null),
        },
      ],
    );
  }, [setManualHRV]);

  // ── Share card handler ────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!readiness || isSharing) return;
    const currentScore = Math.round(readiness.score ?? 0);
    if (currentScore <= 0) return;
    setIsSharing(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const uri = await captureRef(shareCardRef, {
        format:  'png',
        quality: 1,
        result:  'tmpfile',
      });
      await Share.share({
        url:     uri,
        message: `My readiness score today: ${currentScore}/100 — ${getScoreLabel(currentScore)} 💪`,
      });
    } catch (err) {
      // User cancelled the share sheet — not an error worth alerting on
      console.log('[Share] dismissed or failed:', err);
    } finally {
      setIsSharing(false);
    }
  }, [readiness, isSharing]);

  // Load stored name + sex once on mount
  useEffect(() => {
    AsyncStorage.getItem(NAME_KEY)
      .then(v => { if (v) setUserName(v.trim().split(' ')[0]); })
      .catch(() => {});
    AsyncStorage.getItem(PROFILE_SEX_KEY)
      .then(v => setProfileSex(v))
      .catch(() => {});
  }, []);

  // Fetch today's in-progress activity for the Activity card comparison row.
  // Re-runs whenever the main data refreshes so a pull-to-refresh updates both rows.
  useEffect(() => {
    if (isLoading) return; // wait until HealthKit is initialised
    fetchTodayActivity()
      .then(setTodayActivity)
      .catch(() => {}); // non-fatal — card degrades gracefully to yesterday-only
  }, [isLoading, isRefreshing]);

  // Load life events + compute 3-day forecast once data is ready.
  // If today's HealthKit score hasn't synced yet (score=0), we fall back to the
  // most recent historical score from Supabase so the forecast still renders.
  useEffect(() => {
    if (isLoading) return;

    async function loadContextualData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Life events + workload can run in parallel
        const [events, workload] = await Promise.all([
          fetchRecentEvents(7),
          analyzeWorkload(),
        ]);
        setLifeEvents(events);

        const patterns = await analyzePatterns(user.id);

        // Fetch yesterday's score for the delta display (non-blocking via parallel)
        const yesterdayStr = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return localDateStr(d);
        })();
        const { data: yesterdayRow } = await supabase
          .from('readiness_scores')
          .select('score')
          .eq('user_id', user.id)
          .eq('date', yesterdayStr)
          .single();
        setYesterdayScore((yesterdayRow?.score as number) ?? null);

        // Use today's live score when available; fall back to the most recent
        // DB score so the forecast renders even before HealthKit syncs today.
        let scoreForForecast = readiness?.score ?? 0;
        if (scoreForForecast <= 0) {
          const { data: latestRow } = await supabase
            .from('readiness_scores')
            .select('score')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();
          scoreForForecast = (latestRow?.score as number) ?? 0;
        }
        if (scoreForForecast <= 0) return; // brand-new user — nothing to forecast from yet

        if (readiness?.dataQuality?.isInsufficient) {
          setForecast(null);
          return;
        }

        setForecast(computeForecast(scoreForForecast, patterns, workload));
      } catch (e) {
        console.warn('[HomeScreen] contextual data load error:', e);
      }
    }

    loadContextualData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isRefreshing, readiness?.score]);

  const score         = readiness?.score ?? 0;
  const hasInsufficientData = readiness?.dataQuality?.isInsufficient ?? false;
  const hasUsableScore = score > 0 && !hasInsufficientData;
  const displayScore   = hasInsufficientData ? 0 : score;
  const scoreColor    = hasUsableScore ? getScoreColor(score) : colors.text.tertiary;
  const scoreLabel    = !hasUsableScore ? 'Not enough data' : getScoreLabel(score);
  const activityScore = computeActivityScore(readiness?.healthData ?? null);

  // Fire all notification checks once data is settled.
  // Each guard inside the hook handles Expo Go / missing permissions / toggle off
  // so these are always safe to call unconditionally.
  useEffect(() => {
    if (isLoading || isRefreshing || !hasUsableScore) return;

    const hrv = readiness?.healthData?.hrv              ?? null;
    const rhr = readiness?.healthData?.restingHeartRate ?? null;

    // Standard alerts
    checkAndAlertScore(score);
    rescheduleDigestWithScore(score);

    // Smart alerts (Pro) — each function is a no-op if the pref is off
    checkAndAlertTrend(score);
    if (hrv != null && hrvBaseline > 0) checkAndAlertHRV(hrv, hrvBaseline);
    if (rhr != null && rhrBaseline > 0) checkAndAlertRHR(rhr, rhrBaseline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isRefreshing]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.amber[400]}      // iOS spinner colour
            colors={[colors.amber[400]]}       // Android spinner colour
            progressBackgroundColor={colors.bg.elevated}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()}{userName ? `, ${userName}` : ''} 👋
            </Text>
            <Text style={styles.dateText}>{formatDisplayDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            {hasUsableScore && (
              <TouchableOpacity
                style={[styles.shareBtn, isSharing && { opacity: 0.4 }]}
                onPress={handleShare}
                disabled={isSharing}
                activeOpacity={0.7}
              >
                <Text style={styles.shareBtnIcon}>⬆</Text>
              </TouchableOpacity>
            )}
            {!isPro && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Score ring — tappable for the daily briefing. Pro gets it daily;
            free users keep one per week after the trial, because a briefing
            written from their own numbers is the best ad for the daily one. */}
        <TouchableOpacity
          style={styles.ringContainer}
          activeOpacity={hasUsableScore ? 0.7 : 1}
          onPress={async () => {
            if (!hasUsableScore) return;
            if (!isPro) {
              if (await canUseFreeBriefing()) {
                await markFreeBriefingUsed();
                setBriefingVisible(true);
              } else {
                presentPaywall();
              }
              return;
            }
            setBriefingVisible(true);
          }}
        >
          <ScoreRing score={displayScore} color={scoreColor} size={240} strokeWidth={14} />

          {/* Score number overlaid in the ring center */}
          <View style={styles.scoreOverlay} pointerEvents="none">
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {hasUsableScore ? Math.round(score) : '—'}
            </Text>
            <Text style={styles.scoreLabel}>{scoreLabel}</Text>
            {/* Delta vs yesterday */}
            {hasUsableScore && yesterdayScore !== null && (() => {
              const delta = score - yesterdayScore;
              if (Math.abs(delta) < 2) return null;
              const up = delta >= 0;
              const col = up ? '#4ADE80' : '#F87171';
              return (
                <Text style={[styles.scoreDelta, { color: col }]}>
                  {up ? '▲' : '▼'} {Math.abs(delta)} vs yesterday
                </Text>
              );
            })()}
            {hasUsableScore && (
              <Text style={styles.tapHint}>
                {isPro
                  ? (yesterdayScore !== null && score - yesterdayScore < -7
                      ? 'Tap to understand today\'s drop'
                      : 'Tap for briefing')
                  : 'Tap for briefing'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Today's recommendation — the answer to "what do I do today?", so it
            sits directly under the score and is free: users act on the score
            before deciding whether they need the deeper Pro analysis. */}
        {hasUsableScore && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>TODAY'S RECOMMENDATION</Text>
            <TrainingLoadCard
              score={score}
              components={readiness?.components ?? { recovery: 50, sleep: 50, stress: 50 }}
            />
          </View>
        )}

        {/* Streak banner */}
        {hasUsableScore && <StreakBanner score={score} />}

        {/* Yesterday's workout context — shows load tier + HRV suppression note */}
        <WorkoutContextBanner loadSummary={workoutLoad} isLoading={workoutsLoading} />

        {/* Last Strava workout — only shown when Strava is connected */}
        <StravaLastWorkoutSection
          isConnected={stravaConnected}
          activities={stravaActivities}
          isLoading={stravaLoading}
        />

        {/* Strava 4-week training load trend — Pro feature */}
        <StravaTrainingLoadSection
          isConnected={stravaConnected}
          activities={stravaActivities}
          isLoading={stravaLoading}
          isPro={isPro}
        />

        {/* Cycle phase card — shown for female users with tracking enabled */}
        <CyclePhaseSection
          sex={profileSex}
          enabled={cycle.settings.enabled}
          cycleState={cycle.cycleState}
          hasEntries={cycle.entries.length > 0}
          onLogToday={cycle.logToday}
        />

        {/* Overtraining early warning — shown when pattern analysis detects fatigue risk */}
        <OvertrainingWarningCard warning={overtraining} />

        {/* Data confidence banner — shown when wearable data is missing or partial.
            Tappable when HRV is what's missing, since that's the one gap the user
            can close by hand: Garmin, Whoop, Polar and Oura don't write HRV to
            Apple Health, so manual entry is their only route. */}
        {hasUsableScore && readiness?.dataQuality?.confidence !== 'high' &&
          readiness?.dataQuality?.warningMessage && (
          <TouchableOpacity
            style={styles.confidenceBanner}
            onPress={handleEnterManualHRV}
            disabled={readiness.dataQuality.hasHRV}
            activeOpacity={readiness.dataQuality.hasHRV ? 1 : 0.7}
            accessibilityRole={readiness.dataQuality.hasHRV ? undefined : 'button'}
            accessibilityLabel={
              readiness.dataQuality.hasHRV ? undefined : 'Enter your HRV manually'
            }
          >
            <Text style={styles.confidenceIcon}>⌚</Text>
            <Text style={styles.confidenceText}>{readiness.dataQuality.warningMessage}</Text>
            {!readiness.dataQuality.hasHRV && (
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.text.tertiary}
                style={styles.confidenceChevron}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Honest empty state — never show a fabricated numeric score. */}
        {!isLoading && !error && (hasInsufficientData || score === 0) && (
          <InsufficientDataCard onRefresh={refresh} />
        )}

        {/* Calibration week banner — shown for first 7 days after onboarding */}
        <CalibrationBanner status={calibration} />

        {/* Breakdown */}
        {hasUsableScore && (
          <View style={styles.breakdown}>
            <Text style={styles.sectionTitle}>BREAKDOWN</Text>

            <Animated.View entering={FadeInDown.delay(0).duration(400).springify()}>
              <ScoreBreakdownCard
                label="Recovery"
                score={readiness?.components.recovery ?? 0}
                weight="45%"
                icon="💓"
                detail={buildRecoveryDetail(readiness?.healthData ?? null, rhrBaseline)}
                isLocked={!isPro}
                onPress={() => isPro ? setSelectedCard('recovery') : router.push('/paywall')}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
              <ScoreBreakdownCard
                label="Sleep"
                score={readiness?.components.sleep ?? 0}
                weight="40%"
                icon="🌙"
                detail={buildSleepDetail(readiness?.healthData ?? null)}
                isLocked={!isPro}
                onPress={() => isPro ? setSelectedCard('sleep') : router.push('/paywall')}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160).duration(400).springify()}>
              <ScoreBreakdownCard
                label="Stress"
                score={readiness?.components.stress ?? 0}
                weight="15%"
                icon="🧠"
                detail={buildStressDetail(readiness?.healthData ?? null, rhrBaseline, hrvBaseline)}
                isLocked={!isPro}
                onPress={() => isPro ? setSelectedCard('stress') : router.push('/paywall')}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(400).springify()}>
              <ScoreBreakdownCard
                label="Activity"
                score={activityScore}
                weight="Context"
                icon="🏃"
                detail={buildActivityDetail(readiness?.healthData ?? null, todayActivity)}
                isLocked={!isPro}
                onPress={() => isPro ? setSelectedCard('activity') : presentPaywall()}
              />
            </Animated.View>
          </View>
        )}

        {/* One consolidated upgrade message replaces separate feature gates. */}
        {!isPro && hasUsableScore && <ProSummaryCard onPress={presentPaywall} />}

        {/* Nutrition — Pro feature */}
        {isPro && hasUsableScore && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>NUTRITION TODAY</Text>
            <NutritionCard
              score={score}
              components={readiness?.components ?? { recovery: 50, sleep: 50, stress: 50 }}
              healthData={readiness?.healthData ?? null}
              hrvBaseline={hrvBaseline}
            />
          </View>
        )}

        {/* Recovery Trend — Pro feature */}
        {isPro && hasUsableScore && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>WEEKLY TREND</Text>
            <TrendInsightCard />
          </View>
        )}

        {/* 3-Day Readiness Forecast — Pro feature, covered by the single
            upgrade card above rather than its own gate */}
        {isPro && forecast && hasUsableScore && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>3-DAY FORECAST</Text>
            <ForecastStrip forecast={forecast} />
          </View>
        )}

        {/* Life Event Tagger */}
        {hasUsableScore && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>WHAT'S AFFECTING YOU</Text>
            <LifeEventTagger events={lifeEvents} onTagged={setLifeEvents} />
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Breakdown detail modal (Pro only) ── */}
      <BreakdownModal
        visible={selectedCard !== null}
        component={selectedCard}
        onClose={() => setSelectedCard(null)}
        score={
          selectedCard === 'activity'
            ? activityScore
            : selectedCard
            ? (readiness?.components[selectedCard] ?? 0)
            : 0
        }
        healthData={readiness?.healthData ?? null}
        rhrBaseline={rhrBaseline}
        hrvBaseline={hrvBaseline}
        isPro={isPro}
        onEnterManualHRV={handleEnterManualHRV}
        onClearManualHRV={
          readiness?.healthData?.hrvSource === 'manual' ? handleClearManualHRV : undefined
        }
        onUpgrade={presentPaywall}
      />

      {/* ── Daily briefing modal (Pro only) ── */}
      <CalibrationReportModal
        visible={reportVisible}
        onClose={() => closeReport(true)}
        hrvBaseline={hrvBaseline}
        rhrBaseline={rhrBaseline}
        isPro={isPro}
        isTrialActive={isTrialActive}
        onKeepPro={() => { closeReport(false); presentPaywall(); }}
      />

      <DailyBriefingModal
        visible={briefingVisible}
        onClose={() => setBriefingVisible(false)}
        readiness={readiness}
        healthData={readiness?.healthData ?? null}
        rhrBaseline={rhrBaseline}
        hrvBaseline={hrvBaseline}
      />

      {/* ── Off-screen share card — rendered but not visible ─────────────────
           Must be mounted in the native view hierarchy so captureRef can
           read it. Positioned far off-screen to avoid any visual flicker. */}
      {readiness && (
        <View style={styles.offScreen} pointerEvents="none">
          <ShareCard ref={shareCardRef} readiness={readiness} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
  },
  headerLeft: {
    flex: 1,
    gap: spacing[0.5],
  },
  greeting: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  dateText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  shareBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.default,
    alignItems:      'center',
    justifyContent:  'center',
  },
  shareBtnIcon: {
    fontSize: 14,
    color:    colors.text.secondary,
  },
  freeBadge: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  freeBadgeText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  offScreen: {
    position:  'absolute',
    top:       -9999,
    left:      -9999,
    opacity:   0,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  scoreOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 64,
  },
  scoreLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
    marginTop: spacing[1],
  },
  tapHint: {
    fontSize:    fontSize.xs,
    color:       colors.text.tertiary,
    marginTop:   spacing[1],
    letterSpacing: 0.3,
  },
  scoreDelta: {
    fontSize:    10,
    fontWeight:  fontWeight.semiBold,
    marginTop:   spacing[0.5],
    letterSpacing: 0.2,
  },
  // Subtle amber strip shown when Apple Watch data quality is medium or low
  // Neutral, not amber: missing wearable data is a setup step, not a fault.
  // Alarm styling here made a normal first run look like an error state.
  confidenceBanner: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            spacing[2],
    backgroundColor: colors.bg.secondary,
    borderRadius:   radius.md,
    borderWidth:    1,
    borderColor:    colors.border.subtle,
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[2],
    marginBottom:   spacing[4],
  },
  confidenceIcon: {
    fontSize:   13,
    lineHeight: 18,
  },
  confidenceText: {
    flex:       1,
    fontSize:   fontSize.xs,
    color:      colors.text.secondary,
    lineHeight: 16,
  },
  confidenceChevron: {
    marginTop: 1,
  },
  errorBanner: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  noDataCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  noDataTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  noDataBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  insufficientCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  insufficientEyebrow: {
    color: colors.amber[400],
    fontSize: 10,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  refreshDataButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
  },
  refreshDataButtonText: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  proSummaryCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[5],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  proSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  proSummaryBadge: {
    backgroundColor: colors.amber[400],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  proSummaryBadgeText: {
    color: colors.bg.primary,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  proSummaryTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  proSummaryBody: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  proSummaryCta: {
    color: colors.amber[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  breakdown: {
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  trainingSection: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 2,
    marginBottom: spacing[1],
  },
  bottomPad: {
    height: spacing[8],
  },
});
