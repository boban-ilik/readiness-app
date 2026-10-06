/**
 * useReadingCheck
 *
 * Today-screen state for "ask before judging": whether today's HRV or resting
 * heart rate is unusual for this user, and what they said about it. Rules in
 * utils/readingCheck.ts, storage in services/readingCheck.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  loadReadingCheck, answerReadingCheck, dismissReadingCheck, type ReadingCheckState, type AnswerResult,
} from '@services/readingCheck';
import type { CheckOption } from '@utils/readingCheck';
import { trackDaily } from '@services/analytics';

export interface UseReadingCheck {
  state:   ReadingCheckState | null;
  /** The answer being replaced while the user picks again; null otherwise */
  changing: CheckOption | null;
  /** Saves the reason; resolves with the day tag created and anything it replaced */
  answer:  (option: CheckOption) => Promise<AnswerResult | null>;
  /** Show the options again so today's answer can be changed */
  change:  () => void;
  /** Keep today's answer after all */
  cancelChange: () => void;
  dismiss: () => Promise<void>;
}

/** @param reloadKey changes whenever Today's health data refreshes */
export function useReadingCheck(hrv: number | null, rhr: number | null, reloadKey: unknown): UseReadingCheck {
  const [state, setState] = useState<ReadingCheckState | null>(null);
  const [changing, setChanging] = useState<CheckOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadReadingCheck(hrv, rhr)
      .then(s => {
        if (cancelled) return;
        setState(s);
        if (s && !s.answered) trackDaily('reading_check_shown');
      })
      .catch(() => { if (!cancelled) setState(null); });
    return () => { cancelled = true; };
  }, [hrv, rhr, reloadKey]);

  const answer = useCallback(async (option: CheckOption) => {
    if (!state) return null;
    setChanging(null);
    setState({ check: state.check, answered: option });
    return answerReadingCheck(state.check, option);
  }, [state]);

  const change = useCallback(() => {
    if (!state?.answered) return;
    setChanging(state.answered);
    setState({ check: state.check, answered: null });
  }, [state]);

  const cancelChange = useCallback(() => {
    if (!state || !changing) return;
    setState({ check: state.check, answered: changing });
    setChanging(null);
  }, [state, changing]);

  const dismiss = useCallback(async () => {
    if (!state) return;
    setState(null);
    await dismissReadingCheck(state.check);
  }, [state]);

  return { state, changing, answer, change, cancelChange, dismiss };
}
