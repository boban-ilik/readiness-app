/**
 * readingCheck
 *
 * Finds today's unusual reading (see utils/readingCheck.ts), remembers what
 * the user said about it, and passes both to the coach and the briefing.
 * Answers stay on the device; the reason is also saved as an ordinary day tag.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchHRVByDay, fetchRHRByDay } from '@services/healthkit';
import { loadManualHRVByDay } from '@hooks/useHealthData';
import { loadIllnessEpisodes } from '@services/illnessEpisode';
import { tagEvent, type LifeEvent } from '@services/lifeEvents';
import { addCoachMemory } from '@services/coachMemory';
import { track } from '@services/analytics';
import { excludeIllnessDays } from '@utils/illnessRecovery';
import { localDateStr } from '@utils/index';
import {
  findReadingCheck, CHECK_OPTIONS, ASK_AGAIN_AFTER_DAYS,
  type ReadingCheck, type CheckOption, type Metric, type Direction,
} from '@utils/readingCheck';

export const READING_CHECK_KEY = '@readiness/reading_check_v1';

interface Answered { date: string; metric: Metric; direction: Direction; answer: string }

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

async function loadAnswers(): Promise<Answered[]> {
  try {
    const raw = await AsyncStorage.getItem(READING_CHECK_KEY);
    return raw ? (JSON.parse(raw) as Answered[]) : [];
  } catch {
    return [];
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

export interface ReadingCheckState {
  check:    ReadingCheck;
  /** Set once the user has answered today; the card then shows the reading line */
  answered: CheckOption | null;
}

/** Today's unusual reading and what the user has said about this kind of reading recently. */
async function evaluate(hrv: number | null, rhr: number | null): Promise<{
  check: ReadingCheck; todays: Answered | null; recent: Answered | null;
} | null> {
  if (hrv == null && rhr == null) return null;
  const today = localDateStr();
  const empty: Record<string, number> = {};
  const [fromHealth, manual, rhrByDay, episodes, answers] = await Promise.all([
    withTimeout(fetchHRVByDay(30), 8_000, empty),
    loadManualHRVByDay(30),
    withTimeout(fetchRHRByDay(30), 8_000, empty),
    loadIllnessEpisodes(),
    loadAnswers(),
  ]);
  // Usual = the last 30 days without today and without sick days
  const history = (byDay: Record<string, number>) =>
    Object.entries(excludeIllnessDays(byDay, episodes, today)).filter(([d]) => d < today).map(([, v]) => v);

  const check = findReadingCheck({
    hrv, hrvHistory: history({ ...fromHealth, ...manual }),
    rhr, rhrHistory: history(rhrByDay),
  });
  if (!check) return null;

  const same = answers.filter(a => a.metric === check.metric && a.direction === check.direction);
  return {
    check,
    todays: same.find(a => a.date === today) ?? null,
    recent: same.find(a => a.date > daysAgo(ASK_AGAIN_AFTER_DAYS)) ?? null,   // newest first
  };
}

function optionFor(check: ReadingCheck, key: string | undefined): CheckOption | null {
  return CHECK_OPTIONS[`${check.metric}_${check.direction}`].find(o => o.key === key) ?? null;
}

/**
 * What the Today card should show: the question, today's answer with its
 * explanation, or nothing. Nothing while the same kind of reading was answered
 * or dismissed in the last 7 days, so a new normal isn't asked about daily.
 */
export async function loadReadingCheck(hrv: number | null, rhr: number | null): Promise<ReadingCheckState | null> {
  const e = await evaluate(hrv, rhr);
  if (!e) return null;
  if (e.todays) {
    const option = optionFor(e.check, e.todays.answer);
    return option ? { check: e.check, answered: option } : null;   // dismissed today
  }
  return e.recent ? null : { check: e.check, answered: null };
}

async function remember(check: ReadingCheck, answer: string): Promise<void> {
  const answers = await loadAnswers();
  const next = [{ date: localDateStr(), metric: check.metric, direction: check.direction, answer }, ...answers].slice(0, 20);
  await AsyncStorage.setItem(READING_CHECK_KEY, JSON.stringify(next)).catch(() => {});
}

/** Save the user's reason: as a day tag, and as a coach memory when it is a lasting change. */
export async function answerReadingCheck(check: ReadingCheck, option: CheckOption): Promise<LifeEvent | null> {
  await remember(check, option.key);
  track('reading_check_answered');
  if (option.remember) addCoachMemory([option.remember]).catch(() => {});
  return tagEvent(option.tag, option.note).catch(() => null);
}

export async function dismissReadingCheck(check: ReadingCheck): Promise<void> {
  await remember(check, 'dismissed');
}

/**
 * What the coach and briefing are told; null when today's readings are in
 * range. Unlike the card this ignores the 7-day quiet period: the coach still
 * hears that the reading is unusual, with the reason given earlier that week.
 */
export async function readingCheckContext(hrv: number | null, rhr: number | null): Promise<{
  metric: Metric; direction: Direction; value: number; usualLow: number; usualHigh: number; reason: string | null;
} | null> {
  const e = await evaluate(hrv, rhr);
  if (!e) return null;
  const said = optionFor(e.check, (e.todays ?? e.recent)?.answer);
  return {
    metric: e.check.metric, direction: e.check.direction, value: Math.round(e.check.value),
    usualLow: e.check.range.low, usualHigh: e.check.range.high,
    reason: said && said.key !== 'not_sure' ? said.label : null,
  };
}
