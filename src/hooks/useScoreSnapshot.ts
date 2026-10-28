import { useEffect, useState } from 'react';
import { getScoreSnapshot, subscribeScoreSnapshot, type ScoreSnapshot } from '@services/scoreSession';

/** The latest score and its working, updated whenever Today re-scores. */
export function useScoreSnapshot(): ScoreSnapshot | null {
  const [snap, setSnap] = useState<ScoreSnapshot | null>(getScoreSnapshot());
  useEffect(() => subscribeScoreSnapshot(setSnap), []);
  return snap;
}
