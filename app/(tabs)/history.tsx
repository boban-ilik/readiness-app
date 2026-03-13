import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useHistoryData, type DayHistory } from '@hooks/useHistoryData';
import { useSubscription } from '@contexts/SubscriptionContext';
import { ProGate } from '@components/common/ProGate';
import CorrelationsCard from '@components/score/CorrelationsCard';
import { exportHistoryCSV } from '@utils/export';
import WeeklyReportModal from '@components/score/WeeklyReportModal';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  getScoreColor,
  getScoreLabel,
} from '@constants/theme';
import { formatDuration } from '@utils/index';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeMode = '7d' | '28d' | 'cal';

interface CalendarCell {
  date:      string;       // YYYY-MM-DD
  dayNum:    number;       // 1–31
  isToday:   boolean;
  history:   DayHistory | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Builds a Monday-aligned calendar grid for the given month. Null = padding cell. */
function buildCalendarGrid(
  history:  DayHistory[],
  year:     number,
  month:    number,  // 0–11
  todayStr: string,
): (CalendarCell | null)[][] {
  const histMap      = new Map(history.map(d => [d.date, d]));
  const firstDay     = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  // Monday = 0, Sunday = 6 offset
  const startPad     = (firstDay.getDay() + 6) % 7;

  const cells: (CalendarCell | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = localDateStr(new Date(year, month, d));
    cells.push({
      date:    dateStr,
      dayNum:  d,
      isToday: dateStr === todayStr,
      history: histMap.get(dateStr) ?? null,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Consecutive days (ending today or yesterday) that have a real score. */
function computeStreak(history: DayHistory[]): number {
  if (history.length === 0) return 0;
  const todayStr    = localDateStr(new Date());
  const sorted      = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak        = 0;
  let expectedDate  = todayStr;

  for (const day of sorted) {
    if (day.date !== expectedDate) {
      // Allow one-day gap if we haven't started yet (yesterday is fine too)
      if (streak === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (day.date !== localDateStr(yesterday)) break;
        expectedDate = day.date;
      } else {
        break;
      }
    }
    if (day.score === null) break;
    streak++;
    const prev = new Date(expectedDate + 'T12:00:00');
    prev.setDate(prev.getDate() - 1);
    expectedDate = localDateStr(prev);
  }
  return streak;
}

// ─── SVG Trend Chart ──────────────────────────────────────────────────────────

interface ChartPt {
  x:        number;
  y:        number | null;
  score:    number | null;
  dayLabel: string;
  isToday:  boolean;
}

function buildPoints(
  data:        DayHistory[],
  plotWidth:   number,
  plotHeight:  number,
  padTop:      number,
  todayStr:    string,
): ChartPt[] {
  const n = data.length;
  return data.map((d, i) => ({
    x:        n <= 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth,
    y:        d.score !== null ? padTop + (1 - d.score / 100) * plotHeight : null,
    score:    d.score,
    dayLabel: d.dayLabel,
    isToday:  d.date === todayStr,
  }));
}

function TrendChart({ data, chartWidth }: { data: DayHistory[]; chartWidth: number }) {
  const CHART_H  = 164;
  const PAD_TOP  = 14;
  const PAD_BOT  = 30;
  const PLOT_H   = CHART_H - PAD_TOP - PAD_BOT;
  const BOTTOM_Y = PAD_TOP + PLOT_H;

  const todayStr = new Date().toISOString().split('T')[0];
  const pts      = buildPoints(data, chartWidth, PLOT_H, PAD_TOP, todayStr);
  const validPts = pts.filter(p => p.y !== null);

  let linePath = '';
  for (const p of pts) {
    if (p.y === null) continue;
    const cmd = linePath === '' ? 'M' : 'L';
    linePath += `${cmd} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }

  let areaPath = '';
  if (validPts.length >= 2) {
    const first = validPts[0];
    const last  = validPts[validPts.length - 1];
    areaPath =
      linePath +
      `L ${last.x.toFixed(1)} ${BOTTOM_Y.toFixed(1)} ` +
      `L ${first.x.toFixed(1)} ${BOTTOM_Y.toFixed(1)} Z`;
  }

  const gridLines  = [25, 50, 75].map(s => ({
    s,
    y: (PAD_TOP + (1 - s / 100) * PLOT_H).toFixed(1),
  }));
  const labelStep  = data.length > 10 ? Math.ceil(data.length / 7) : 1;

  return (
    <Svg width={chartWidth} height={CHART_H}>
      <Defs>
        <LinearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={colors.amber[400]} stopOpacity="0.28" />
          <Stop offset="100%" stopColor={colors.amber[400]} stopOpacity="0"    />
        </LinearGradient>
      </Defs>

      {gridLines.map(g => (
        <Line
          key={g.s}
          x1={0}          y1={g.y}
          x2={chartWidth} y2={g.y}
          stroke={colors.border.subtle}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}

      {areaPath !== '' && <Path d={areaPath} fill="url(#aGrad)" />}
      {linePath !== '' && (
        <Path
          d={linePath}
          stroke={colors.amber[400]}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {pts.map((p, i) => {
        if (p.y === null || p.score === null) return null;
        const dotColor = getScoreColor(p.score);
        const r = p.isToday ? 6 : (data.length > 10 ? 3 : 4);
        return (
          <Circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={r}
            fill={dotColor} stroke={colors.bg.secondary} strokeWidth={2} />
        );
      })}

      {pts.map((p, i) => {
        if (!p.isToday || p.y === null || p.score === null) return null;
        return (
          <SvgText key={`score-${i}`} x={p.x.toFixed(1)} y={(p.y - 12).toFixed(1)}
            fontSize={11} fill={colors.amber[400]} textAnchor="middle" fontWeight="600">
            {p.score}
          </SvgText>
        );
      })}

      {pts.map((p, i) => {
        if (i % labelStep !== 0 && !p.isToday) return null;
        return (
          <SvgText key={`lbl-${i}`} x={p.x.toFixed(1)} y={CHART_H - 6}
            fontSize={10}
            fill={p.isToday ? colors.amber[400] : colors.text.tertiary}
            textAnchor="middle"
            fontWeight={p.isToday ? '600' : '400'}>
            {p.dayLabel.slice(0, 3)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Component breakdown bars ─────────────────────────────────────────────────

function ComponentBars({
  components,
}: {
  components: { recovery: number; sleep: number; stress: number };
}) {
  const bars = [
    { label: 'Rec', value: components.recovery, color: colors.error   },
    { label: 'Slp', value: components.sleep,    color: colors.info    },
    { label: 'Str', value: components.stress,   color: colors.warning },
  ];
  return (
    <View style={styles.compBarsRow}>
      {bars.map(({ label, value, color }) => (
        <View key={label} style={styles.compBarWrap}>
          <Text style={[styles.compBarLabel, { color }]}>{label}</Text>
          <View style={styles.compBarTrack}>
            <View
              style={[
                styles.compBarFill,
                { width: `${value}%` as any, backgroundColor: color + 'CC' },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  trend,
  raw,
}: {
  label:   string;
  value:   number | null;
  trend?:  number | null;
  raw?:    string;   // override text (e.g. for streak "3d")
}) {
  const scoreColor = value !== null ? getScoreColor(value) : colors.text.tertiary;
  const displayColor = raw ? colors.amber[400] : scoreColor;
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: displayColor }]}>
        {raw ?? (value ?? '—')}
      </Text>
      {trend != null && (
        <Text style={[styles.statTrend, { color: trend >= 0 ? colors.success : colors.error }]}>
          {trend >= 0 ? `+${trend}` : String(trend)} vs avg
        </Text>
      )}
    </View>
  );
}

// ─── Day row ──────────────────────────────────────────────────────────────────

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}

function DayRow({ day, isToday }: { day: DayHistory; isToday: boolean }) {
  const scoreColor = day.score !== null ? getScoreColor(day.score) : colors.text.tertiary;

  return (
    <View style={[styles.dayRow, isToday && styles.dayRowToday]}>
      {/* Date */}
      <View style={styles.dayDateCol}>
        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
          {day.dayLabel}{isToday ? '  ·  Today' : ''}
        </Text>
        <Text style={styles.dayDate}>{shortDate(day.date)}</Text>
        {/* Component breakdown bars */}
        {day.components && <ComponentBars components={day.components} />}
      </View>

      {/* Score */}
      <Text style={[styles.dayScore, { color: scoreColor }]}>
        {day.score ?? '—'}
      </Text>

      {/* Metrics */}
      <View style={styles.dayMetricsCol}>
        {day.sleepMinutes !== null && (
          <Text style={styles.dayMetric}>
            💤 {formatDuration(day.sleepMinutes)}
          </Text>
        )}
        {day.rhr !== null && (
          <Text style={styles.dayMetric}>❤️ {day.rhr} bpm</Text>
        )}
        {day.hrv !== null && (
          <Text style={styles.dayMetric}>⚡ {day.hrv} ms</Text>
        )}
        {day.score === null && (
          <Text style={styles.dayNoData}>No data</Text>
        )}
      </View>
    </View>
  );
}

// ─── Calendar heatmap ─────────────────────────────────────────────────────────

const CAL_DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CAL_GAP         = 5;

function DayDetailCard({ day }: { day: DayHistory }) {
  const scoreColor = day.score !== null ? getScoreColor(day.score) : colors.text.tertiary;
  const label      = day.score !== null ? getScoreLabel(day.score) : 'No data';

  const bars = day.components
    ? [
        { key: 'Recovery', value: day.components.recovery, color: colors.error   },
        { key: 'Sleep',    value: day.components.sleep,    color: colors.info    },
        { key: 'Stress',   value: day.components.stress,   color: colors.warning },
      ]
    : [];

  return (
    <View style={styles.dayDetail}>
      <View style={styles.dayDetailHeader}>
        <View>
          <Text style={[styles.dayDetailLabel, { color: scoreColor }]}>{label}</Text>
          <Text style={styles.dayDetailDate}>{day.dayLabel}, {shortDate(day.date)}</Text>
        </View>
        <Text style={[styles.dayDetailScore, { color: scoreColor }]}>
          {day.score ?? '—'}
        </Text>
      </View>

      <View style={styles.dayDetailMetrics}>
        {day.sleepMinutes != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>💤 {formatDuration(day.sleepMinutes)}</Text>
          </View>
        )}
        {day.rhr != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>❤️ {day.rhr} bpm</Text>
          </View>
        )}
        {day.hrv != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>⚡ HRV {day.hrv} ms</Text>
          </View>
        )}
        {day.sleepEfficiency != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>🎯 {day.sleepEfficiency}% efficiency</Text>
          </View>
        )}
        {day.score === null && (
          <Text style={styles.dayNoData}>No data recorded</Text>
        )}
      </View>

      {bars.length > 0 && (
        <View style={styles.dayDetailBars}>
          {bars.map(({ key, value, color }) => (
            <View key={key} style={styles.dayDetailBarRow}>
              <Text style={[styles.dayDetailBarLabel, { color }]}>{key}</Text>
              <View style={styles.dayDetailBarTrack}>
                <View
                  style={[
                    styles.dayDetailBarFill,
                    { width: `${value}%` as any, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={[styles.dayDetailBarValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CalendarHeatmap({
  history,
  cellSize,
}: {
  history:  DayHistory[];
  cellSize: number;
}) {
  const today    = new Date();
  const todayStr = localDateStr(today);

  // Current month = month of today. We allow navigating one month back since
  // 28 days of data can span two calendar months.
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const rows = buildCalendarGrid(history, viewYear, viewMonth, todayStr);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = history.find(d => d.date === selectedDate) ?? null;

  const monthName = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Earliest month we have data for (don't navigate before it)
  const minDate       = history.length > 0 ? history[0].date : todayStr;
  const minYear       = parseInt(minDate.slice(0, 4), 10);
  const minMonth      = parseInt(minDate.slice(5, 7), 10) - 1;
  const canGoPrev     = viewYear > minYear || (viewYear === minYear && viewMonth > minMonth);
  const canGoNext     = viewYear < today.getFullYear() ||
                        (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  function goToPrevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else { setViewMonth(m => m - 1); }
    setSelectedDate(null);
  }
  function goToNextMonth() {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else { setViewMonth(m => m + 1); }
    setSelectedDate(null);
  }

  return (
    <View>
      {/* Month navigation */}
      <View style={styles.calNavRow}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          disabled={!canGoPrev}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={[styles.calNavArrow, !canGoPrev && styles.calNavArrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.calMonthTitle}>{monthName}</Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          disabled={!canGoNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={[styles.calNavArrow, !canGoNext && styles.calNavArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.calRow}>
        {CAL_DAY_HEADERS.map((h, i) => (
          <View key={i} style={[styles.calHeaderCell, { width: cellSize }]}>
            <Text style={styles.calHeaderText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Calendar rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={[styles.calRow, { marginTop: CAL_GAP }]}>
          {row.map((cell, ci) => {
            if (!cell) {
              return <View key={ci} style={{ width: cellSize, height: cellSize, marginLeft: ci > 0 ? CAL_GAP : 0 }} />;
            }

            const score       = cell.history?.score ?? null;
            const isSelected  = cell.date === selectedDate;
            const scoreColor  = score !== null ? getScoreColor(score) : null;
            const bgColor     = scoreColor !== null ? scoreColor + '2A' : 'transparent';
            const borderCol   = cell.isToday  ? colors.amber[400]
                              : isSelected    ? colors.text.secondary
                              :                 colors.border.subtle;
            const borderW     = cell.isToday || isSelected ? 2 : 1;

            return (
              <TouchableOpacity
                key={ci}
                onPress={() => setSelectedDate(isSelected ? null : cell.date)}
                activeOpacity={0.7}
                style={[
                  styles.calCell,
                  {
                    width:           cellSize,
                    height:          cellSize,
                    marginLeft:      ci > 0 ? CAL_GAP : 0,
                    backgroundColor: bgColor,
                    borderColor:     borderCol,
                    borderWidth:     borderW,
                  },
                ]}
              >
                <Text style={[
                  styles.calDayNum,
                  cell.isToday && styles.calDayNumToday,
                ]}>
                  {cell.dayNum}
                </Text>
                {score !== null && (
                  <Text style={[styles.calCellScore, { color: scoreColor! }]}>
                    {score}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Score colour legend */}
      <View style={styles.calLegend}>
        {[
          { label: 'Peak',     color: colors.success },
          { label: 'Good',     color: '#84cc16'      },
          { label: 'Moderate', color: colors.warning },
          { label: 'Low',      color: colors.error   },
        ].map(({ label, color }) => (
          <View key={label} style={styles.calLegendItem}>
            <View style={[styles.calLegendDot, { backgroundColor: color }]} />
            <Text style={styles.calLegendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Selected day detail */}
      {selectedDate && (
        selectedDay
          ? <DayDetailCard day={selectedDay} />
          : <View style={styles.dayDetail}>
              <Text style={styles.dayNoData}>No data for this day</Text>
            </View>
      )}
    </View>
  );
}

// ─── Weekly AI Insight card ───────────────────────────────────────────────────

// ─── Weekly report entry card ─────────────────────────────────────────────────
// Replaces the old inline WeeklyInsightCard — tapping it opens the full modal.

function WeeklyReportEntryCard({ onOpen }: { onOpen: () => void }) {
  return (
    <TouchableOpacity style={styles.weeklyEntryCard} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.weeklyEntryLeft}>
        <View style={styles.weeklyEntryTitleRow}>
          <Text style={styles.weeklyEntryTitle}>WEEKLY REPORT</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ AI</Text>
          </View>
        </View>
        <Text style={styles.weeklyEntrySub}>
          Score trends, component breakdown & actionable tip
        </Text>
      </View>
      <View style={styles.weeklyEntryChevron}>
        <Text style={styles.weeklyEntryChevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Today Card (free users) ──────────────────────────────────────────────────

function TodayCard({ today }: { today: DayHistory | undefined }) {
  const score      = today?.score ?? null;
  const scoreColor = score !== null ? getScoreColor(score) : colors.text.tertiary;
  const label      = score !== null ? getScoreLabel(score) : 'No data yet';

  return (
    <View style={styles.todayCard}>
      <View style={styles.todayLeft}>
        <Text style={styles.todayEyebrow}>TODAY</Text>
        <Text style={styles.todayLabel}>{label}</Text>
        {today && <Text style={styles.todayDate}>{shortDate(today.date)}</Text>}
        <View style={styles.todayMetrics}>
          {today?.sleepMinutes != null && (
            <View style={styles.todayMetricPill}>
              <Text style={styles.todayMetricText}>💤 {formatDuration(today.sleepMinutes)}</Text>
            </View>
          )}
          {today?.rhr != null && (
            <View style={styles.todayMetricPill}>
              <Text style={styles.todayMetricText}>❤️ {today.rhr} bpm</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.todayScoreCol}>
        <Text style={[styles.todayScore, { color: scoreColor }]}>{score ?? '—'}</Text>
        <Text style={styles.todayScoreOf}>/100</Text>
      </View>
    </View>
  );
}

// ─── Teaser banner (free users) ───────────────────────────────────────────────

function TeaserBanner({ daysTracked }: { daysTracked: number }) {
  const msg = daysTracked >= 7
    ? `You've been tracking for ${daysTracked} days — see your trend`
    : `${daysTracked} day${daysTracked !== 1 ? 's' : ''} tracked — your 7-day chart is ready`;
  return (
    <View style={styles.teaserBanner}>
      <Text style={styles.teaserIcon}>📈</Text>
      <Text style={styles.teaserText}>{msg}</Text>
      <Text style={styles.teaserLock}>Pro</Text>
    </View>
  );
}

// ─── Range toggle ─────────────────────────────────────────────────────────────

function RangeToggle({
  value,
  onChange,
}: {
  value:    RangeMode;
  onChange: (v: RangeMode) => void;
}) {
  const opts: { key: RangeMode; label: string }[] = [
    { key: '7d',  label: '7D'  },
    { key: '28d', label: '28D' },
    { key: 'cal', label: 'CAL' },
  ];
  return (
    <View style={styles.rangeToggle}>
      {opts.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.rangeBtn, value === opt.key && styles.rangeBtnActive]}
          onPress={() => onChange(opt.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.rangeBtnText, value === opt.key && styles.rangeBtnTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [rangeMode,          setRangeMode]          = useState<RangeMode>('7d');
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const days = rangeMode === 'cal' || rangeMode === '28d' ? 28 : 7;

  const { history, isLoading, error } = useHistoryData(days);
  const { isPro }      = useSubscription();
  const { width }      = useWindowDimensions();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try { await exportHistoryCSV(history); }
    catch (e: any) { Alert.alert('Export failed', e.message ?? 'Could not export data.'); }
    finally { setExporting(false); }
  };

  const SCREEN_PAD = spacing[5];
  const CARD_PAD   = spacing[4];
  const chartWidth = width - SCREEN_PAD * 2 - CARD_PAD * 2;
  const calCellSize = Math.floor((chartWidth - 6 * CAL_GAP) / 7);

  const todayStr    = new Date().toISOString().split('T')[0];
  const today       = history.find(d => d.date === todayStr);
  const scores      = history.filter(d => d.score !== null).map(d => d.score!);
  const avgScore    = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const bestScore   = scores.length > 0 ? Math.max(...scores) : null;
  const todayScore  = today?.score ?? null;
  const trendVsAvg  = todayScore !== null && avgScore !== null ? todayScore - avgScore : null;
  const streak      = computeStreak(history);

  const dateRangeText =
    history.length >= 2
      ? `${shortDate(history[0].date)} – ${shortDate(history[history.length - 1].date)}`
      : '';
  const daysTracked = scores.length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator color={colors.amber[400]} size="large" />
        <Text style={styles.loadingText}>Loading history…</Text>
      </SafeAreaView>
    );
  }

  // ── Pro layout ───────────────────────────────────────────────────────────────
  if (isPro) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>History</Text>
              {dateRangeText ? <Text style={styles.dateRange}>{dateRangeText}</Text> : null}
            </View>
            <View style={styles.headerRight}>
              <RangeToggle value={rangeMode} onChange={setRangeMode} />
              <TouchableOpacity
                style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
                onPress={handleExport}
                disabled={exporting}
                activeOpacity={0.75}
              >
                <Text style={styles.exportBtnText}>{exporting ? '…' : '↑ CSV'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chart card — trend or calendar */}
          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>
              {rangeMode === 'cal' ? 'READINESS · THIS MONTH' : `READINESS · ${days} DAYS`}
            </Text>

            {rangeMode === 'cal' ? (
              history.length > 0
                ? <CalendarHeatmap history={history} cellSize={calCellSize} />
                : <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>No data yet</Text></View>
            ) : (
              history.length > 0
                ? <TrendChart data={history} chartWidth={chartWidth} />
                : <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>No data yet</Text></View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatChip label={`${days}-DAY AVG`} value={avgScore} />
            <View style={styles.statDivider} />
            <StatChip label="BEST" value={bestScore} />
            <View style={styles.statDivider} />
            <StatChip label="TODAY" value={todayScore} trend={trendVsAvg} />
            {streak > 0 && (
              <>
                <View style={styles.statDivider} />
                <StatChip label="STREAK" value={null} raw={`${streak}d`} />
              </>
            )}
          </View>

          {/* Weekly Report entry — opens full modal */}
          {rangeMode === '7d' && (
            <WeeklyReportEntryCard onOpen={() => setWeeklyReportVisible(true)} />
          )}

          {/* Weekly Report modal */}
          <WeeklyReportModal
            visible={weeklyReportVisible}
            onClose={() => setWeeklyReportVisible(false)}
          />

          {/* Patterns / correlations */}
          <View style={styles.correlationsBlock}>
            <Text style={styles.sectionTitle}>INSIGHTS</Text>
            <CorrelationsCard history={history} />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Daily log */}
          <View style={styles.dayList}>
            <Text style={styles.sectionTitle}>DAILY LOG</Text>
            <Text style={styles.scoreBasis}>
              Scores based on sleep + resting heart rate · coloured bars show recovery / sleep / stress
            </Text>
            {[...history].reverse().map(day => (
              <DayRow key={day.date} day={day} isToday={day.date === todayStr} />
            ))}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Free layout ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>

        <TodayCard today={today} />
        <TeaserBanner daysTracked={daysTracked} />

        <ProGate
          feature="7-Day History & Trends"
          description="Track how your readiness evolves day by day and spot patterns in your recovery."
          style={styles.proGateBlock}
        >
          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>READINESS · 7 DAYS</Text>
            {history.length > 0
              ? <TrendChart data={history} chartWidth={chartWidth} />
              : <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>No data yet</Text></View>
            }
          </View>

          <View style={styles.statsRow}>
            <StatChip label="7-DAY AVG" value={avgScore} />
            <View style={styles.statDivider} />
            <StatChip label="BEST" value={bestScore} />
            <View style={styles.statDivider} />
            <StatChip label="TODAY" value={todayScore} trend={trendVsAvg} />
          </View>

          <View style={styles.dayList}>
            <Text style={styles.sectionTitle}>DAILY LOG</Text>
            <Text style={styles.scoreBasis}>
              Scores based on sleep + resting heart rate · coloured bars show recovery / sleep / stress
            </Text>
            {[...history].reverse().map(day => (
              <DayRow key={day.date} day={day} isToday={day.date === todayStr} />
            ))}
          </View>
        </ProGate>

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  dateRange: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing[0.5],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Range toggle (3 options)
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  rangeBtn: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[2],
  },
  rangeBtnActive: {
    backgroundColor: colors.amber[400],
  },
  rangeBtnText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  rangeBtnTextActive: {
    color: colors.text.inverse,
  },

  // Export button
  exportBtn: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    color: colors.amber[400],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.3,
  },

  // Weekly Report entry card
  weeklyEntryCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyEntryLeft: {
    flex: 1,
    gap: spacing[1],
  },
  weeklyEntryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  weeklyEntryTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
  },
  weeklyEntrySub: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  weeklyEntryChevron: {
    paddingLeft: spacing[2],
  },
  weeklyEntryChevronText: {
    color: colors.amber[400],
    fontSize: 22,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
  },
  aiBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
  },
  aiBadgeText: {
    color: '#a78bfa',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // Today card (free)
  todayCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayLeft: {
    flex: 1,
    gap: spacing[1],
  },
  todayEyebrow: {
    color: colors.amber[400],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 2,
  },
  todayLabel: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  todayDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  todayMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  todayMetricPill: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  todayMetricText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
  },
  todayScoreCol: {
    alignItems: 'flex-end',
    paddingLeft: spacing[4],
  },
  todayScore: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 52,
  },
  todayScoreOf: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },

