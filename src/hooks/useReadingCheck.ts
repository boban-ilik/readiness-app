/**
 * useReadingCheck
 *
 * Today-screen state for "ask before judging": whether today's HRV or resting
 * heart rate is unusual for this user, and what they said about it. Rules in
 * utils/readingCheck.ts, storage in services/readingCheck.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  loadReadingCheck, answerReadingCheck, dismissReadingCheck, type ReadingCheckState,
} from '@services/readingCheck';
import type { CheckOption } from '@utils/readingCheck';
import type { LifeEvent } from '@services/lifeEvents';
import { trackDaily } from '@services/analytics';

export interface UseReadingCheck {
  state:   ReadingCheckState | null;
  /** Saves the reason; resolves with the day tag that was created, if any */
  answer:  (option: CheckOption) => Promise<LifeEvent | null>;
  dismiss: () => Promise<void>;
}

/** @param reloadKey changes whenever Today's health data refreshes */
export function useReadingCheck(hrv: number | null, rhr: number | null, reloadKey: unknown): UseReadingCheck {
  const [state, setState] = useState<ReadingCheckState | null>(null);

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
    setState({ check: state.check, answered: option });
    return answerReadingCheck(state.check, option);
  }, [state]);

  const dismiss = useCallback(async () => {
    if (!state) return;
    setState(null);
    await dismissReadingCheck(state.check);
  }, [state]);

  return { state, answer, dismiss };
}
