/**
 * widgetBridge
 *
 * Thin TypeScript wrapper around the ReadinessDataBridge native module.
 * Writes today's readiness score to the iOS App Group shared storage so
 * the WidgetKit extension can display it without a network call.
 *
 * Silently no-ops on Android and Expo Go where the native module is absent.
 */

import { NativeModules, Platform } from 'react-native';
import { getScoreLabel } from '@constants/theme';
import type { ReadinessResult } from '@utils/readiness';

const bridge = NativeModules.ReadinessDataBridge as
  | {
      writeScore(
        score:    number,
        label:    string,
        recovery: number,
        sleep:    number,
        stress:   number,
      ): void;
    }
  | undefined;

/**
 * Pushes the latest readiness score to the iOS home screen widget.
 * Call this immediately after computing/updating the readiness result.
 * Any error is swallowed — widget data is best-effort.
 */
export function pushScoreToWidget(result: ReadinessResult): void {
  if (Platform.OS !== 'ios') return;
  if (!bridge?.writeScore)   return;

  const { score, components } = result;

  try {
    bridge.writeScore(
      Math.round(score),
      getScoreLabel(score),
      Math.round(components.recovery),
      Math.round(components.sleep),
      Math.round(components.stress),
    );
  } catch (err) {
    console.warn('[Widget] pushScoreToWidget failed (non-fatal):', err);
  }
}
