import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Share } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScoreRing from '@components/score/ScoreRing';
import ScoreBreakdownCard from '@components/score/ScoreBreakdownCard';
import TrainingLoadCard from '@components/score/TrainingLoadCard';
import TrendInsightCard from '@components/score/TrendInsightCard';
import ForecastStrip from '@components/score/ForecastStrip';
import LifeEventTagger from '@components/score/LifeEventTagger';
import BreakdownModal from '@components/score/BreakdownModal';
import DailyBriefingModal from '@components/score/DailyBriefingModal';
import ShareCard from '@components/score/ShareCard';
import { ProGate } from '@components/common/ProGate';
import { colors, fontSize, fontWeight, spacing, radius, getScoreColor, getScoreLabel } from '@constants/theme';
import { useHealthData } from '@hooks/useHealthData';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useNotifications } from '@hooks/useNotifications';
import { formatDisplayDate } from '@utils/index';
import { computeActivityScore } from '@utils/breakdown';
import { fetchTodayActivity, type TodayActivity } from '@services/healthkit';
import { analyzePatterns } from '@services/patternAnalysis';
import { analyzeWorkload } from '@services/workloadAnalysis';
import { computeForecast, type ReadinessForecast } from '@services/readinessForecast';
import { fetchRecentEvents, type LifeEvent } from '@services/lifeEvents';
import { supabase } from '@services/supabase';
import type { HealthData } from '@types/index';
import { NAME_KEY } from '../onboarding';

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  const { readiness, isLoading, isRefreshing, error, refresh, rhrBaseline, hrvBaseline, setManualHRV } = useHealthData();
  const { isPro, presentPaywall } = useSubscription();
  const { checkAndAlertScore, rescheduleDigestWithScore } = useNotifications();

  const [selectedCard,    setSelectedCard]    = useState<'recovery' | 'sleep' | 'stress' | 'activity' | null>(null);
  const [userName,        setUserName]        = useState<string>('');
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

  // Load stored name once on mount
  useEffect(() => {
    AsyncStorage.getItem(NAME_KEY)
      .then(v => { if (v) setUserName(v.trim().split(' ')[0]); })
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
          return d.toISOString().split('T')[0];
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

        setForecast(computeForecast(scoreForForecast, patterns, workload));
      } catch (e) {
        console.warn('[HomeScreen] contextual data load error:', e);
      }
    }

    loadContextualData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isRefreshing, readiness?.score]);

  const score         = readiness?.score ?? 0;
  const scoreColor    = getScoreColor(score);
  const scoreLabel    = getScoreLabel(score);
  const activityScore = computeActivityScore(readiness?.healthData ?? null);

  // Fire threshold alert + update digest notification once data is settled.
  // Both hooks guard against unnecessary work (Expo Go, missing permissions,
  // digest disabled) so these are always safe to call.
  useEffect(() => {
    if (!isLoading && !isRefreshing && score > 0) {
      checkAndAlertScore(score);
      rescheduleDigestWithScore(score);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isRefreshing]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.amber[400]} size="large" />
        <Text style={styles.loadingText}>Reading your data…</Text>
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
            {score > 0 && (
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

        {/* Score ring — tappable for Pro daily briefing */}
        <TouchableOpacity
          style={styles.ringContainer}
          activeOpacity={isPro && score > 0 ? 0.7 : 1}
          onPress={() => {
            if (!isPro)     { presentPaywall(); return; }
            if (score <= 0) return;
            setBriefingVisible(true);
          }}
        >
          <ScoreRing score={score} color={scoreColor} size={240} strokeWidth={14} />

          {/* Score number overlaid in the ring center */}
          <View style={styles.scoreOverlay} pointerEvents="none">
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {score > 0 ? Math.round(score) : '—'}
            </Text>
            <Text style={styles.scoreLabel}>{scoreLabel}</Text>
            {/* Delta vs yesterday */}
            {score > 0 && yesterdayScore !== null && (() => {
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
            {score > 0 && (
              <Text style={styles.tapHint}>
                {isPro
                  ? (yesterdayScore !== null && score - yesterdayScore < -7
                      ? 'Tap to understand today\'s drop'
                      : 'Tap for briefing')
                  : '🔒 Pro'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Data confidence banner — shown when Apple Watch data is missing or partial */}
        {score > 0 && readiness?.dataQuality?.confidence !== 'high' &&
          readiness?.dataQuality?.warningMessage && (
          <View style={styles.confidenceBanner}>
            <Text style={styles.confidenceIcon}>⚠</Text>
            <Text style={styles.confidenceText}>{readiness.dataQuality.warningMessage}</Text>
          </View>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* No data state */}
        {!isLoading && score === 0 && !error && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataTitle}>No health data yet</Text>
            <Text style={styles.noDataBody}>
              Make sure your Apple Watch or Garmin is synced to Apple Health, then pull down to refresh.
            </Text>
          </View>
        )}

        {/* Breakdown */}
        {score > 0 && (
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
                onPress={isPro ? () => setSelectedCard('recovery') : undefined}
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
                onPress={isPro ? () => setSelectedCard('sleep') : undefined}
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
                onPress={isPro ? () => setSelectedCard('stress') : undefined}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(400).springify()}>
              <ProGate
                feature="Activity Context"
                description="See how yesterday's movement and exercise compare to targets, and what it means for today's recovery."
              >
                <ScoreBreakdownCard
                  label="Activity"
                  score={activityScore}
                  weight="Context"
                  icon="🏃"
                  detail={buildActivityDetail(readiness?.healthData ?? null, todayActivity)}
                  isLocked={false}
                  onPress={() => setSelectedCard('activity')}
                />
              </ProGate>
            </Animated.View>
          </View>
        )}

        {/* Training Load — Pro feature */}
        {score > 0 && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>TODAY'S TRAINING</Text>
            <ProGate
              feature="Training Load Recommendations"
              description="Get a daily training prescription — zone, duration, and RPE — tailored to how recovered you actually are."
            >
              <TrainingLoadCard
                score={score}
                components={readiness?.components ?? { recovery: 50, sleep: 50, stress: 50 }}
              />
            </ProGate>
          </View>
        )}

        {/* Recovery Trend — Pro feature */}
        {score > 0 && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>WEEKLY TREND</Text>
            <ProGate
              feature="Weekly Recovery Trend"
              description="See your 7-day recovery trajectory and get a daily insight on whether your body is adapting or accumulating fatigue."
            >
              <TrendInsightCard />
            </ProGate>
          </View>
        )}

        {/* 3-Day Readiness Forecast */}
        {forecast && (
          <View style={styles.trainingSection}>
            <Text style={styles.sectionTitle}>3-DAY FORECAST</Text>
            <ForecastStrip forecast={forecast} />
          </View>
        )}

        {/* Life Event Tagger */}
        {score > 0 && (
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
  confidenceBanner: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            spacing[2],
    backgroundColor: 'rgba(251, 191, 36, 0.10)',
    borderRadius:   radius.md,
    borderWidth:    1,
    borderColor:    'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[2],
    marginBottom:   spacing[4],
  },
  confidenceIcon: {
    fontSize:   13,
    color:      colors.amber[400],
    lineHeight: 18,
  },
  confidenceText: {
    flex:       1,
    fontSize:   fontSize.xs,
    color:      colors.text.secondary,
    lineHeight: 16,
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
