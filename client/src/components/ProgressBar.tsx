// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Shared segmented and continuous progress rendering

import { View, type StyleProp, type ViewStyle } from 'react-native';

type ProgressBarProps = {
  current: number;
  total: number;
  variant?: 'segmented' | 'continuous';
  style?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  fillStyle?: StyleProp<ViewStyle>;
  accessible?: boolean;
};

export function ProgressBar({
  current, total, variant = 'segmented', style, trackStyle, fillStyle, accessible = true,
}: ProgressBarProps) {
  return (
    <View
      accessibilityRole={accessible ? 'progressbar' : undefined}
      accessibilityValue={accessible ? { min: 1, max: total, now: current } : undefined}
      style={style}
    >
      {variant === 'continuous'
        ? <View style={[trackStyle, fillStyle, { width: `${(current / total) * 100}%` }]} />
        : Array.from({ length: total }, (_, index) => (
          <View key={index} style={[trackStyle, index < current && fillStyle]} />
        ))}
    </View>
  );
}
