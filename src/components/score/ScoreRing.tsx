import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, duration } from '@constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;        // 0–100
  size?: number;        // diameter in px
  strokeWidth?: number;
  color: string;        // ring colour from getScoreColor()
}

export default function ScoreRing({
  score,
  size = 240,
  strokeWidth = 14,
  color,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: duration.verySlow,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  // Derive stroke color from the same progress value that drives the fill.
  // This means the arc colour and fill always move in sync — no snap on mount.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    stroke: interpolateColor(
      progress.value,
      [0,    0.20,                    0.40,                  0.60,                0.80,               1.0               ],
      [      colors.score.critical,   colors.score.poor,     colors.score.fair,   colors.score.good,  colors.score.optimal, colors.score.optimal],
    ),
  }));

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.amber[300]} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.bg.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc — color + fill both driven by animatedProps */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          // Start from the top (12 o'clock position)
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
