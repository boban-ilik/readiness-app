/**
 * widgetBridge
 *
 * Thin TypeScript wrapper around the ReadinessDataBridge Expo module
 * (modules/readiness-data-bridge).
 * Writes today's readiness score to the iOS App Group shared storage so
 * the WidgetKit extension can display it without a network call.
 *
 * Silently no-ops on Android and Expo Go where the native module is absent.
 */

import { Platform } from 'react-native';
import { getScoreLabel } from '@constants/theme';
import { getTrainingRecommendation } from '@utils/training';
import type { ReadinessResult } from '@utils/readiness';
import bridge from '../../modules/readiness-data-bridge';

// While a Sick episode is recovering, the widget's training call is capped
// the same way as Today's. Set by useIllnessRecovery; re-pushes the last score.
let illnessCap = false;
let lastResult: ReadinessResult | null = null;

export function setWidgetIllnessCap(on: boolean): void {
  if (on === illnessCap) return;
  illnessCap = on;
  if (lastResult) pushScoreToWidget(lastResult);
}

export function pushScoreToWidget(result: ReadinessResult): void {
  lastResult = result;
  if (Platform.OS !== 'ios') return;
  if (!bridge) return;

  const { score, components } = result;

  try {
    const training = getTrainingRecommendation(score, components, { illnessCap });
    bridge.writeScore(
      Math.round(score),
      getScoreLabel(score),
      Math.round(components.recovery),
      Math.round(components.sleep),
      Math.round(components.stress),
      training.headline,
      training.zone,
    );
  } catch (err) {
    console.warn('[Widget] pushScoreToWidget failed (non-fatal):', err);
  }
}
