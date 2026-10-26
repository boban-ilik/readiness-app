/**
 * useIllnessRecovery
 *
 * Today-screen state for "back from illness": the running episode and how
 * close resting HR and HRV are to their pre-illness usual, whether to cap the
 * training call, and the "feeling unwell?" prompt when no episode is running.
 * Rules live in utils/illnessRecovery.ts, storage in services/illnessEpisode.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { getRHRByDay as fetchRHRByDay } from '@services/healthSource';
import {
  loadIllnessEpisodes, evaluateActiveIllness, startIllnessEpisode, endIllnessEpisode,
  isIllnessNudgeSnoozed, snoozeIllnessNudge,
} from '@services/illnessEpisode';
import {
  shouldSuggestSickTag, excludeIllnessDays,
  type IllnessEpisode, type RecoveryStatus,
} from '@utils/illnessRecovery';
import { computeRHRBaseline, localDateStr } from '@utils/index';
import { setWidgetIllnessCap } from '@services/widgetBridge';
import { withTimeout } from '@hooks/useHealthData';
import { track, trackDaily } from '@services/analytics';

const EMPTY: Record<string, number> = {};

export interface IllnessRecovery {
  episode:      IllnessEpisode | null;
  status:       RecoveryStatus | null;
  /** bpm above usual on each of the last two days, when the prompt should show */
  nudge:        { elevation: number } | null;
  /** Hold the training call at Easy Day */
  capTraining:  boolean;
  start:        (source: IllnessEpisode['source']) => Promise<void>;
  end:          () => Promise<void>;
  dismissNudge: () => Promise<void>;
  reload:       () => void;
}

/** @param reloadKey changes whenever Today's health data refreshes */
export function useIllnessRecovery(reloadKey: unknown): IllnessRecovery {
  const [episode, setEpisode] = useState<IllnessEpisode | null>(null);
  const [status,  setStatus]  = useState<RecoveryStatus | null>(null);
  const [nudge,   setNudge]   = useState<{ elevation: number } | null>(null);
  const [tick,    setTick]    = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const active = await evaluateActiveIllness();
      if (active) {
        if (cancelled) return;
        setEpisode(active.episode);
        setStatus(active.status);
        setNudge(null);
        return;
      }

      const today    = localDateStr();
      const episodes = await loadIllnessEpisodes();

      if (!cancelled) { setEpisode(null); setStatus(null); }
      if (await isIllnessNudgeSnoozed()) { if (!cancelled) setNudge(null); return; }

      // Usual resting HR from the 30 days before the two days being judged
      const rhr = await withTimeout(fetchRHRByDay(31), 8_000, EMPTY);
      const yesterday = localDateStr(new Date(Date.now() - 86_400_000));
      const prior = Object.entries(excludeIllnessDays(rhr, episodes, today))
        .filter(([d]) => d < yesterday)
        .map(([, v]) => v);
      const check = prior.length >= 7
        ? shouldSuggestSickTag(rhr, computeRHRBaseline(prior), today)
        : { suggest: false, elevation: null };
      if (cancelled) return;
      if (check.suggest && check.elevation != null) {
        setNudge({ elevation: check.elevation });
        trackDaily('illness_nudge_shown');
      } else {
        setNudge(null);
      }
    })().catch(e => console.warn('[IllnessRecovery] load failed:', e));

    return () => { cancelled = true; };
  }, [reloadKey, tick]);

  const capTraining = status?.state === 'recovering';

  useEffect(() => { setWidgetIllnessCap(capTraining); }, [capTraining]);

  const start = useCallback(async (source: IllnessEpisode['source']) => {
    const { episode: ep, created } = await startIllnessEpisode(source);
    if (created) {
      track('illness_tracking_started', { source, hasRhr: ep.baseline.rhr != null, hasHrv: ep.baseline.hrv != null });
    }
    reload();
  }, [reload]);

  const end = useCallback(async () => {
    if (!episode) return;
    track('illness_ended', { recovered: status?.state === 'recovered' });
    await endIllnessEpisode(episode.startDate);
    reload();
  }, [episode, status, reload]);

  const dismissNudge = useCallback(async () => {
    track('illness_nudge_dismissed');
    await snoozeIllnessNudge();
    setNudge(null);
  }, []);

  return { episode, status, nudge, capTraining, start, end, dismissNudge, reload };
}
