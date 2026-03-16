/**
 * StravaTrainingLoadCard
 *
 * Shows the 4-week training load trend from Strava activities.
 *
 * ── What it shows ─────────────────────────────────────────────────────────────
 *  • 4-week mini bar chart (oldest → this week)
 *  • Trend badge: Building / Maintaining / Easy week / Deloading / Overreaching
 *  • Acute:Chronic (ATL/CTL) ratio + range indicator
 *  • One-line coaching insight
 *  • Sport breakdown (top 3 sport types, % of sessions)
 *  • This week vs 4-week average stats
 *
 * ── Pro gate ─────────────────────────────────────────────────────────────────
 * The full detail (A:C ratio, insight, sport breakdown) is Pro-only.
 * The bar chart and trend badge are always shown when Strava is connected.
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import { computeTrainingTrend, type TrainingTrend, type WeeklyLoad } from '@utils/stravaLoad';
import type { StravaActivity } from '@services/strava';

// ─── Brand constant ───────────────────────────────────────────────────────────

const STRAVA_ORANGE = '#FC4C02';

// Historical bars always render in amber so they're visible regardless of
// whatever the current week's trend color happens to be.
const HISTORICAL_BAR_COLOR = '#F5A623'; // colors.amber[400]

// ─── Bar chart ────────────────────────────────────────────────────────────────

const BAR_MAX_HEIGHT = 60;
const BAR_WIDTH      = 32;

interface BarProps {
  week:        WeeklyLoad;
  maxLoad:     number;
  isThisWeek:  boolean;
  trendColor:  string;
}

function LoadBar({ week, maxLoad, isThisWeek, trendColor }: BarProps) {
  const hasLoad  = week.load > 0;
  const fillFrac = maxLoad > 0 && hasLoad
    ? Math.max(week.load / maxLoad, 0.05)   // min 5% so short bars stay visible
    : 0;
  const barH = Math.round(fillFrac * BAR_MAX_HEIGHT);

  // Current week → trend color; historical → always amber
  const fillColor = isThisWeek ? trendColor : HISTORICAL_BAR_COLOR;

  return (
    <View style={barStyles.col}>
      {/* Value label — amber for history, trend color for this week */}
      <Text style={[
        barStyles.valLabel,
        { color: hasLoad ? fillColor : colors.text.tertiary },
      ]}>
        {hasLoad ? week.load : isThisWeek ? '—' : ''}
      </Text>

      {/* Bar track */}
      <View style={[
        barStyles.track,
        isThisWeek && !hasLoad && barStyles.trackEmpty,
      ]}>
        {barH > 0 && (
          <View
            style={[
              barStyles.fill,
              {
                height:          barH,
                // History bars at 75% opacity so the current week pops at 100%
                backgroundColor: isThisWeek ? fillColor : fillColor + 'BF',
              },
            ]}
          />
        )}
        {/* "Now" with zero activity — show a subtle dashed-style inner border */}
        {isThisWeek && !hasLoad && (
          <View style={barStyles.emptyNow} />
        )}
      </View>

      {/* Week label */}
      <Text style={[
        barStyles.weekLabel,
        isThisWeek && { color: colors.text.secondary, fontWeight: fontWeight.semiBold },
      ]}>
        {isThisWeek ? 'Now' : week.label.replace(' week', '').replace(' ago', '')}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  col: {
    alignItems: 'center',
    gap:        4,
    flex:       1,            // equal column widths
  },
  valLabel: {
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
    height:     14,           // reserve space even when empty
    textAlign:  'center',
  },
  track: {
    width:           BAR_WIDTH,
    height:          BAR_MAX_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius:    4,
    justifyContent:  'flex-end',
    overflow:        'hidden',
  },
  trackEmpty: {
    // Slightly dimmer for the in-progress empty column
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
  },
  fill: {
    width:        BAR_WIDTH,
    borderRadius: 4,
  },
  emptyNow: {
    position:        'absolute',
    bottom:          8,
    left:            8,
    right:           8,
    height:          2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius:    1,
  },
  weekLabel: {
    color:    colors.text.tertiary,
    fontSize: 9,
  },
});

// ─── A:C ratio indicator ──────────────────────────────────────────────────────

interface RatioProps {
  ratio:      number;
  trendColor: string;
}

