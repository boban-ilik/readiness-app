/**
 * "New today": one specific thing from the user's own data on each morning
 * of their first week, so there is a reason to open the app on day 2, 3 and 4.
 * Picked in a fixed order; when nothing real happened it returns null rather
 * than inventing a reason.
 */

export type NewTodayKind = 'unusual' | 'forecast_check' | 'personal_best' | 'try_coach' | 'try_trend';

export interface NewToday {
  kind: NewTodayKind;
  text: string;
}

export interface NewTodayInput {
  todayScore: number;
  /** Today's unusual reading, if the "Unusual for you" card is asking about one */
  unusual:    { metric: 'hrv' | 'rhr'; direction: 'high' | 'low' } | null;
  /** What yesterday's forecast said about today */
  forecast:   { score: number; low: number; high: number } | null;
  /** Scores of the last 30 days, today excluded */
  pastScores: number[];
  /** Features already opened at least once */
  opened:     { coach: boolean; trend: boolean };
  /** Whether the trend card is on screen (Pro, including the free week) */
  trendShown: boolean;
}

/** A personal best only means something against a week or more of mornings. */
const MIN_PAST_FOR_BEST = 7;

export function pickNewToday(i: NewTodayInput): NewToday | null {
  const s = Math.round(i.todayScore);
  if (s <= 0) return null;

  if (i.unusual) {
    const what  = i.unusual.metric === 'hrv' ? 'HRV' : 'resting heart rate';
    const where = i.unusual.direction === 'high' ? 'above' : 'below';
    return { kind: 'unusual', text: `Your ${what} is ${where} your usual range today. There's a question about it below.` };
  }

  if (i.forecast) {
    const f = Math.round(i.forecast.score);
    const how = s > i.forecast.high ? 'higher than we expected'
              : s < i.forecast.low  ? 'lower than we expected'
              : 'inside the range we gave';
    return { kind: 'forecast_check', text: `Yesterday we forecast ${f} for today. You're at ${s}, ${how}.` };
  }

  if (i.pastScores.length >= MIN_PAST_FOR_BEST && s > Math.max(...i.pastScores)) {
    return { kind: 'personal_best', text: `${s} is your best morning in the last 30 days.` };
  }

  if (!i.opened.coach) {
    return { kind: 'try_coach', text: `Ask your coach what ${s} means for today's training ›` };
  }
  if (!i.opened.trend && i.trendShown) {
    return { kind: 'try_trend', text: 'Tap the Weekly Trend card below to see your last 7 days and the next 3.' };
  }
  return null;
}
