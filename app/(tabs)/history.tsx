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
import { Ionicons } from '@expo/vector-icons';
import { useHistoryData } from '@hooks/useHistoryData';
import type { DayHistory } from '@/types/index';
import { useStreak } from '@hooks/useStreak';
import { useSubscription } from '@contexts/SubscriptionContext';
import { ProGate } from '@components/common/ProGate';
import CorrelationsCard from '@components/score/CorrelationsCard';
import { exportHistoryCSV } from '@utils/export';
import WeeklyReportModal from '@components/score/WeeklyReportModal';
import FirstLookModal from '@components/score/FirstLookModal';
import { track } from '@services/analytics';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  radius,
  surface,
  typography,
  getScoreColor,
  getScoreLabel,
} from '@constants/theme';
import { formatDuration, localDateStr } from '@utils/index';
import { buildCalendarGrid, shortDate } from '@utils/historyCalendar';
import { buildPoints, type MetricConfig } from '@utils/historyChart';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeMode  = '7d' | '28d' | 'cal';
type MetricMode = 'score' | 'hrv' | 'sleep' | 'rhr';

// ─── Metric configuration ─────────────────────────────────────────────────────

const METRIC_CONFIG: Record<MetricMode, MetricConfig> = {
  score: {
    label:     'READINESS',
    unit:      'pts',
    color:     colors.amber[400],
    getValue:  d => d.score,
    gridLines: [25, 50, 75],
    yMin:      0,
    yMax:      100,
    format:    v => String(Math.round(v)),
  },
  hrv: {
    label:     'HRV',
    unit:      'ms',
    color:     '#4ADE80',   // green
    getValue:  d => d.hrv,
    gridLines: [20, 40, 60, 80],
    yMin:      0,
    yMax:      120,
    format:    v => `${Math.round(v)}`,
  },
  sleep: {
    label:     'SLEEP',
    unit:      'hrs',
    color:     '#60A5FA',   // blue
    getValue:  d => d.sleepMinutes !== null ? Math.round(d.sleepMinutes / 6) / 10 : null,
    gridLines: [5, 6, 7, 8, 9],
    yMin:      3,
    yMax:      10,
    format:    v => `${v.toFixed(1)}h`,
  },
  rhr: {
    label:     'RESTING HR',
    unit:      'bpm',
    color:     '#F87171',   // red
    getValue:  d => d.rhr,
    gridLines: [50, 60, 70, 80],
    yMin:      40,
    yMax:      100,
    format:    v => `${Math.round(v)}`,
  },
};

// ─── SVG Trend Chart ──────────────────────────────────────────────────────────