function AcRatioBar({ ratio, trendColor }: RatioProps) {
  // Map ratio 0.5–1.5 → 0–100% for the indicator
  const MIN = 0.5, MAX = 1.5;
  const pct = Math.min(Math.max((ratio - MIN) / (MAX - MIN), 0), 1);

  return (
    <View style={ratioStyles.wrap}>
      <View style={ratioStyles.track}>
        {/* Coloured zones */}
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#9BA3B8' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#60A5FA' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#22C55E' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#F59E0B' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#EF4444' + '40' }]} />
        {/* Pointer */}
        <View style={[ratioStyles.pointer, { left: `${Math.round(pct * 100)}%`, backgroundColor: trendColor }]} />
      </View>
      <View style={ratioStyles.labels}>
        <Text style={ratioStyles.labelText}>Deload</Text>
        <Text style={ratioStyles.labelText}>Easy</Text>
        <Text style={ratioStyles.labelText}>Steady</Text>
        <Text style={ratioStyles.labelText}>Build</Text>
        <Text style={ratioStyles.labelText}>⚠</Text>
      </View>
    </View>
  );
}

const ratioStyles = StyleSheet.create({
  wrap: {
    gap: 4,
    marginTop: spacing[1],
  },
  track: {
    height:         8,
    flexDirection:  'row',
    borderRadius:   4,
    overflow:       'visible',
    position:       'relative',
  },
  zone: {
    height: 8,
  },
  pointer: {
    position:     'absolute',
    top:          -3,
    width:        14,
    height:       14,
    borderRadius: 7,
    marginLeft:   -7,
    borderWidth:  2,
    borderColor:  colors.bg.elevated,
  },
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  labelText: {
    color:    colors.text.tertiary,
    fontSize: 8,
    width:    '20%',
    textAlign: 'center',
  },
});

// ─── Sport dots ───────────────────────────────────────────────────────────────

const SPORT_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

function SportBreakdown({ topSports }: { topSports: TrainingTrend['topSports'] }) {
  if (topSports.length === 0) return null;
  return (
    <View style={sportStyles.row}>
      {topSports.map((s, i) => (
        <View key={s.sport} style={sportStyles.pill}>
          <View style={[sportStyles.dot, { backgroundColor: SPORT_COLORS[i] ?? SPORT_COLORS[0] }]} />
          <Text style={sportStyles.text}>{s.sport}</Text>
          <Text style={[sportStyles.pct, { color: SPORT_COLORS[i] ?? SPORT_COLORS[0] }]}>{s.pct}%</Text>
        </View>
      ))}
    </View>
  );
}

const sportStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[2],
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.06)',
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
    gap:               4,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  text: {
    color:    colors.text.secondary,
    fontSize: fontSize.xs,
  },
  pct: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap:        2,
    flex:       1,
  },
  value: {
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  label: {
    color:    colors.text.tertiary,
    fontSize: fontSize.xs,
  },
});

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0)  return `${m}m`;
  if (m === 0)  return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: spacing[3] }} />;
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  activities: StravaActivity[];
  isPro:      boolean;
}

