/**
 * Motion helpers that respect the OS "Reduce Motion" setting.
 *
 * Skeleton shimmers pulse opacity on a loop; users who asked iOS for reduced
 * motion shouldn't get an endlessly pulsing placeholder. These helpers start
 * the animation only when motion is allowed.
 */

import { Animated, AccessibilityInfo } from 'react-native';

/**
 * Starts a gentle opacity pulse on `value`, unless reduced motion is on.
 * Returns a stop function for use as an effect cleanup.
 */
export function startSkeletonPulse(
  value: Animated.Value,
  low: number,
  high: number,
  duration: number,
): () => void {
  let loop: Animated.CompositeAnimation | null = null;
  let stopped = false;

  AccessibilityInfo.isReduceMotionEnabled()
    .then((reduced) => {
      if (stopped || reduced) return;
      value.setValue(low);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: high, duration, useNativeDriver: true }),
          Animated.timing(value, { toValue: low, duration, useNativeDriver: true }),
        ]),
      );
      loop.start();
    })
    .catch(() => {});

  return () => {
    stopped = true;
    loop?.stop();
  };
}