function TrendChart({
  data,
  chartWidth,
  metric = 'score',
}: {
  data:        DayHistory[];
  chartWidth:  number;
  metric?:     MetricMode;
}) {
  const CHART_H  = 164;
  const PAD_TOP  = 14;
  const PAD_BOT  = 30;
  const PLOT_H   = CHART_H - PAD_TOP - PAD_BOT;
  const BOTTOM_Y = PAD_TOP + PLOT_H;
  // The first and last points used to sit exactly on x=0 and x=chartWidth.
  // Their labels are centre-anchored, so half of each rendered outside the SVG
  // and got clipped — "Sat" became "at" and today's "45" became "4".
  const PAD_X    = 16;

  const cfg      = METRIC_CONFIG[metric];
  const todayStr = localDateStr(new Date());
  const pts      = buildPoints(data, chartWidth - PAD_X * 2, PLOT_H, PAD_TOP, todayStr, cfg, PAD_X);
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

  const gridLines = cfg.gridLines.map(v => ({
    v,
    label: cfg.format(v),
    y: (PAD_TOP + (1 - (v - cfg.yMin) / (cfg.yMax - cfg.yMin)) * PLOT_H).toFixed(1),
  }));
  const labelStep = data.length > 10 ? Math.ceil(data.length / 7) : 1;

  return (
    <Svg width={chartWidth} height={CHART_H}>
      <Defs>
        <LinearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={cfg.color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={cfg.color} stopOpacity="0"    />
        </LinearGradient>
      </Defs>

      {gridLines.map(g => (
        <Line
          key={g.v}
          x1={0}          y1={g.y}
          x2={chartWidth} y2={g.y}
          stroke={colors.border.subtle}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}

      {/* Grid value labels on left edge */}
      {gridLines.map(g => (
        <SvgText key={`gl-${g.v}`}
          x={0} y={(parseFloat(g.y) - 3).toFixed(1)}
          fontSize={8} fill={colors.text.tertiary} textAnchor="start">
          {g.label}
        </SvgText>
      ))}

      {areaPath !== '' && <Path d={areaPath} fill="url(#aGrad)" />}
      {linePath !== '' && (
        <Path
          d={linePath}
          stroke={cfg.color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {pts.map((p, i) => {
        if (p.y === null || p.score === null) return null;
        const dotColor = metric === 'score' ? getScoreColor(p.score) : cfg.color;
        const r = p.isToday ? 6 : (data.length > 10 ? 3 : 4);
        return (
          <Circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={r}
            fill={dotColor} stroke={colors.bg.primary} strokeWidth={2} />
        );
      })}

      {pts.map((p, i) => {
        if (!p.isToday || p.y === null || p.score === null) return null;
        return (
          <SvgText key={`val-${i}`} x={p.x.toFixed(1)} y={(p.y - 12).toFixed(1)}
            fontSize={15} fontFamily={fontFamily.numeral} fill={cfg.color} textAnchor="middle">
            {cfg.format(p.score)}
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
    { label: 'Recovery', value: components.recovery },
    { label: 'Sleep',    value: components.sleep    },
    { label: 'Stress',   value: components.stress   },
  ];
  return (
    <View style={styles.compBarsRow}>
      {bars.map(({ label, value }) => (
        <View key={label} style={styles.compBarWrap}>
          <Text style={styles.compBarLabel}>{label}</Text>
          <View style={styles.compBarTrack}>
            <View
              style={[
                styles.compBarFill,
                { width: `${value}%` as any, backgroundColor: getScoreColor(value) },
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

function DayRow({ day, isToday }: { day: DayHistory; isToday: boolean }) {
  const scoreColor = day.score !== null ? getScoreColor(day.score) : colors.text.tertiary;
  const meta = [
    shortDate(day.date),
    day.sleepMinutes !== null ? `${formatDuration(day.sleepMinutes)} sleep` : null,
    day.rhr !== null ? `${day.rhr} bpm` : null,
    day.hrv !== null ? `HRV ${day.hrv} ms` : null,
    day.score === null ? 'No data' : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.dayRow}>
      <View style={styles.dayDateCol}>
        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
          {day.dayLabel}{isToday ? ' · Today' : ''}
        </Text>
        <Text style={styles.dayMeta}>{meta}</Text>
        {day.components && <ComponentBars components={day.components} />}
      </View>

      <Text style={[styles.dayScore, { color: scoreColor }]}>
        {day.score ?? '—'}
      </Text>
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
        { key: 'Recovery', value: day.components.recovery },
        { key: 'Sleep',    value: day.components.sleep    },
        { key: 'Stress',   value: day.components.stress   },
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
            <Text style={styles.dayDetailPillText}>Sleep {formatDuration(day.sleepMinutes)}</Text>
          </View>
        )}
        {day.rhr != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>Resting HR {day.rhr} bpm</Text>
          </View>
        )}
        {day.hrv != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>HRV {day.hrv} ms</Text>
          </View>
        )}
        {day.sleepEfficiency != null && (
          <View style={styles.dayDetailPill}>
            <Text style={styles.dayDetailPillText}>Sleep efficiency {day.sleepEfficiency}%</Text>
          </View>
        )}
        {day.score === null && (
          <Text style={styles.dayNoData}>No data recorded</Text>
        )}
      </View>

      {bars.length > 0 && (
        <View style={styles.dayDetailBars}>
          {bars.map(({ key, value }) => (
            <View key={key} style={styles.dayDetailBarRow}>
              <Text style={styles.dayDetailBarLabel}>{key}</Text>
              <View style={styles.dayDetailBarTrack}>
                <View
                  style={[
                    styles.dayDetailBarFill,
                    { width: `${value}%` as any, backgroundColor: getScoreColor(value) },
                  ]}
                />
              </View>
              <Text style={styles.dayDetailBarValue}>{value}</Text>
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
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color={canGoPrev ? colors.amber[400] : colors.border.default} />
        </TouchableOpacity>
        <Text style={styles.calMonthTitle}>{monthName}</Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          disabled={!canGoNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? colors.amber[400] : colors.border.default} />
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
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(cell.date)}${cell.isToday ? ', today' : ''}${score !== null ? `, readiness ${score}` : ''}`}
                accessibilityState={{ selected: isSelected }}
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
    <TouchableOpacity
      style={styles.weeklyEntryCard}
      onPress={onOpen}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Weekly report. Score trends, component breakdown and actionable tip"
    >
      <View style={styles.weeklyEntryLeft}>
        <View style={styles.weeklyEntryTitleRow}>
          <Text style={styles.weeklyEntryTitle}>Weekly report</Text>
          <Text style={styles.aiTag}>AI</Text>
        </View>
        <Text style={styles.weeklyEntrySub}>
          Score trends, component breakdown & actionable tip
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

// ─── Today Card (free users) ──────────────────────────────────────────────────

function TodayCard({ today }: { today: DayHistory | undefined }) {
  const score      = today?.score ?? null;
  const scoreColor = score !== null ? getScoreColor(score) : colors.text.tertiary;
  const label      = score !== null ? getScoreLabel(score) : 'No data yet';
  const meta = [
    today ? shortDate(today.date) : null,
    today?.sleepMinutes != null ? `${formatDuration(today.sleepMinutes)} sleep` : null,
    today?.rhr != null ? `${today.rhr} bpm` : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.todayCard}>
      <View style={styles.todayLeft}>
        <Text style={styles.todayEyebrow}>TODAY</Text>
        <Text style={styles.todayLabel}>{label}</Text>
        {meta !== '' && <Text style={styles.todayMeta}>{meta}</Text>}
      </View>
      <Text style={[styles.todayScore, { color: scoreColor }]}>{score ?? '—'}</Text>
    </View>
  );
}

// ─── Teaser banner (free users) ───────────────────────────────────────────────

// ─── Range toggle ─────────────────────────────────────────────────────────────

function MetricToggle({
  value,
  onChange,
  history,
}: {
  value:    MetricMode;
  onChange: (v: MetricMode) => void;
  history:  DayHistory[];
}) {
  const opts: { key: MetricMode; label: string; hasData: boolean }[] = [
    { key: 'score', label: 'Score', hasData: history.some(d => d.score !== null) },
    { key: 'hrv',   label: 'HRV',   hasData: history.some(d => d.hrv   !== null) },
    { key: 'sleep', label: 'Sleep', hasData: history.some(d => d.sleepMinutes !== null) },
    { key: 'rhr',   label: 'RHR',   hasData: history.some(d => d.rhr   !== null) },
  ];

  return (
    <View style={styles.metricToggle}>
      {opts.map(opt => {
        const cfg     = METRIC_CONFIG[opt.key];
        const active  = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.metricBtn,
              active && { backgroundColor: cfg.color + '22', borderColor: cfg.color + '66' },
              !opt.hasData && { opacity: 0.35 },
            ]}
            onPress={() => opt.hasData && onChange(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.metricBtnText,
              active && { color: cfg.color, fontWeight: fontWeight.semiBold },
            ]}>
              {opt.label}
            </Text>
            {!opt.hasData && (
              <Text style={styles.metricBtnNoData}>–</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
  const [rangeMode,           setRangeMode]           = useState<RangeMode>('7d');
  const [metricMode,          setMetricMode]          = useState<MetricMode>('score');
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [firstLookOpen,       setFirstLookOpen]       = useState(false);
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
  // The chart and calendar sit flat on the page, so they span the full
  // content width.
  const chartWidth = width - SCREEN_PAD * 2;
  const calCellSize = Math.floor((chartWidth - 6 * CAL_GAP) / 7);

  const todayStr    = localDateStr(new Date());
  const today       = history.find(d => d.date === todayStr);
  const scores      = history.filter(d => d.score !== null).map(d => d.score!);
  const avgScore    = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const bestScore   = scores.length > 0 ? Math.max(...scores) : null;
  const todayScore  = today?.score ?? null;
  const trendVsAvg  = todayScore !== null && avgScore !== null ? todayScore - avgScore : null;
  // Shares useStreak with the Today banner. This screen used to derive its own
  // streak from `history`, which only holds the selected range — so 7D mode
  // capped it at 7 and the two screens reported different numbers for the
  // same thing.
  const { current: streak } = useStreak();

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

  // The day-0 first look, reopenable here for free and Pro alike: every
  // number in it comes from the user's own Health data on the device.
  const firstLookLink = (
    <TouchableOpacity
      onPress={() => { track('first_look_shown', { from: 'history' }); setFirstLookOpen(true); }}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={styles.firstLookLink}
    >
      <Text style={styles.firstLookLinkText}>Your 30-day picture ›</Text>
    </TouchableOpacity>
  );
  const firstLookModal = firstLookOpen && (
    <FirstLookModal onClose={() => setFirstLookOpen(false)} todayScore={todayScore} trialEndsAt={null} reopened />
  );

  // ── Pro layout ───────────────────────────────────────────────────────────────
  if (isPro) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              {dateRangeText ? <Text style={styles.dateRange}>{dateRangeText}</Text> : null}
              <Text style={styles.title}>History</Text>
            </View>
            <View style={styles.headerRight}>
              <RangeToggle value={rangeMode} onChange={setRangeMode} />
              <TouchableOpacity
                style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
                onPress={handleExport}
                disabled={exporting}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Export history as CSV"
              >
                <Ionicons name="download-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.exportBtnText}>CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
          {firstLookLink}

          {/* Chart card — trend or calendar */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>
                {rangeMode === 'cal'
                  ? 'READINESS · THIS MONTH'
                  : `${METRIC_CONFIG[metricMode].label} · ${days} DAYS`}
              </Text>
              {rangeMode !== 'cal' && (
                <Text style={styles.chartUnit}>
                  {METRIC_CONFIG[metricMode].unit}
                </Text>
              )}
            </View>

            {rangeMode !== 'cal' && (
              <MetricToggle value={metricMode} onChange={setMetricMode} history={history} />
            )}

            {rangeMode === 'cal' ? (
              history.length > 0
                ? <CalendarHeatmap history={history} cellSize={calCellSize} />
                : <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>No data yet</Text></View>
            ) : (
              history.length > 0
                ? <TrendChart data={history} chartWidth={chartWidth} metric={metricMode} />
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
          {firstLookModal}

          {/* Patterns / correlations */}
          <View style={styles.correlationsBlock}>
            <CorrelationsCard history={history} />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Daily log */}
          <View style={styles.dayList}>
            <Text style={styles.sectionTitle} accessibilityRole="header">DAILY LOG</Text>
            <Text style={styles.scoreBasis}>
              Scores based on HRV, sleep and resting heart rate. Bars show recovery, sleep and stress.
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
          <View>
            {dateRangeText ? <Text style={styles.dateRange}>{dateRangeText}</Text> : null}
            <Text style={styles.title}>History</Text>
          </View>
        </View>
        {firstLookLink}

        <TodayCard today={today} />

        {/* The 7-day chart is free: it is what turns a one-glance score into a
            daily habit, and the habit is what conversion is downstream of. The
            deeper analysis below it stays Pro. */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartLabel}>READINESS · 7 DAYS</Text>
          </View>
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

        <ProGate
          feature="Daily Log & Deep History"
          description="Per-day breakdowns, 28-day trends, patterns and CSV export of your own data."
          style={styles.proGateBlock}
        >

          <View style={styles.dayList}>
            <Text style={styles.sectionTitle} accessibilityRole="header">DAILY LOG</Text>
            <Text style={styles.scoreBasis}>
              Scores based on HRV, sleep and resting heart rate. Bars show recovery, sleep and stress.
            </Text>
            {[...history].reverse().map(day => (
              <DayRow key={day.date} day={day} isToday={day.date === todayStr} />
            ))}
          </View>
        </ProGate>

        <View style={styles.bottomPad} />
      </ScrollView>
      {firstLookModal}
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    letterSpacing: -0.3,
  },
  dateRange: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.6,
    marginBottom: spacing[1],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Range toggle (3 options)
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 2,
  },
  rangeBtn: {
    height: 30,
    paddingHorizontal: spacing[2.5],
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  rangeBtnActive: {
    backgroundColor: colors.bg.elevated,
  },
  rangeBtnText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  rangeBtnTextActive: {
    color: colors.text.primary,
  },

  // Export button
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    height: 36,
    paddingHorizontal: spacing[2.5],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.5,
  },

  // Weekly report entry: tappable, so it keeps a card
  weeklyEntryCard: {
    ...surface.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    marginBottom: spacing[7],
  },
  weeklyEntryLeft: {
    flex: 1,
    gap: spacing[1],
  },
  weeklyEntryTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
  },
  weeklyEntryTitle: {
    ...typography.title,
  },
  weeklyEntrySub: {
    ...typography.caption,
  },
  aiTag: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: fontWeight.bold,
    color: colors.amber[400],
  },

  // Today block (free)
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[7],
  },
  todayLeft: {
    flex: 1,
    gap: spacing[1],
  },
  todayEyebrow: {
    ...typography.label,
  },
  todayLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },
  todayMeta: {
    ...typography.caption,
  },
  todayScore: {
    fontFamily: fontFamily.numeral,
    fontSize: fontSize['5xl'],
    lineHeight: 68,
    letterSpacing: -1.5,
    paddingLeft: spacing[4],
  },

  proGateBlock: {
    marginBottom: spacing[3],
  },

  // Patterns
  correlationsBlock: {
    marginBottom: spacing[7],
  },

  // Chart block: flat on the page
  chartCard: {
    marginBottom: spacing[5],
  },
  chartHeader: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    marginBottom:   spacing[3],
  },
  chartLabel: {
    ...typography.label,
  },
  chartUnit: {
    color:         colors.text.tertiary,
    fontSize:      fontSize['2xs'],
    letterSpacing: 1,
  },
  // ── Metric toggle ────────────────────────────────────────────────────────
  metricToggle: {
    flexDirection:  'row',
    gap:            spacing[2],
    marginBottom:   spacing[4],
  },
  metricBtn: {
    flex:              1,
    height:            32,
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.border.subtle,
    flexDirection:     'row',
    gap:               2,
  },
  metricBtnText: {
    fontSize:   13,
    color:      colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  metricBtnNoData: {
    fontSize: 11,
    color:    colors.text.tertiary,
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
  calMonthTitle: {
    ...typography.title,
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
    fontSize: fontSize['2xs'],
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
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 15,
  },
  calDayNumToday: {
    color: colors.amber[400],
    fontWeight: fontWeight.bold,
  },
  calCellScore: {
    fontFamily: fontFamily.numeral,
    fontSize: 14,
    lineHeight: 16,
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
    fontSize: 11,
  },

  // ── Day detail card (calendar tap) ────────────────────────────────────────
  dayDetail: {
    ...surface.card,
    marginTop: spacing[4],
    padding: spacing[4],
    gap: spacing[3],
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayDetailLabel: {
    fontSize: 16,
    fontWeight: fontWeight.semiBold,
  },
  dayDetailDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  dayDetailScore: {
    fontFamily: fontFamily.numeral,
    fontSize: fontSize['2xl'],
    letterSpacing: -0.5,
  },
  dayDetailMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dayDetailPill: {
    backgroundColor: colors.bg.tertiary,
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
    color: colors.text.secondary,
    fontSize: 13,
    width: 64,
  },
  dayDetailBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bg.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dayDetailBarFill: {
    height: 4,
    borderRadius: 2,
  },
  dayDetailBarValue: {
    color: colors.text.primary,
    fontFamily: fontFamily.numeral,
    fontSize: 16,
    width: 28,
    textAlign: 'right',
  },

  // Stats row: flat, ruled above and below
  statsRow: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
    marginBottom: spacing[7],
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
    ...typography.label,
    letterSpacing: 1.2,
  },
  statValue: {
    fontFamily: fontFamily.numeral,
    fontSize: fontSize['2xl'],
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  statTrend: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Day list
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing[1],
  },
  firstLookLink: {
    alignSelf:    'flex-start',
    marginBottom: spacing[6],
  },
  firstLookLinkText: {
    color:      colors.amber[400],
    fontSize:   13,
    fontWeight: fontWeight.medium,
  },
  scoreBasis: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    lineHeight: 17,
    marginBottom: spacing[1],
  },
  dayList: {
    gap: 0,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dayDateCol: {
    flex: 1,
    gap: spacing[1],
  },
  dayName: {
    ...typography.title,
  },
  dayNameToday: {
    color: colors.amber[400],
  },
  dayMeta: {
    ...typography.caption,
  },

  // Component bars (in day row)
  compBarsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  compBarWrap: {
    flex: 1,
    gap: 3,
  },
  compBarLabel: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  compBarTrack: {
    height: 3,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  compBarFill: {
    height: 3,
    borderRadius: 1.5,
  },

  dayScore: {
    fontFamily: fontFamily.numeral,
    fontSize: 28,
    letterSpacing: -0.5,
    minWidth: 44,
    textAlign: 'right',
  },
  dayNoData: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
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
