/**
 * StravaTrainingLoadCard
 *
 * Shows the 4-week training load trend from Strava activities.
 *
 * ── What it shows ─────────────────────────────────────────────────────────────
 *  • 4-week mini bar chart (oldest → this week)
 *  • Trend state: Building / Maintaining / Easy week / Deloading / Overreaching
 *  • Acute:Chronic (ATL/CTL) ratio + range indicator
 *  • One-line coaching insight
 *  • Sport breakdown (top 3 sport types, % of sessions)
 *  • This week vs 4-week average stats
 *
 * ── Pro gate ─────────────────────────────────────────────────────────────────
 * The full detail (A:C ratio, insight, sport breakdown) is Pro-only.
 * The bar chart and trend state are always shown when Strava is connected.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, fontWeight, spacing, surface, typography } from '@constants/theme';
import { computeTrainingTrend, type TrainingTrend, type WeeklyLoad } from '@utils/stravaLoad';
import type { StravaActivity } from '@services/strava';

// ─── Bar chart ────────────────────────────────────────────────────────────────

const BAR_MAX_HEIGHT = 60;
const BAR_WIDTH      = 32;

interface BarProps {
  week:        WeeklyLoad;
  maxLoad:     number;
  isThisWeek:  boolean;
}

function LoadBar({ week, maxLoad, isThisWeek }: BarProps) {
  const hasLoad  = week.load > 0;
  const fillFrac = maxLoad > 0 && hasLoad
    ? Math.max(week.load / maxLoad, 0.05)   // min 5% so short bars stay visible
    : 0;
  const barH = Math.round(fillFrac * BAR_MAX_HEIGHT);

  return (
    <View style={barStyles.col}>
      {/* Value label: brightest for this week, dimmed when there is no load */}
      <Text style={[
        barStyles.valLabel,
        !hasLoad ? barStyles.valLabelEmpty : isThisWeek && barStyles.valLabelNow,
      ]}>
        {hasLoad ? week.load : isThisWeek ? '-' : ''}
      </Text>

      {/* Bar track */}
      <View style={[
        barStyles.track,
        isThisWeek && !hasLoad && barStyles.trackEmpty,
      ]}>
        {barH > 0 && (
          // This week carries the one accent colour; past weeks are a muted fill
          <View
            style={[
              barStyles.fill,
              isThisWeek ? barStyles.fillNow : barStyles.fillPast,
              { height: barH },
            ]}
          />
        )}
        {/* "Now" with zero activity: a short baseline mark inside an outlined track */}
        {isThisWeek && !hasLoad && (
          <View style={barStyles.emptyNow} />
        )}
      </View>

      {/* Week label */}
      <Text style={[barStyles.weekLabel, isThisWeek && barStyles.weekLabelNow]}>
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
    fontFamily: fontFamily.numeral,
    fontSize:   13,
    height:     16,           // reserve space even when empty
    textAlign:  'center',
    color:      colors.text.secondary,
  },
  valLabelNow: {
    color: colors.text.primary,
  },
  valLabelEmpty: {
    color: colors.text.tertiary,
  },
  track: {
    width:           BAR_WIDTH,
    height:          BAR_MAX_HEIGHT,
    backgroundColor: colors.bg.tertiary,
    borderRadius:    4,
    justifyContent:  'flex-end',
    overflow:        'hidden',
  },
  trackEmpty: {
    // Outlined rather than filled for the in-progress empty column
    backgroundColor: colors.transparent,
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  fill: {
    width:        BAR_WIDTH,
    borderRadius: 4,
  },
  fillNow: {
    backgroundColor: colors.amber[400],
  },
  fillPast: {
    backgroundColor: colors.text.tertiary,
    opacity:         0.45,
  },
  emptyNow: {
    position:        'absolute',
    bottom:          8,
    left:            8,
    right:           8,
    height:          2,
    backgroundColor: colors.border.strong,
    borderRadius:    1,
  },
  weekLabel: {
    color:    colors.text.tertiary,
    fontSize: fontSize['2xs'],
  },
  weekLabelNow: {
    color:      colors.text.secondary,
    fontWeight: fontWeight.semiBold,
  },
});