export default function StravaTrainingLoadCard({ activities, isPro }: Props) {
  if (activities.length === 0) return null;

  const trend   = computeTrainingTrend(activities);
  const maxLoad = Math.max(...trend.weeks.map(w => w.load), 1);
  const thisWeek = trend.weeks[trend.weeks.length - 1];
  const avgSessions = Math.round(trend.totalSessions / 4 * 10) / 10;
  const avgMins     = Math.round(trend.totalMinutes / 4);

  const loadUnit = trend.hasSufferScore ? 'pts' : 'eff.min';

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>TRAINING LOAD TREND</Text>
        <View style={styles.headerRight}>
          <View style={[styles.trendBadge, { backgroundColor: trend.trendColor + '20' }]}>
            <Text style={styles.trendEmoji}>{trend.trendEmoji}</Text>
            <Text style={[styles.trendLabel, { color: trend.trendColor }]}>{trend.trendDisplay}</Text>
          </View>
          <View style={styles.stravaBadge}>
            <Text style={styles.stravaBadgeText}>via Strava</Text>
          </View>
        </View>
      </View>

      {/* ── 4-week bar chart ── */}
      <View style={styles.chart}>
        {trend.weeks.map((week, i) => (
          <LoadBar
            key={week.weekKey}
            week={week}
            maxLoad={maxLoad}
            isThisWeek={i === trend.weeks.length - 1}
            trendColor={trend.trendColor}
          />
        ))}
      </View>
      <Text style={styles.loadUnit}>Load in {loadUnit}</Text>

      {isPro ? (
        <>
          <Divider />

          {/* ── A:C ratio ── */}
          {trend.acRatio !== null && (
            <View style={styles.ratioSection}>
              <View style={styles.ratioHeader}>
                <Text style={styles.sectionLabel}>ACUTE : CHRONIC RATIO</Text>
                <Text style={[styles.ratioValue, { color: trend.trendColor }]}>
                  {trend.acRatio.toFixed(2)}
                </Text>
              </View>
              <AcRatioBar ratio={trend.acRatio} trendColor={trend.trendColor} />
            </View>
          )}

          {/* ── Coaching insight ── */}
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>{trend.insight}</Text>
          </View>

          <Divider />

          {/* ── This week vs average stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <Text style={styles.statsColLabel}>This week</Text>
              <View style={styles.statsItems}>
                <StatItem label="Sessions" value={String(thisWeek.sessionCount)} />
                <StatItem label="Time"     value={formatMins(thisWeek.movingMinutes)} />
                <StatItem label={loadUnit} value={String(thisWeek.load)} />
              </View>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsCol}>
              <Text style={styles.statsColLabel}>4-week avg / week</Text>
              <View style={styles.statsItems}>
                <StatItem label="Sessions" value={`${avgSessions}`} />
                <StatItem label="Time"     value={formatMins(avgMins)} />
                <StatItem label={loadUnit} value={String(trend.ctl)} />
              </View>
            </View>
          </View>

          {/* ── Sport breakdown ── */}
          {trend.topSports.length > 0 && (
            <>
              <Divider />
              <Text style={styles.sectionLabel}>SPORT MIX  ·  4 weeks</Text>
              <View style={{ marginTop: spacing[2] }}>
                <SportBreakdown topSports={trend.topSports} />
              </View>
            </>
          )}
        </>
      ) : (
        /* Free tier — teaser */
        <View style={styles.proTeaser}>
          <Text style={styles.proTeaserText}>
            🔒  A:C ratio, coaching insights & sport breakdown — Pro
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Wrapper (handles connected / loading / empty guard) ─────────────────────

interface WrapperProps {
  isConnected: boolean;
  activities:  StravaActivity[];
  isLoading?:  boolean;
  isPro:       boolean;
}

export function StravaTrainingLoadSection({ isConnected, activities, isLoading, isPro }: WrapperProps) {
  if (!isConnected || isLoading || activities.length === 0) return null;

  return (
    <View style={styles.section}>
      <StravaTrainingLoadCard activities={activities} isPro={isPro} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[5],
  },

  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     'rgba(252,76,2,0.2)',
    padding:         spacing[4],
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[3],
  },
  title: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  trendBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
  },
  trendEmoji: {
    fontSize: 11,
  },
  trendLabel: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  stravaBadge: {
    backgroundColor:   STRAVA_ORANGE + '18',
    borderRadius:      radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
  },
  stravaBadgeText: {
    color:      STRAVA_ORANGE,
    fontSize:   10,
    fontWeight: fontWeight.semiBold,
  },

  // ── Chart ─────────────────────────────────────────────────────────────────
  chart: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    gap:            spacing[3],
  },
  loadUnit: {
    color:     colors.text.tertiary,
    fontSize:  9,
    textAlign: 'center',
    marginTop: spacing[1],
  },

  // ── A:C ratio ─────────────────────────────────────────────────────────────
  ratioSection: {
    gap: spacing[2],
  },
  ratioHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 1,
  },
  ratioValue: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.bold,
  },

  // ── Insight ───────────────────────────────────────────────────────────────
  insightBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    radius.md,
    padding:         spacing[3],
    marginTop:       spacing[3],
  },
  insightText: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 20,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap:           spacing[3],
  },
  statsCol: {
    flex: 1,
    gap:  spacing[2],
  },
  statsColLabel: {
    color:         colors.text.tertiary,
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semiBold,
    letterSpacing: 0.8,
  },
  statsItems: {
    flexDirection: 'row',
    gap:           spacing[1],
  },
  statsDivider: {
    width:           1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf:       'stretch',
  },

  // ── Pro teaser ────────────────────────────────────────────────────────────
  proTeaser: {
    marginTop:       spacing[3],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    radius.md,
    padding:         spacing[3],
    alignItems:      'center',
  },
  proTeaserText: {
    color:    colors.text.tertiary,
    fontSize: fontSize.sm,
  },
});