  // Teaser
  teaserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing[2],
  },
  teaserIcon: {
    fontSize: 16,
  },
  teaserText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  teaserLock: {
    backgroundColor: colors.amber[400],
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },

  proGateBlock: {
    marginBottom: spacing[3],
  },

  // Correlations
  correlationsBlock: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },

  // Chart card
  chartCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  chartLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1.5,
    marginBottom: spacing[3],
  },
  chartEmpty: {
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },

  // ── Calendar heatmap ──────────────────────────────────────────────────────
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  calNavArrow: {
    color: colors.amber[400],
    fontSize: 22,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
    paddingHorizontal: spacing[1],
  },
  calNavArrowDisabled: {
    color: colors.border.default,
  },
  calMonthTitle: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    textAlign: 'center',
    flex: 1,
  },
  calRow: {
    flexDirection: 'row',
  },
  calHeaderCell: {
    alignItems: 'center',
    marginLeft: 0,
  },
  calHeaderText: {
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  calCell: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  calDayNum: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: fontWeight.medium,
    lineHeight: 12,
  },
  calDayNumToday: {
    color: colors.amber[400],
    fontWeight: fontWeight.bold,
  },
  calCellScore: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 11,
  },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  calLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calLegendLabel: {
    color: colors.text.tertiary,
    fontSize: 10,
  },

  // ── Day detail card (calendar tap) ────────────────────────────────────────
  dayDetail: {
    marginTop: spacing[3],
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[3],
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dayDetailLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  dayDetailDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  dayDetailScore: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  dayDetailMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dayDetailPill: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  dayDetailPillText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
  },
  dayDetailBars: {
    gap: spacing[2],
  },
  dayDetailBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dayDetailBarLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    width: 60,
  },
  dayDetailBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dayDetailBarFill: {
    height: 6,
    borderRadius: 3,
  },
  dayDetailBarValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    width: 28,
    textAlign: 'right',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[0.5],
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[1],
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: 9,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  statTrend: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Day list
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 2,
    marginBottom: spacing[1],
  },
  scoreBasis: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    opacity: 0.65,
    marginBottom: spacing[2],
  },
  dayList: {
    gap: 0,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dayRowToday: {},
  dayDateCol: {
    flex: 1,
    gap: spacing[0.5],
  },
  dayName: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dayNameToday: {
    color: colors.amber[400],
    fontWeight: fontWeight.semiBold,
  },
  dayDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },

  // Component bars (in day row)
  compBarsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing[1.5],
  },
  compBarWrap: {
    flex: 1,
    gap: 2,
  },
  compBarLabel: {
    fontSize: 8,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.2,
  },
  compBarTrack: {
    height: 3,
    backgroundColor: colors.bg.elevated,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  compBarFill: {
    height: 3,
    borderRadius: 1.5,
  },

  dayScore: {
    width: 44,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  dayMetricsCol: {
    flex: 1.1,
    alignItems: 'flex-end',
    gap: spacing[0.5],
  },
  dayMetric: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
  },
  dayNoData: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },

  // Error
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

  bottomPad: {
    height: spacing[8],
  },
});