// ─── A:C ratio indicator ──────────────────────────────────────────────────────

function AcRatioBar({ ratio }: { ratio: number }) {
  // Map ratio 0.5–1.5 → 0–100% for the indicator
  const MIN = 0.5, MAX = 1.5;
  const pct = Math.min(Math.max((ratio - MIN) / (MAX - MIN), 0), 1);

  return (
    <View style={ratioStyles.wrap}>
      <View style={ratioStyles.track}>
        {/* Coloured zones */}
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: colors.text.secondary + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#60A5FA' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#22C55E' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#F59E0B' + '40' }]} />
        <View style={[ratioStyles.zone, { width: '20%', backgroundColor: '#EF4444' + '40' }]} />
        {/* Pointer */}
        <View style={[ratioStyles.pointer, { left: `${Math.round(pct * 100)}%` }]} />
      </View>
      <View style={ratioStyles.labels}>
        <Text style={ratioStyles.labelText}>Deload</Text>
        <Text style={ratioStyles.labelText}>Easy</Text>
        <Text style={ratioStyles.labelText}>Steady</Text>
        <Text style={ratioStyles.labelText}>Build</Text>
        <Text style={ratioStyles.labelText}>Risk</Text>
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
    position:        'absolute',
    top:             -3,
    width:           14,
    height:          14,
    borderRadius:    7,
    marginLeft:      -7,
    borderWidth:     2,
    borderColor:     colors.bg.secondary,
    backgroundColor: colors.text.primary,
  },
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  labelText: {
    color:    colors.text.tertiary,
    fontSize: fontSize['2xs'],
    width:    '20%',
    textAlign: 'center',
  },
});

// ─── Sport mix ────────────────────────────────────────────────────────────────

const SPORT_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171'];

function SportBreakdown({ topSports }: { topSports: TrainingTrend['topSports'] }) {
  if (topSports.length === 0) return null;
  return (
    <View style={sportStyles.row}>
      {topSports.map((s, i) => (
        <View key={s.sport} style={sportStyles.item}>
          <View style={[sportStyles.dot, { backgroundColor: SPORT_COLORS[i] ?? SPORT_COLORS[0] }]} />
          <Text style={sportStyles.text}>
            {/* Strava names are run together ("WeightTraining"): space them */}
            {s.sport.replace(/([a-z])([A-Z])/g, '$1 $2')} <Text style={sportStyles.pct}>{s.pct}%</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

const sportStyles = StyleSheet.create({
  // An inline list, not chips: a share of sessions is not something to tap
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    columnGap:     spacing[4],
    rowGap:        spacing[1.5],
  },
  item: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1.5],
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  text: {
    ...typography.caption,
  },
  pct: {
    fontFamily: fontFamily.numeral,
    fontSize:   fontSize.sm,
    color:      colors.text.primary,
  },
});

// ─── Stats row ────────────────────────────────────────────────────────────────

/**
 * The value is set in the numeral face. Anything in it that is not a figure
 * (the "h" and "m" of "1h 24m") drops back to the system font as a unit.
 */
function numeralRuns(value: string) {
  return value.split(/(\d+(?:\.\d+)?)/).map((run, i) =>
    run === '' || /^\d/.test(run) ? run : <Text key={i} style={statStyles.unit}>{run}</Text>,
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{numeralRuns(value)}</Text>
      {/* One line, shrinking if needed: "Sessions" broke into "Session / s" with the larger 1.0.4 text */}
      <Text style={statStyles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{label}</Text>
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
    fontFamily: fontFamily.numeral,
    fontSize:   fontSize.lg,
    color:      colors.text.primary,
  },
  unit: {
    fontFamily: 'System',
    fontSize:   14,
    color:      colors.text.secondary,
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
  return <View style={styles.divider} />;
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

  // The state is coloured by its meaning, with the same colours as the ratio
  // zones below. Deloading sits in the grey zone there, so it is grey here too.
  const stateColor = trend.trend === 'deloading' ? colors.text.secondary : trend.trendColor;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>TRAINING LOAD TREND</Text>
        <View style={styles.headerRight}>
          {/* Computed state: a dot and plain text, not a pill */}
          <View style={styles.state}>
            <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
            <Text style={[styles.stateLabel, { color: stateColor }]}>{trend.trendDisplay}</Text>
          </View>
          <Text style={styles.source}>via Strava</Text>
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
          />
        ))}
      </View>
      <Text style={styles.loadUnit}>Load in {loadUnit}</Text>

      {isPro ? (
        <>
          <Divider />

          {/* ── A:C ratio ──
              Hidden at zero as well as null: a rest week produced a full gauge
              reading "0.00", which is a lot of screen space spent saying
              nothing. The coaching line below already explains the situation. */}
          {trend.acRatio !== null && trend.acRatio > 0 && (
            <>
              <View style={styles.ratioSection}>
                <View style={styles.ratioHeader}>
                  <Text style={styles.sectionLabel}>ACUTE : CHRONIC RATIO</Text>
                  <Text style={styles.ratioValue}>{trend.acRatio.toFixed(2)}</Text>
                </View>
                <AcRatioBar ratio={trend.acRatio} />
              </View>
              <Divider />
            </>
          )}

          {/* ── Coaching insight: ruled off above and below, not boxed ── */}
          <Text style={styles.insightText}>{trend.insight}</Text>

          <Divider />

          {/* ── This week vs average stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              <Text style={styles.statsColLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>This week</Text>
              <View style={styles.statsItems}>
                <StatItem label="Sessions" value={String(thisWeek.sessionCount)} />
                <StatItem label="Time"     value={formatMins(thisWeek.movingMinutes)} />
                <StatItem label={loadUnit} value={String(thisWeek.load)} />
              </View>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsCol}>
              <Text style={styles.statsColLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>4-week avg / week</Text>
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
              <Text style={styles.sectionLabel}>SPORT MIX · 4 weeks</Text>
              <View style={{ marginTop: spacing[2] }}>
                <SportBreakdown topSports={trend.topSports} />
              </View>
            </>
          )}
        </>
      ) : (
        /* Free tier: what Pro adds, ruled off, with a lock icon */
        <View style={styles.proTeaser}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.proTeaserText}>
            Pro: A:C ratio, coaching insights & sport breakdown
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
  section: {},

  card: {
    ...surface.card,
    padding: spacing[4],
  },

  divider: {
    height:          1,
    backgroundColor: colors.border.subtle,
    marginVertical:  spacing[3],
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    // With the larger 1.0.4 text the title, the state and "via Strava" no
    // longer fit on one line: the title ran into the state and the Strava
    // tag hung over the card edge. They drop to their own line instead.
    flexWrap:       'wrap',
    columnGap:      spacing[2],
    rowGap:         spacing[2],
    marginBottom:   spacing[3],
  },
  title: {
    ...typography.label,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  state: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1.5],
  },
  stateDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  stateLabel: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  // Where the data came from: quiet text, not a badge
  source: {
    fontSize: fontSize['2xs'],
    color:    colors.text.tertiary,
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
    fontSize:  fontSize['2xs'],
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
    ...typography.label,
  },
  ratioValue: {
    fontFamily:    fontFamily.numeral,
    fontSize:      fontSize.xl,
    letterSpacing: -0.5,
    color:         colors.text.primary,
  },

  // ── Insight ───────────────────────────────────────────────────────────────
  insightText: {
    ...typography.caption,
    fontSize:   fontSize.sm,
    lineHeight: 21,
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
    ...typography.label,
    letterSpacing: 1,
  },
  statsItems: {
    flexDirection: 'row',
    gap:           spacing[1],
  },
  statsDivider: {
    width:           1,
    backgroundColor: colors.border.subtle,
    alignSelf:       'stretch',
  },

  // ── Pro teaser ────────────────────────────────────────────────────────────
  proTeaser: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[2],
    marginTop:      spacing[3],
    paddingTop:     spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  proTeaserText: {
    ...typography.caption,
    color:      colors.text.tertiary,
    flexShrink: 1,
  },
});
